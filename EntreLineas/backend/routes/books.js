import express from "express";
import db from "../db/index.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/books
 * Get all books ordered by title
 */
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, titulo, autor, año, genero, numero_paginas as paginas, editorial, isbn, idioma, fecha_publicacion, precio FROM libros ORDER BY titulo ASC"
    );

    res.status(200).json({
      success: true,
      books: result.rows,
      count: result.rows.length,
    });
  } catch (err) {
    console.error("Error fetching books:", err);
    res.status(500).json({ success: false, message: "Error fetching books", error: err.message });
  }
});

/**
 * POST /api/books
 * Add a new book to the database
 */
router.post("/", verifyToken, requireRole("Administrador"), async (req, res) => {
  const { titulo, autor, isbn, editorial, paginas, idioma, año, genero, precio, portada_url, descripcion } = req.body;

  if (!titulo || !autor || precio === undefined) {
    return res.status(400).json({ error: "Título, autor y precio son requeridos" });
  }

  try {
    // Verificar si existe por ISBN
    if (isbn) {
      const existing = await db.query("SELECT * FROM libros WHERE isbn = $1", [isbn]);
      if (existing.rows.length > 0) {
        return res.status(200).json({ success: true, message: "El libro ya existe", book: existing.rows[0] });
      }
    } else {
      // Verificar por título y autor
      const existing = await db.query(
        "SELECT * FROM libros WHERE LOWER(titulo) = LOWER($1) AND LOWER(autor) = LOWER($2)",
        [titulo, autor]
      );
      if (existing.rows.length > 0) {
        return res.status(200).json({ success: true, message: "El libro ya existe", book: existing.rows[0] });
      }
    }

    // Convert category string to categoria_id if an exact match exists, otherwise NULL
    let categoria_id = null;
    if (genero) {
      const catCheck = await db.query("SELECT id FROM categorias WHERE LOWER(nombre) = LOWER($1)", [genero]);
      if (catCheck.rows.length > 0) {
        categoria_id = catCheck.rows[0].id;
      }
    }

    // Parse the year string to a valid date if possible, otherwise use null
    // Assuming año is just the year like "1997"
    let fecha_publicacion = null;
    if (año) {
      fecha_publicacion = `${año}-01-01`; // PostgreSQL DATE format
    }

    const result = await db.query(
        `INSERT INTO libros (titulo, autor, isbn, editorial, precio, descripcion, 
         fecha_publicacion, numero_paginas, idioma, portada_url, categoria_id, año, genero) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
        [titulo, autor, isbn || null, editorial || null, precio || 0, descripcion || null,
         fecha_publicacion, paginas ? parseInt(paginas) : null, idioma || 'Español', portada_url || null, categoria_id, año || null, genero || null]
    );

    res.status(201).json({
      success: true,
      message: "Libro creado exitosamente",
      book: result.rows[0],
    });
  } catch (err) {
    console.error("Error creating book:", err);
    res.status(500).json({ success: false, message: "Error al crear el libro", error: err.message });
  }
});

/**
 * GET /api/books/search?q=query
 * Search books by title (case-insensitive)
 */
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    const result = await db.query(
      "SELECT id, titulo, autor, año, genero, numero_paginas as paginas, editorial, isbn, idioma, fecha_publicacion, precio FROM libros WHERE LOWER(titulo) LIKE LOWER($1) ORDER BY titulo ASC LIMIT 10",
      [`%${q}%`]
    );

    res.status(200).json({
      success: true,
      books: result.rows,
      count: result.rows.length,
    });
  } catch (err) {
    console.error("Error searching books:", err);
    res.status(500).json({ success: false, message: "Error searching books", error: err.message });
  }
});

/**
 * GET /api/books/public
 * Get all books that exist in at least one store inventory
 * Supports pagination, search, logic
 */
router.get("/public", async (req, res) => {
  try {
    const { page = 1, limit = 20, q = "", cat = "", priceMin, priceMax, disponibles } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    let conditions = ["1=1"];
    let values = [];

    if (q.trim()) {
      values.push(`%${q}%`);
      conditions.push(`(LOWER(l.titulo) LIKE LOWER($${values.length}) OR LOWER(l.autor) LIKE LOWER($${values.length}))`);
    }

    if (cat.trim()) {
      values.push(cat.trim());
      // Búsqueda exacta en categoría O coincidencia exacta de palabra completa en géneros (separados por comas)
      conditions.push(`(LOWER(c.nombre) = LOWER($${values.length}) OR 
        LOWER(l.genero) = LOWER($${values.length}) OR
        LOWER(l.genero) LIKE LOWER(CONCAT($${values.length}, ', %')) OR
        LOWER(l.genero) LIKE LOWER(CONCAT('%, ', $${values.length}, ',%')) OR
        LOWER(l.genero) LIKE LOWER(CONCAT('%, ', $${values.length})))`);
    }

    if (priceMin !== undefined && priceMin !== null && priceMin !== "") {
      values.push(parseFloat(priceMin));
      conditions.push(`l.precio >= $${values.length}`);
    }

    if (priceMax !== undefined && priceMax !== null && priceMax !== "") {
      values.push(parseFloat(priceMax));
      conditions.push(`l.precio <= $${values.length}`);
    }

    if (disponibles === "1") {
      conditions.push(`l.stock_general > 0`);
    }

    conditions.push(`EXISTS (SELECT 1 FROM inventario_tienda it WHERE it.libro_id = l.id)`);

    const whereClause = conditions.join(" AND ");

    const countQuery = `
      SELECT COUNT(DISTINCT l.id) as total
      FROM libros l
      LEFT JOIN categorias c ON l.categoria_id = c.id
      WHERE ${whereClause}
    `;

    values.push(limitNum);
    const limitIdx = values.length;
    values.push(offset);
    const offsetIdx = values.length;

    const dataQuery = `
      SELECT l.id, l.titulo, l.autor, l.año, l.genero, l.numero_paginas as paginas, 
             l.editorial, l.isbn, l.idioma, l.fecha_publicacion, l.precio as "priceRaw", 
             l.portada_url, l.estado, l.stock_general, c.nombre as categoria_nombre
      FROM libros l
      LEFT JOIN categorias c ON l.categoria_id = c.id
      WHERE ${whereClause}
      ORDER BY l.titulo ASC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const countResult = await db.query(countQuery, values.slice(0, values.length - 2));
    const dataResult = await db.query(dataQuery, values);

    res.status(200).json({
      success: true,
      docs: dataResult.rows,
      total: parseInt(countResult.rows[0].total),
      page: parseInt(page),
      limit: limitNum
    });
  } catch (err) {
    console.error("Error fetching public books:", err);
    res.status(500).json({ success: false, message: "Error fetching public books", error: err.message });
  }
});

/**
 * GET /api/books/:id/stores
 * Get all stores that have the specific book ID in their inventory
 */
router.get("/:id/stores", async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT t.id, t.nombre, t.ciudad, it.cantidad_disponible as stock
      FROM inventario_tienda it
      JOIN tiendas t ON it.tienda_id = t.id
      WHERE it.libro_id = $1 AND it.cantidad_disponible > 0
      ORDER BY t.ciudad ASC, t.nombre ASC
    `;
    const result = await db.query(query, [id]);
    res.status(200).json({ success: true, stores: result.rows });
  } catch (err) {
    console.error("Error fetching book stores:", err);
    res.status(500).json({ success: false, message: "Error fetching book stores", error: err.message });
  }
});

/**
 * GET /api/books/:id
 * Get specific book by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      "SELECT l.id, l.titulo, l.autor, l.año, l.genero, l.numero_paginas as paginas, l.editorial, l.isbn, l.idioma, l.fecha_publicacion, l.precio, l.portada_url, l.stock_general, c.nombre as categoria_nombre FROM libros l LEFT JOIN categorias c ON l.categoria_id = c.id WHERE l.id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.status(200).json({
      success: true,
      book: result.rows[0],
    });
  } catch (err) {
    console.error("Error fetching book:", err);
    res.status(500).json({ success: false, message: "Error fetching book", error: err.message });
  }
});

/**
 * PUT /api/books/:id
 * Update an existing book in the database
 */
router.put("/:id", verifyToken, requireRole("Administrador"), async (req, res) => {
  const { id } = req.params;
  const { titulo, autor, isbn, editorial, paginas, idioma, año, genero, precio, portada_url, descripcion } = req.body;

  if (!titulo || !autor || precio === undefined) {
    return res.status(400).json({ error: "Título, autor y precio son requeridos" });
  }

  try {
    const existing = await db.query("SELECT * FROM libros WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Libro no encontrado" });
    }

    let categoria_id = existing.rows[0].categoria_id;
    if (genero) {
      const catCheck = await db.query("SELECT id FROM categorias WHERE LOWER(nombre) = LOWER($1)", [genero]);
      if (catCheck.rows.length > 0) {
        categoria_id = catCheck.rows[0].id;
      }
    }
    
    let fecha_publicacion = existing.rows[0].fecha_publicacion;
    if (año) {
      fecha_publicacion = `${año}-01-01`; 
    }

    const result = await db.query(
        `UPDATE libros 
         SET titulo = $1, autor = $2, isbn = $3, editorial = $4, precio = $5, descripcion = $6, 
             fecha_publicacion = $7, numero_paginas = $8, idioma = $9, portada_url = $10, 
             categoria_id = $11, año = $12, genero = $13, updated_at = CURRENT_TIMESTAMP
         WHERE id = $14
         RETURNING *`,
        [titulo, autor, isbn || null, editorial || null, precio || 0, descripcion || null,
         fecha_publicacion, paginas ? parseInt(paginas) : null, idioma || 'Español', portada_url || null, 
         categoria_id, año || null, genero || null, id]
    );

    res.status(200).json({
      success: true,
      message: "Libro actualizado exitosamente",
      book: result.rows[0],
    });
  } catch (err) {
    console.error("Error updating book:", err);
    res.status(500).json({ success: false, message: "Error al actualizar el libro", error: err.message });
  }
});

export default router;
