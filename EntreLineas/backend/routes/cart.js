import { Router } from "express";
import db from "../db/index.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Helper: obtener o crear el carrito del usuario
// ─────────────────────────────────────────────────────────────────────────────
async function getOrCreateCart(userId) {
  let result = await db.query(
    "SELECT id FROM carrito WHERE usuario_id = $1",
    [userId]
  );

  if (result.rows.length === 0) {
    result = await db.query(
      "INSERT INTO carrito (usuario_id) VALUES ($1) RETURNING id",
      [userId]
    );
  }

  return result.rows[0].id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: upsert libro en tabla libros (libros de Open Library aún no están
// en la DB, se insertan la primera vez que se agregan al carrito)
// ─────────────────────────────────────────────────────────────────────────────
async function upsertLibro({ titulo, autor, isbn, portada_url, precio }) {
  // Intentar por ISBN primero
  if (isbn) {
    const byIsbn = await db.query(
      "SELECT id FROM libros WHERE isbn = $1",
      [isbn]
    );
    if (byIsbn.rows.length > 0) return byIsbn.rows[0].id;
  }

  // Luego por título + autor
  const byTitle = await db.query(
    "SELECT id FROM libros WHERE LOWER(titulo) = LOWER($1) AND LOWER(autor) = LOWER($2)",
    [titulo, autor]
  );
  if (byTitle.rows.length > 0) return byTitle.rows[0].id;

  // Insertar nuevo libro
  const ins = await db.query(
    `INSERT INTO libros (titulo, autor, isbn, portada_url, precio, stock_general, estado)
     VALUES ($1, $2, $3, $4, $5, 999, 'disponible')
     RETURNING id`,
    [titulo, autor, isbn || null, portada_url || null, precio]
  );
  return ins.rows[0].id;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/cart
// Devuelve el carrito completo del usuario (con detalles de cada libro)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", verifyToken, async (req, res) => {
  try {
    const carritoId = await getOrCreateCart(req.user.id);

    const items = await db.query(
      `SELECT
         ci.id,
         ci.libro_id,
         ci.cantidad,
         ci.precio_unitario,
         l.titulo,
         l.autor,
         l.portada_url
       FROM carrito_items ci
       JOIN libros l ON ci.libro_id = l.id
       WHERE ci.carrito_id = $1
       ORDER BY ci.added_at ASC`,
      [carritoId]
    );

    return res.json({ carrito_id: carritoId, items: items.rows });
  } catch (err) {
    console.error("Error en GET /api/cart:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cart/items
// Agrega un libro al carrito (o incrementa cantidad si ya existe)
// Body: { titulo, autor, isbn?, portada_url?, precio_unitario, cantidad? }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/items", verifyToken, async (req, res) => {
  const { titulo, autor, isbn, portada_url, precio_unitario, cantidad = 1 } = req.body;

  if (!titulo || !autor || !precio_unitario) {
    return res.status(400).json({ error: "titulo, autor y precio_unitario son obligatorios." });
  }

  try {
    const carritoId = await getOrCreateCart(req.user.id);
    const libroId = await upsertLibro({ titulo, autor, isbn, portada_url, precio: precio_unitario });

    // Upsert en carrito_items
    await db.query(
      `INSERT INTO carrito_items (carrito_id, libro_id, cantidad, precio_unitario)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (carrito_id, libro_id)
       DO UPDATE SET
         cantidad = carrito_items.cantidad + EXCLUDED.cantidad,
         precio_unitario = EXCLUDED.precio_unitario`,
      [carritoId, libroId, cantidad, precio_unitario]
    );

    // Actualizar timestamp del carrito
    await db.query(
      "UPDATE carrito SET fecha_ultima_actualizacion = NOW() WHERE id = $1",
      [carritoId]
    );

    // Devolver el carrito actualizado
    const items = await db.query(
      `SELECT ci.id, ci.libro_id, ci.cantidad, ci.precio_unitario,
              l.titulo, l.autor, l.portada_url
       FROM carrito_items ci
       JOIN libros l ON ci.libro_id = l.id
       WHERE ci.carrito_id = $1
       ORDER BY ci.added_at ASC`,
      [carritoId]
    );

    return res.status(201).json({ carrito_id: carritoId, items: items.rows });
  } catch (err) {
    console.error("Error en POST /api/cart/items:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/cart/items/:libroId
// Actualiza la cantidad de un item. Si cantidad <= 0, elimina el item.
// Body: { cantidad }
// ─────────────────────────────────────────────────────────────────────────────
router.put("/items/:libroId", verifyToken, async (req, res) => {
  const libroId = parseInt(req.params.libroId, 10);
  const { cantidad } = req.body;

  if (cantidad == null || isNaN(cantidad)) {
    return res.status(400).json({ error: "cantidad es obligatoria." });
  }

  try {
    const carritoId = await getOrCreateCart(req.user.id);

    if (cantidad <= 0) {
      await db.query(
        "DELETE FROM carrito_items WHERE carrito_id = $1 AND libro_id = $2",
        [carritoId, libroId]
      );
    } else {
      await db.query(
        `UPDATE carrito_items SET cantidad = $1
         WHERE carrito_id = $2 AND libro_id = $3`,
        [cantidad, carritoId, libroId]
      );
    }

    await db.query(
      "UPDATE carrito SET fecha_ultima_actualizacion = NOW() WHERE id = $1",
      [carritoId]
    );

    const items = await db.query(
      `SELECT ci.id, ci.libro_id, ci.cantidad, ci.precio_unitario,
              l.titulo, l.autor, l.portada_url
       FROM carrito_items ci
       JOIN libros l ON ci.libro_id = l.id
       WHERE ci.carrito_id = $1
       ORDER BY ci.added_at ASC`,
      [carritoId]
    );

    return res.json({ carrito_id: carritoId, items: items.rows });
  } catch (err) {
    console.error("Error en PUT /api/cart/items/:libroId:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/cart/items/:libroId
// Elimina un item del carrito
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/items/:libroId", verifyToken, async (req, res) => {
  const libroId = parseInt(req.params.libroId, 10);

  try {
    const carritoId = await getOrCreateCart(req.user.id);

    await db.query(
      "DELETE FROM carrito_items WHERE carrito_id = $1 AND libro_id = $2",
      [carritoId, libroId]
    );

    await db.query(
      "UPDATE carrito SET fecha_ultima_actualizacion = NOW() WHERE id = $1",
      [carritoId]
    );

    const items = await db.query(
      `SELECT ci.id, ci.libro_id, ci.cantidad, ci.precio_unitario,
              l.titulo, l.autor, l.portada_url
       FROM carrito_items ci
       JOIN libros l ON ci.libro_id = l.id
       WHERE ci.carrito_id = $1
       ORDER BY ci.added_at ASC`,
      [carritoId]
    );

    return res.json({ carrito_id: carritoId, items: items.rows });
  } catch (err) {
    console.error("Error en DELETE /api/cart/items/:libroId:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/cart
// Vacía todo el carrito
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/", verifyToken, async (req, res) => {
  try {
    const carritoId = await getOrCreateCart(req.user.id);

    await db.query(
      "DELETE FROM carrito_items WHERE carrito_id = $1",
      [carritoId]
    );

    await db.query(
      "UPDATE carrito SET fecha_ultima_actualizacion = NOW() WHERE id = $1",
      [carritoId]
    );

    return res.json({ message: "Carrito vaciado.", carrito_id: carritoId, items: [] });
  } catch (err) {
    console.error("Error en DELETE /api/cart:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

export default router;
