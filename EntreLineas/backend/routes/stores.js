import { Router } from "express";
import db from "../db/index.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

/**
 * Función auxiliar para actualizar el stock global de un libro
 * Suma el stock de todas las tiendas y actualiza la columna stock_general en la tabla libros.
 */
async function updateGlobalStock(libroId) {
  try {
    await db.updateGlobalStock(libroId);
  } catch (error) {
    console.error("Error in stores.js updateGlobalStock delegator:", error);
  }
}

/**
 * GET /api/stores
 * Obtiene todas las tiendas (público)
 */
router.get("/", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id,
        nombre,
        direccion,
        ciudad,
        departamento,
        codigo_postal,
        telefono,
        email,
        horario_atencion,
        latitud,
        longitud,
        estado,
        created_at,
        updated_at
      FROM tiendas
      WHERE estado = 'activa'
      ORDER BY nombre ASC
    `);

    res.status(200).json({
      success: true,
      stores: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching stores:", error);
    res.status(500).json({ error: "Error al obtener tiendas", message: error.message });
  }
});

/**
 * GET /api/stores/:id
 * Obtiene una tienda por ID (público)
 */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT * FROM tiendas WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Tienda no encontrada" });
    }

    res.status(200).json({
      success: true,
      store: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching store:", error);
    res.status(500).json({ error: "Error al obtener tienda", message: error.message });
  }
});

/**
 * POST /api/stores
 * Crea una nueva tienda (requiere rol Administrador)
 * Body: { nombre, direccion, ciudad, departamento, codigo_postal, telefono, email, horario_atencion, latitud, longitud }
 */
router.post("/", verifyToken, requireRole("Administrador"), async (req, res) => {
  const {
    nombre,
    direccion,
    ciudad,
    departamento,
    codigo_postal,
    telefono,
    email,
    horario_atencion,
    latitud,
    longitud,
  } = req.body;

  // Validar campos requeridos
  if (!nombre || !direccion || !ciudad || !departamento || !telefono || !email || latitud === undefined || longitud === undefined) {
    return res.status(400).json({
      error: "Campos requeridos: nombre, direccion, ciudad, departamento, telefono, email, latitud, longitud",
    });
  }

  // Validar que sea Pereira
  if (ciudad !== "Pereira") {
    return res.status(400).json({ error: "Las tiendas solo pueden crearse en Pereira" });
  }

  try {
    const result = await db.query(
      `INSERT INTO tiendas (nombre, direccion, ciudad, departamento, codigo_postal, telefono, email, horario_atencion, latitud, longitud, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'activa')
       RETURNING *`,
      [
        nombre.trim(),
        direccion.trim(),
        ciudad,
        departamento,
        codigo_postal || "660001",
        telefono.trim(),
        email.toLowerCase().trim(),
        horario_atencion || null,
        latitud,
        longitud,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Tienda creada exitosamente",
      store: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating store:", error);
    res.status(500).json({ error: "Error al crear tienda", message: error.message });
  }
});

/**
 * PUT /api/stores/:id
 * Actualiza una tienda (requiere rol Administrador)
 */
router.put("/:id", verifyToken, requireRole("Administrador"), async (req, res) => {
  const { id } = req.params;
  const { nombre, direccion, ciudad, departamento, codigo_postal, telefono, email, horario_atencion, latitud, longitud } = req.body;

  try {
    // Verificar que la tienda existe
    const existingStore = await db.query("SELECT * FROM tiendas WHERE id = $1", [id]);
    if (existingStore.rows.length === 0) {
      return res.status(404).json({ error: "Tienda no encontrada" });
    }

    const store = existingStore.rows[0];

    // Preparar datos para actualización (usar valores existentes si no se proporcionan)
    const updateData = {
      nombre: nombre !== undefined ? nombre.trim() : store.nombre,
      direccion: direccion !== undefined ? direccion.trim() : store.direccion,
      ciudad: ciudad || store.ciudad,
      departamento: departamento || store.departamento,
      codigo_postal: codigo_postal || store.codigo_postal,
      telefono: telefono !== undefined ? telefono.trim() : store.telefono,
      email: email !== undefined ? email.toLowerCase().trim() : store.email,
      horario_atencion: horario_atencion !== undefined ? horario_atencion : store.horario_atencion,
      latitud: latitud !== undefined ? latitud : store.latitud,
      longitud: longitud !== undefined ? longitud : store.longitud,
    };

    const result = await db.query(
      `UPDATE tiendas 
       SET nombre = $1, direccion = $2, ciudad = $3, departamento = $4, codigo_postal = $5, 
           telefono = $6, email = $7, horario_atencion = $8, latitud = $9, longitud = $10, updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        updateData.nombre,
        updateData.direccion,
        updateData.ciudad,
        updateData.departamento,
        updateData.codigo_postal,
        updateData.telefono,
        updateData.email,
        updateData.horario_atencion,
        updateData.latitud,
        updateData.longitud,
        id,
      ]
    );

    res.status(200).json({
      success: true,
      message: "Tienda actualizada exitosamente",
      store: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating store:", error);
    res.status(500).json({ error: "Error al actualizar tienda", message: error.message });
  }
});

/**
 * DELETE /api/stores/:id
 * Elimina una tienda (requiere rol Administrador)
 */
router.delete("/:id", verifyToken, requireRole("Administrador"), async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar que la tienda existe
    const existingStore = await db.query("SELECT * FROM tiendas WHERE id = $1", [id]);
    if (existingStore.rows.length === 0) {
      return res.status(404).json({ error: "Tienda no encontrada" });
    }

    // En lugar de eliminar, marcamos como inactiva
    const result = await db.query(
      `UPDATE tiendas SET estado = 'inactiva', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    res.status(200).json({
      success: true,
      message: "Tienda eliminada exitosamente",
      store: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting store:", error);
    res.status(500).json({ error: "Error al eliminar tienda", message: error.message });
  }
});

/**
 * GET /api/stores/:storeId/inventory
 * Obtiene el inventario de una tienda (libros con stock)
 */
router.get("/:storeId/inventory", verifyToken, requireRole("Administrador"), async (req, res) => {
  const { storeId } = req.params;

  try {
    const result = await db.query(`
      SELECT 
        it.id,
        it.tienda_id,
        it.libro_id,
        it.cantidad_disponible as stock,
        it.cantidad_minima,
        it.cantidad_maxima,
        l.id,
        l.titulo,
        l.autor,
        l.isbn,
        l.editorial,
        l.año,
        l.genero,
        l.numero_paginas as paginas,
        l.idioma,
        l.fecha_publicacion,
        l.precio,
        l.portada_url
      FROM inventario_tienda it
      JOIN libros l ON it.libro_id = l.id
      WHERE it.tienda_id = $1
      ORDER BY l.titulo ASC
    `, [storeId]);

    res.status(200).json({
      success: true,
      inventory: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching store inventory:", error);
    res.status(500).json({ error: "Error al obtener inventario", message: error.message });
  }
});

/**
 * POST /api/stores/:storeId/inventory
 * Agrega un libro al inventario de una tienda
 * Body: { libro_id, cantidad_disponible, precio_unitario, cantidad_minima?, cantidad_maxima? }
 */
router.post("/:storeId/inventory", verifyToken, requireRole("Administrador"), async (req, res) => {
  const { storeId } = req.params;
  const { libro_id, cantidad_disponible, precio_unitario, cantidad_minima = 5, cantidad_maxima = 100 } = req.body;

  try {
    // Validar campos requeridos
    if (!libro_id || !cantidad_disponible || precio_unitario === undefined) {
      return res.status(400).json({
        error: "Campos requeridos: libro_id, cantidad_disponible, precio_unitario",
      });
    }

    // Verificar que la tienda existe
    const storeCheck = await db.query("SELECT * FROM tiendas WHERE id = $1", [storeId]);
    if (storeCheck.rows.length === 0) {
      return res.status(404).json({ error: "Tienda no encontrada" });
    }

    // Verificar que el libro existe
    const bookCheck = await db.query("SELECT * FROM libros WHERE id = $1", [libro_id]);
    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ error: "Libro no encontrado" });
    }

    // Insertar o actualizar inventario
    const existingInventory = await db.query(
      "SELECT * FROM inventario_tienda WHERE tienda_id = $1 AND libro_id = $2",
      [storeId, libro_id]
    );

    let result;
    if (existingInventory.rows.length > 0) {
      // Actualizar cantidad
      result = await db.query(
        `UPDATE inventario_tienda 
         SET cantidad_disponible = cantidad_disponible + $1, 
             cantidad_minima = $2,
             cantidad_maxima = $3,
             updated_at = NOW()
         WHERE tienda_id = $4 AND libro_id = $5 
         RETURNING *`,
        [cantidad_disponible, cantidad_minima, cantidad_maxima, storeId, libro_id]
      );
    } else {
      // Insertar nuevo
      result = await db.query(
        `INSERT INTO inventario_tienda 
         (tienda_id, libro_id, cantidad_disponible, cantidad_minima, cantidad_maxima, ultimo_reabastecimiento)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [storeId, libro_id, cantidad_disponible, cantidad_minima, cantidad_maxima]
      );
    }

    // Actualizar stock global del libro en base de datos central
    await updateGlobalStock(libro_id);

    // Obtener datos completos del libro para respuesta
    const fullData = await db.query(`
      SELECT 
        it.id,
        it.tienda_id,
        it.libro_id,
        it.cantidad_disponible as stock,
        it.cantidad_minima,
        it.cantidad_maxima,
        l.titulo,
        l.autor,
        l.isbn,
        l.editorial,
        l.año,
        l.genero,
        l.numero_paginas as paginas,
        l.idioma,
        l.fecha_publicacion
      FROM inventario_tienda it
      JOIN libros l ON it.libro_id = l.id
      WHERE it.id = $1
    `, [result.rows[0].id]);

    res.status(201).json({
      success: true,
      message: "Libro agregado al inventario exitosamente",
      inventory: fullData.rows[0],
    });
  } catch (error) {
    console.error("Error adding to inventory:", error);
    res.status(500).json({ error: "Error al agregar libro al inventario", message: error.message });
  }
});

/**
 * PUT /api/stores/:storeId/inventory/:libroId
 * Actualiza la cantidad en el inventario de una tienda de manera absoluta
 */
router.put("/:storeId/inventory/:libroId", verifyToken, requireRole("Administrador"), async (req, res) => {
  const { storeId, libroId } = req.params;
  const { cantidad_disponible, cantidad_minima = 5, cantidad_maxima = 100 } = req.body;

  try {
    if (cantidad_disponible === undefined) {
      return res.status(400).json({
        error: "Campos requeridos: cantidad_disponible",
      });
    }

    const existingInventory = await db.query(
      "SELECT * FROM inventario_tienda WHERE tienda_id = $1 AND libro_id = $2",
      [storeId, libroId]
    );

    if (existingInventory.rows.length === 0) {
      return res.status(404).json({ error: "El libro no está en el inventario de la tienda" });
    }

    // Actualizar cantidad de manera absoluta en lugar de sumarla
    const result = await db.query(
      `UPDATE inventario_tienda 
       SET cantidad_disponible = $1, 
           cantidad_minima = $2,
           cantidad_maxima = $3,
           updated_at = NOW()
       WHERE tienda_id = $4 AND libro_id = $5 
       RETURNING *`,
      [cantidad_disponible, cantidad_minima, cantidad_maxima, storeId, libroId]
    );

    // Actualizar stock global del libro
    await updateGlobalStock(libroId);

    res.status(200).json({
      success: true,
      message: "Inventario actualizado exitosamente",
      inventory: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating inventory:", error);
    res.status(500).json({ error: "Error al actualizar inventario", message: error.message });
  }
});

export default router;
