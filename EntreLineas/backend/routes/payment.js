import { Router } from "express";
import db from "../db/index.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/payment/cards
 * Obtiene todas las tarjetas del usuario autenticado
 * Requiere: Authorization: Bearer <token>
 */
router.get("/cards", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT id, numero_enmascarado, ultimos_digitos, titular, fecha_expiracion, tipo_tarjeta, 
              es_principal, estado, created_at
       FROM tarjetas_credito
       WHERE usuario_id = $1 AND estado = 'activa'
       ORDER BY es_principal DESC, created_at DESC`,
      [userId]
    );

    return res.status(200).json({
      message: "Tarjetas obtenidas exitosamente",
      cards: result.rows,
    });
  } catch (err) {
    console.error("Error en GET /api/payment/cards:", err);
    return res.status(500).json({ error: "Error al obtener tarjetas" });
  }
});

/**
 * POST /api/payment/cards
 * Agrega una nueva tarjeta de crédito
 * Body: { numeroTarjeta, titular, fechaExpiracion, cvv, alias, esDefault }
 * Requiere: Authorization: Bearer <token>
 */
router.post("/cards", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { numeroTarjeta, titular, fechaExpiracion, cvv, alias, esDefault } = req.body;

    // Validaciones
    if (!numeroTarjeta || !titular || !fechaExpiracion || !cvv) {
      return res.status(400).json({ error: "Todos los campos de tarjeta son requeridos" });
    }

    // Validar formato de número (16 dígitos)
    const numeroLimpio = numeroTarjeta.replace(/\s/g, "");
    if (!/^\d{16}$/.test(numeroLimpio)) {
      return res.status(400).json({ error: "El número de tarjeta debe tener 16 dígitos" });
    }

    // Determinar tipo de tarjeta
    let tipoTarjeta = "Otros";
    if (numeroLimpio.startsWith("4")) tipoTarjeta = "VISA";
    else if (numeroLimpio.startsWith("5")) tipoTarjeta = "Mastercard";
    else if (numeroLimpio.startsWith("3")) tipoTarjeta = "American Express";

    // Enmascarar número
    const ultimos4 = numeroLimpio.slice(-4);
    const numeroEnmascarado = `•••• •••• •••• ${ultimos4}`;

    // Si es predeterminada, desactivar otra
    if (esDefault) {
      await db.query(
        "UPDATE tarjetas_credito SET es_principal = FALSE WHERE usuario_id = $1",
        [userId]
      );
    }

    // Insertar tarjeta
    const result = await db.query(
      `INSERT INTO tarjetas_credito (usuario_id, numero_enmascarado, ultimos_digitos, titular, 
                                     fecha_expiracion, tipo_tarjeta, estado, es_principal)
       VALUES ($1, $2, $3, $4, $5, $6, 'activa', $7)
       RETURNING id, numero_enmascarado, ultimos_digitos, titular, fecha_expiracion, tipo_tarjeta, es_principal`,
      [userId, numeroEnmascarado, ultimos4, titular, fechaExpiracion, tipoTarjeta, esDefault || false]
    );

    return res.status(201).json({
      message: "Tarjeta agregada exitosamente",
      card: result.rows[0],
    });
  } catch (err) {
    console.error("Error en POST /api/payment/cards:", err);
    return res.status(500).json({ error: "Error al agregar tarjeta" });
  }
});

/**
 * DELETE /api/payment/cards/:cardId
 * Elimina una tarjeta de crédito (soft delete)
 * Requiere: Authorization: Bearer <token>
 */
router.delete("/cards/:cardId", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.params;

    // Verificar que la tarjeta pertenece al usuario
    const cardResult = await db.query(
      "SELECT id, es_principal FROM tarjetas_credito WHERE id = $1 AND usuario_id = $2",
      [cardId, userId]
    );

    if (cardResult.rows.length === 0) {
      return res.status(404).json({ error: "Tarjeta no encontrada" });
    }

    // No permitir eliminar si es la única tarjeta
    const allCards = await db.query(
      "SELECT COUNT(*) FROM tarjetas_credito WHERE usuario_id = $1 AND estado = 'activa'",
      [userId]
    );

    if (parseInt(allCards.rows[0].count) <= 1) {
      return res.status(400).json({ error: "No puedes eliminar tu última tarjeta" });
    }

    // Marcar como inactiva
    await db.query(
      "UPDATE tarjetas_credito SET estado = 'inactiva' WHERE id = $1",
      [cardId]
    );

    // Si era predeterminada, asignar otra como predeterminada
    if (cardResult.rows[0].es_principal) {
      const newDefault = await db.query(
        "SELECT id FROM tarjetas_credito WHERE usuario_id = $1 AND estado = 'activa' LIMIT 1",
        [userId]
      );
      if (newDefault.rows.length > 0) {
        await db.query(
          "UPDATE tarjetas_credito SET es_principal = TRUE WHERE id = $1",
          [newDefault.rows[0].id]
        );
      }
    }

    return res.status(200).json({ message: "Tarjeta eliminada exitosamente" });
  } catch (err) {
    console.error("Error en DELETE /api/payment/cards/:cardId:", err);
    return res.status(500).json({ error: "Error al eliminar tarjeta" });
  }
});

/**
 * PUT /api/payment/cards/:cardId/default
 * Establece una tarjeta como predeterminada
 * Requiere: Authorization: Bearer <token>
 */
router.put("/cards/:cardId/default", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cardId } = req.params;

    // Verificar que la tarjeta pertenece al usuario
    const cardResult = await db.query(
      "SELECT id FROM tarjetas_credito WHERE id = $1 AND usuario_id = $2",
      [cardId, userId]
    );

    if (cardResult.rows.length === 0) {
      return res.status(404).json({ error: "Tarjeta no encontrada" });
    }

    // Desactivar otra predeterminada
    await db.query(
      "UPDATE tarjetas_credito SET es_principal = FALSE WHERE usuario_id = $1",
      [userId]
    );

    // Establecer esta como predeterminada
    const result = await db.query(
      "UPDATE tarjetas_credito SET es_principal = TRUE WHERE id = $1 RETURNING id, es_principal",
      [cardId]
    );

    return res.status(200).json({
      message: "Tarjeta establecida como predeterminada",
      card: result.rows[0],
    });
  } catch (err) {
    console.error("Error en PUT /api/payment/cards/:cardId/default:", err);
    return res.status(500).json({ error: "Error al actualizar tarjeta" });
  }
});

/**
 * GET /api/payment/monthly-spending
 * Obtiene el gasto mensual del usuario autenticado
 * Requiere: Authorization: Bearer <token>
 */
router.get("/monthly-spending", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const result = await db.query(
      `SELECT COALESCE(SUM(total), 0) as gasto_mensual
       FROM compras
       WHERE usuario_id = $1 
       AND EXTRACT(MONTH FROM fecha) = $2
       AND EXTRACT(YEAR FROM fecha) = $3
       AND estado_compra != 'cancelada'`,
      [userId, currentMonth, currentYear]
    );

    const gastoMensual = parseFloat(result.rows[0].gasto_mensual) || 0;

    return res.status(200).json({
      message: "Gasto mensual obtenido",
      monthlySpending: gastoMensual,
      month: currentMonth,
      year: currentYear,
    });
  } catch (err) {
    console.error("Error en GET /api/payment/monthly-spending:", err);
    return res.status(500).json({ error: "Error al obtener gasto mensual" });
  }
});

/**
 * GET /api/payment/purchases
 * Obtiene el historial de compras del usuario autenticado
 * Requiere: Authorization: Bearer <token>
 */
router.get("/purchases", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT c.id, c.fecha, c.total, c.estado_compra, c.metodo_pago,
              ci.libro_id, ci.cantidad, ci.precio_unitario,
              l.titulo, l.portada_url
       FROM compras c
       LEFT JOIN compra_items ci ON c.id = ci.compra_id
       LEFT JOIN libros l ON ci.libro_id = l.id
       WHERE c.usuario_id = $1
       ORDER BY c.fecha DESC
       LIMIT 50`,
      [userId]
    );

    // Agrupar por compra
    const purchasesMap = {};
    result.rows.forEach((row) => {
      if (!purchasesMap[row.id]) {
        purchasesMap[row.id] = {
          id: row.id,
          fecha: row.fecha,
          total: row.total,
          estado_compra: row.estado_compra,
          metodo_pago: row.metodo_pago,
          items: [],
        };
      }
      if (row.libro_id) {
        purchasesMap[row.id].items.push({
          libro_id: row.libro_id,
          titulo: row.titulo,
          cantidad: row.cantidad,
          precio_unitario: row.precio_unitario,
          portada_url: row.portada_url,
        });
      }
    });

    const purchases = Object.values(purchasesMap);

    return res.status(200).json({
      message: "Historial de compras obtenido",
      purchases,
    });
  } catch (err) {
    console.error("Error en GET /api/payment/purchases:", err);
    return res.status(500).json({ error: "Error al obtener historial" });
  }
});

export default router;
