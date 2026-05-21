import express from "express";
import db from "../db/index.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/noticias - Obtener noticias publicadas (público o autenticado)
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT n.id, n.titulo, n.contenido, n.resumen, n.fecha_publicacion, n.estado,
             l.titulo as libro_titulo, l.autor as libro_autor, l.editorial as libro_editorial, l.portada_url,
             u.nombre as autor_noticia
      FROM noticias n
      LEFT JOIN libros l ON n.libro_relacionado_id = l.id
      LEFT JOIN usuarios u ON n.creado_por = u.id
      WHERE n.estado = 'publicada' OR n.estado = 'programada'
      ORDER BY n.fecha_publicacion DESC
    `;
    const result = await db.query(query);
    res.json({ noticias: result.rows });
  } catch (err) {
    console.error("Error fetching news:", err);
    res.status(500).json({ error: "Error al cargar las noticias" });
  }
});

// GET /api/noticias/all - Obtener todas las noticias (solo Admin)
router.get("/all", verifyToken, requireRole("Administrador", "Root"), async (req, res) => {
  try {
    const query = `
      SELECT n.*, l.titulo as libro_titulo
      FROM noticias n
      LEFT JOIN libros l ON n.libro_relacionado_id = l.id
      ORDER BY n.created_at DESC
    `;
    const result = await db.query(query);
    res.json({ noticias: result.rows });
  } catch (err) {
    console.error("Error fetching all news:", err);
    res.status(500).json({ error: "Error al cargar las noticias" });
  }
});

// POST /api/noticias - Crear nueva noticia (solo Admin)
router.post("/", verifyToken, requireRole("Administrador", "Root"), async (req, res) => {
  const { titulo, contenido, libro_relacionado_id, fecha_publicacion, estado, resumen } = req.body;
  const usuario_id = req.user.id;

  if (!titulo || !contenido) {
    return res.status(400).json({ error: "Título y contenido son requeridos" });
  }

  try {
    const query = `
      INSERT INTO noticias (titulo, contenido, libro_relacionado_id, creado_por, fecha_publicacion, estado, resumen)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      titulo,
      contenido,
      libro_relacionado_id || null,
      usuario_id,
      fecha_publicacion || new Date(),
      estado || 'publicada',
      resumen || null
    ];
    const result = await db.query(query, values);
    
    res.status(201).json({ message: "Noticia publicada exitosamente", noticia: result.rows[0] });
  } catch (err) {
    console.error("Error creating news:", err);
    res.status(500).json({ error: "Error interno al crear la noticia" });
  }
});

export default router;
