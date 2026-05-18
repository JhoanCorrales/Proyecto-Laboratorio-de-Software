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
         l.portada_url,
         l.stock_general as stock
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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/cart/checkout
// Realiza una compra desde el carrito
// Body: { metodo_pago: 'monedero' | 'tarjeta', tarjeta_id?: number }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/checkout", verifyToken, async (req, res) => {
  const client = await db.connect();
  
  try {
    const { metodo_pago, tarjeta_id } = req.body;

    if (!metodo_pago || !["monedero", "tarjeta"].includes(metodo_pago)) {
      return res.status(400).json({ error: "Método de pago inválido. Use 'monedero' o 'tarjeta'" });
    }

    await client.query("BEGIN");

    // Obtener carrito y verificar que tiene items
    const carritoCheck = await client.query(
      "SELECT id FROM carrito WHERE usuario_id = $1",
      [req.user.id]
    );

    if (carritoCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Carrito no encontrado" });
    }

    const carritoId = carritoCheck.rows[0].id;

    // Obtener items del carrito
    const itemsResult = await client.query(
      `SELECT ci.libro_id, ci.cantidad, ci.precio_unitario
       FROM carrito_items ci
       WHERE ci.carrito_id = $1`,
      [carritoId]
    );

    if (itemsResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "El carrito está vacío" });
    }

    // Calcular total
    const total = itemsResult.rows.reduce(
      (sum, item) => sum + (item.cantidad * item.precio_unitario),
      0
    );

    // Validar método de pago
    if (metodo_pago === "tarjeta") {
      if (!tarjeta_id) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Tarjeta requerida para este método de pago" });
      }

      const tarjetaCheck = await client.query(
        "SELECT estado FROM tarjetas_credito WHERE id = $1 AND usuario_id = $2",
        [tarjeta_id, req.user.id]
      );

      if (tarjetaCheck.rows.length === 0 || tarjetaCheck.rows[0].estado !== "activa") {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Tarjeta no válida o no activa" });
      }
    } else if (metodo_pago === "monedero") {
      // Verificar saldo del monedero
      const monederoCheck = await client.query(
        "SELECT saldo_disponible FROM monedero WHERE usuario_id = $1",
        [req.user.id]
      );

      let saldoDisponible = 0;
      if (monederoCheck.rows.length > 0) {
        saldoDisponible = parseFloat(monederoCheck.rows[0].saldo_disponible);
      }

      if (saldoDisponible < total) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "Saldo insuficiente en el monedero",
          saldo_disponible: saldoDisponible,
          total_requerido: total,
        });
      }
    }

    // Crear compra
    const compraResult = await client.query(
      `INSERT INTO compras (usuario_id, fecha, total, estado_compra, metodo_pago)
       VALUES ($1, CURRENT_DATE, $2, 'confirmada', $3)
       RETURNING id`,
      [req.user.id, total, metodo_pago]
    );

    const compraId = compraResult.rows[0].id;

    // Agregar items de compra
    for (const item of itemsResult.rows) {
      await client.query(
        `INSERT INTO compra_items (compra_id, libro_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [compraId, item.libro_id, item.cantidad, item.precio_unitario, item.cantidad * item.precio_unitario]
      );
    }

    // Si se pagó con monedero, deducir saldo
    if (metodo_pago === "monedero") {
      // Obtener saldo anterior
      const monederoData = await client.query(
        "SELECT saldo_disponible FROM monedero WHERE usuario_id = $1",
        [req.user.id]
      );

      const saldoAnterior = parseFloat(monederoData.rows[0].saldo_disponible);
      const saldoNuevo = saldoAnterior - total;

      // Actualizar saldo del monedero
      await client.query(
        `UPDATE monedero 
         SET saldo_disponible = $1, updated_at = CURRENT_TIMESTAMP
         WHERE usuario_id = $2`,
        [saldoNuevo, req.user.id]
      );

      // Registrar transacción en historial
      await client.query(
        `INSERT INTO transacciones_monedero 
         (usuario_id, tipo_transaccion, monto, saldo_anterior, saldo_nuevo, compra_id, descripcion)
         VALUES ($1, 'compra', $2, $3, $4, $5, $6)`,
        [
          req.user.id,
          total,
          saldoAnterior,
          saldoNuevo,
          compraId,
          `Compra de ${itemsResult.rows.length} libro(s)`,
        ]
      );
    }

    // Vaciar carrito
    await client.query(
      "DELETE FROM carrito_items WHERE carrito_id = $1",
      [carritoId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Compra realizada exitosamente",
      compra: {
        id: compraId,
        total,
        metodo_pago,
        estado: "confirmada",
        fecha: new Date().toISOString(),
        cantidad_libros: itemsResult.rows.length,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error en POST /api/cart/checkout:", err);
    res.status(500).json({ error: "Error al procesar la compra" });
  } finally {
    client.release();
  }
});

export default router;
