import express from "express";
import db from "../db/index.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/recommendations/health
 * Test endpoint para verificar que la ruta está registrada
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Recommendations service is running"
  });
});

/**
 * Extrae palabras clave de una consulta en lenguaje natural
 */
function extractKeywords(query) {
  const stopwords = new Set([
    'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'una', 'por', 'con', 'su', 'para',
    'es', 'son', 'está', 'estén', 'fue', 'han', 'he', 'has', 'había', 'habían', 'haya',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are'
  ]);

  return query
    .toLowerCase()
    .split(/[\s\.,;:!?]+/)
    .filter(word => word.length > 2 && !stopwords.has(word));
}

/**
 * Calcula similitud entre strings (Levenshtein simplificado)
 */
function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calcula distancia de edición
 */
function getEditDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * POST /api/recommendations/chat
 * Procesa consulta en lenguaje natural y retorna recomendaciones
 */
router.post("/chat", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { query, selectedCategories = [] } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "La consulta no puede estar vacía" });
    }

    // 1. Obtener historial de compras del usuario para análisis de preferencias
    const purchaseHistory = await db.query(
      `SELECT DISTINCT l.id, l.titulo, l.autor, l.genero, l.categoria_id, c.nombre as categoria
       FROM compra_items ci
       JOIN compras com ON ci.compra_id = com.id
       JOIN libros l ON ci.libro_id = l.id
       JOIN categorias c ON l.categoria_id = c.id
       WHERE com.usuario_id = $1 AND com.estado_compra = 'entregada'
       LIMIT 20`,
      [userId]
    );

    // 2. Extraer géneros preferidos del usuario
    const userGenres = new Set(purchaseHistory.rows.map(row => row.genero).filter(Boolean));
    const userCategories = new Set(purchaseHistory.rows.map(row => row.categoria_id));

    // 3. Procesar consulta en lenguaje natural
    const keywords = extractKeywords(query);
    
    // Buscar libros que coincidan con la consulta
    let booksQuery = `
      SELECT l.id, l.titulo, l.autor, l.genero, l.precio, 
             l.descripcion, l.portada_url, c.nombre as categoria,
             COALESCE(SUM(it.cantidad_disponible), 0) as stock_total
      FROM libros l
      LEFT JOIN categorias c ON l.categoria_id = c.id
      LEFT JOIN inventario_tienda it ON l.id = it.libro_id
      WHERE l.estado = 'disponible'
    `;

    const queryParams = [];
    let paramIndex = 1;

    // Filtrar por categorías seleccionadas si las hay
    if (selectedCategories.length > 0) {
      booksQuery += ` AND c.id = ANY($${paramIndex}::int[])`;
      queryParams.push(selectedCategories);
      paramIndex++;
    }

    booksQuery += ` GROUP BY l.id, l.titulo, l.autor, l.genero, l.precio, l.descripcion, l.portada_url, c.id, c.nombre
                    ORDER BY l.titulo ASC
                    LIMIT 100`;

    const availableBooks = await db.query(booksQuery, queryParams);

    // 4. Puntuación de relevancia para cada libro
    const scoredBooks = availableBooks.rows.map(book => {
      let score = 0;

      // Relevancia por coincidencia con keywords en título/autor/descripción
      const searchFields = [
        book.titulo,
        book.autor,
        book.descripcion || "",
        book.genero || "",
        book.categoria || ""
      ].join(" ").toLowerCase();

      keywords.forEach(keyword => {
        if (searchFields.includes(keyword)) {
          score += 10;
        }
      });

      // Similitud difusa con keywords
      keywords.forEach(keyword => {
        const titleSimilarity = calculateSimilarity(book.titulo, keyword);
        const autorSimilarity = calculateSimilarity(book.autor, keyword);
        score += (Math.max(titleSimilarity, autorSimilarity) * 5);
      });

      // Bonus por género si el usuario tiene preferencias
      if (userGenres.size > 0 && book.genero && userGenres.has(book.genero)) {
        score += 15;
      }

      // Penalidad/bonus por disponibilidad
      score += (book.stock_total > 0 ? 5 : -10);

      return { ...book, relevanceScore: score };
    });

    // 5. Ordenar por relevancia y retornar top 5
    const recommendations = scoredBooks
      .filter(book => book.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 5)
      .map(({ relevanceScore, ...book }) => book);

    // Si no hay recomendaciones con relevancia alta, retornar libros populares del mismo género
    if (recommendations.length === 0) {
      const fallbackQuery = `
        SELECT l.id, l.titulo, l.autor, l.genero, l.precio,
               l.descripcion, l.portada_url, c.nombre as categoria,
               COALESCE(SUM(it.cantidad_disponible), 0) as stock_total
        FROM libros l
        LEFT JOIN categorias c ON l.categoria_id = c.id
        LEFT JOIN inventario_tienda it ON l.id = it.libro_id
        WHERE l.estado = 'disponible'
        GROUP BY l.id, l.titulo, l.autor, l.genero, l.precio, l.descripcion, l.portada_url, c.id, c.nombre
        HAVING COALESCE(SUM(it.cantidad_disponible), 0) > 0
        ORDER BY l.titulo ASC
        LIMIT 5
      `;

      const fallbackBooks = await db.query(fallbackQuery);
      return res.status(200).json({
        success: true,
        recommendations: fallbackBooks.rows,
        message: "No encontramos coincidencias exactas. Aquí hay libros destacados.",
        queryProcessed: query,
        keywordsExtracted: keywords
      });
    }

    res.status(200).json({
      success: true,
      recommendations,
      message: `Encontramos ${recommendations.length} libros recomendados para ti`,
      queryProcessed: query,
      keywordsExtracted: keywords,
      userPreferences: {
        favoriteGenres: Array.from(userGenres),
        purchasedBooks: purchaseHistory.rows.length
      }
    });
  } catch (err) {
    console.error("Error in recommendations:", err);
    res.status(500).json({ success: false, message: "Error processing recommendations", error: err.message });
  }
});

/**
 * GET /api/recommendations/categories
 * Obtiene todas las categorías disponibles para filtrado
 */
router.get("/categories", async (req, res) => {
  try {
    const result = await db.query("SELECT id, nombre FROM categorias ORDER BY nombre ASC");
    res.status(200).json({
      success: true,
      categories: result.rows
    });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ success: false, message: "Error fetching categories", error: err.message });
  }
});

/**
 * GET /api/recommendations/user-preferences
 * Obtiene preferencias del usuario basadas en historial de compras
 */
router.get("/user-preferences", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT DISTINCT l.genero, c.nombre as categoria, COUNT(ci.id) as count
       FROM compra_items ci
       JOIN compras com ON ci.compra_id = com.id
       JOIN libros l ON ci.libro_id = l.id
       JOIN categorias c ON l.categoria_id = c.id
       WHERE com.usuario_id = $1 AND com.estado_compra = 'entregada'
       GROUP BY l.genero, c.nombre
       ORDER BY count DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      preferences: result.rows
    });
  } catch (err) {
    console.error("Error fetching preferences:", err);
    res.status(500).json({ success: false, message: "Error fetching preferences", error: err.message });
  }
});

export default router;
