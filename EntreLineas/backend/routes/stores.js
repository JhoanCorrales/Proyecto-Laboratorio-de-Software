import { Router } from "express";
import db from "../db/index.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

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

export default router;
