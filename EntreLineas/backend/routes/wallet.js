import { Router } from "express";
import db from "../db/index.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/wallet/cards
// Obtiene todas las tarjetas del usuario autenticado
// ─────────────────────────────────────────────────────────────────────────────
router.get("/cards", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, numero_enmascarado, ultimos_digitos, titular, fecha_expiracion, 
              tipo_tarjeta, es_principal, estado
       FROM tarjetas_credito
       WHERE usuario_id = $1
       ORDER BY es_principal DESC, created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      cards: result.rows,
    });
  } catch (err) {
    console.error("Error fetching cards:", err);
    res.status(500).json({ error: "Error al obtener tarjetas" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/wallet/cards
// Agrega una nueva tarjeta de crédito al usuario
// Body: { numeroTarjeta, titular, fechaExpiracion, tipoTarjeta, esPrincipal }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/cards", verifyToken, async (req, res) => {
  try {
    const { numeroTarjeta, titular, fechaExpiracion, tipoTarjeta, esPrincipal } = req.body;

    // Validaciones básicas
    if (!numeroTarjeta || !titular || !fechaExpiracion || !tipoTarjeta) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    // Validar formato de número de tarjeta (solo números, 13-19 dígitos)
    const tarjetaLimpia = numeroTarjeta.replace(/\s/g, "");
    if (!/^\d{13,19}$/.test(tarjetaLimpia)) {
      return res.status(400).json({ error: "Número de tarjeta inválido" });
    }

    // Validar formato de fecha (MM/YY)
    if (!/^\d{2}\/\d{2}$/.test(fechaExpiracion)) {
      return res.status(400).json({ error: "Formato de fecha inválido (MM/YY)" });
    }

    const [mes, anio] = fechaExpiracion.split("/");
    const mesNum = parseInt(mes, 10);
    if (mesNum < 1 || mesNum > 12) {
      return res.status(400).json({ error: "Mes inválido (debe ser 01-12)" });
    }

    // Validar que no esté expirada
    const ahora = new Date();
    const anioCompleto = 2000 + parseInt(anio, 10);
    const fechaExp = new Date(anioCompleto, mesNum - 1, 1);
    if (fechaExp < ahora) {
      return res.status(400).json({ error: "Tarjeta expirada" });
    }

    // Obtener últimos 4 dígitos
    const ultimos4 = tarjetaLimpia.slice(-4);

    // Enmascarar número de tarjeta (guardar solo últimos 4 dígitos)
    const numeroEnmascarado = `****-****-****-${ultimos4}`;

    // Validar tipo de tarjeta
    const tiposValidos = ["VISA", "Mastercard", "American Express", "Diners Club", "Discover"];
    if (!tiposValidos.includes(tipoTarjeta)) {
      return res.status(400).json({ error: "Tipo de tarjeta no válido" });
    }

    // Determinar si es principal
    // Si viene esPrincipal del frontend, usarlo; si no, verificar si es la primera tarjeta
    let nuevaPrincipal = esPrincipal !== undefined ? esPrincipal : false;
    
    if (nuevaPrincipal === undefined || nuevaPrincipal === null) {
      const existentes = await db.query(
        "SELECT COUNT(*) as count FROM tarjetas_credito WHERE usuario_id = $1",
        [req.user.id]
      );
      nuevaPrincipal = existentes.rows[0].count === 0;
    }

    // Si esta tarjeta será principal, desmarcar las otras
    if (nuevaPrincipal) {
      await db.query(
        "UPDATE tarjetas_credito SET es_principal = false WHERE usuario_id = $1",
        [req.user.id]
      );
    }

    // Insertar tarjeta
    const result = await db.query(
      `INSERT INTO tarjetas_credito 
       (usuario_id, numero_enmascarado, ultimos_digitos, titular, fecha_expiracion, tipo_tarjeta, es_principal)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, numero_enmascarado, ultimos_digitos, titular, fecha_expiracion, tipo_tarjeta, es_principal`,
      [req.user.id, numeroEnmascarado, ultimos4, titular, fechaExpiracion, tipoTarjeta, nuevaPrincipal]
    );

    res.status(201).json({
      message: "Tarjeta agregada exitosamente",
      card: result.rows[0],
    });
  } catch (err) {
    console.error("Error adding card:", err);
    res.status(500).json({ error: "Error al agregar tarjeta" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/wallet/cards/:cardId
// Elimina una tarjeta de crédito del usuario
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/cards/:cardId", verifyToken, async (req, res) => {
  try {
    const { cardId } = req.params;

    // Verificar que la tarjeta pertenece al usuario
    const cardCheck = await db.query(
      "SELECT id FROM tarjetas_credito WHERE id = $1 AND usuario_id = $2",
      [cardId, req.user.id]
    );

    if (cardCheck.rows.length === 0) {
      return res.status(404).json({ error: "Tarjeta no encontrada" });
    }

    // Eliminar tarjeta
    await db.query("DELETE FROM tarjetas_credito WHERE id = $1", [cardId]);

    res.status(200).json({ message: "Tarjeta eliminada exitosamente" });
  } catch (err) {
    console.error("Error deleting card:", err);
    res.status(500).json({ error: "Error al eliminar tarjeta" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/wallet/cards/:cardId/set-default
// Establece una tarjeta como la principal
// ─────────────────────────────────────────────────────────────────────────────
router.put("/cards/:cardId/set-default", verifyToken, async (req, res) => {
  try {
    const { cardId } = req.params;

    // Verificar que la tarjeta pertenece al usuario
    const cardCheck = await db.query(
      "SELECT id FROM tarjetas_credito WHERE id = $1 AND usuario_id = $2",
      [cardId, req.user.id]
    );

    if (cardCheck.rows.length === 0) {
      return res.status(404).json({ error: "Tarjeta no encontrada" });
    }

    // Quitar principal de todas las tarjetas del usuario
    await db.query(
      "UPDATE tarjetas_credito SET es_principal = FALSE WHERE usuario_id = $1",
      [req.user.id]
    );

    // Establecer como principal la seleccionada
    const result = await db.query(
      `UPDATE tarjetas_credito SET es_principal = TRUE 
       WHERE id = $1 AND usuario_id = $2
       RETURNING id, numero_enmascarado, ultimos_digitos, titular, fecha_expiracion, tipo_tarjeta, es_principal`,
      [cardId, req.user.id]
    );

    res.status(200).json({
      message: "Tarjeta establecida como principal",
      card: result.rows[0],
    });
  } catch (err) {
    console.error("Error setting default card:", err);
    res.status(500).json({ error: "Error al establecer tarjeta principal" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/wallet/purchases
// Obtiene el historial de compras del usuario
// ─────────────────────────────────────────────────────────────────────────────
router.get("/purchases", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
         c.id, 
         c.fecha as fecha_compra,
         c.total as monto_total,
         c.estado_compra,
         json_agg(json_build_object('titulo', l.titulo, 'portada_url', l.portada_url)) FILTER (WHERE l.id IS NOT NULL) as libros
       FROM compras c
       LEFT JOIN compra_items ci ON c.id = ci.compra_id
       LEFT JOIN libros l ON ci.libro_id = l.id
       WHERE c.usuario_id = $1
         AND c.estado_compra IN ('confirmada', 'enviada', 'entregada')
       GROUP BY c.id, c.fecha, c.total, c.estado_compra
       ORDER BY c.fecha DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.status(200).json({
      purchases: result.rows || [],
    });
  } catch (err) {
    console.error("Error fetching purchases:", err);
    res.status(500).json({ error: "Error al obtener historial de compras" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/wallet/balance
// Obtiene el saldo disponible del monedero del usuario
// ─────────────────────────────────────────────────────────────────────────────
router.get("/balance", verifyToken, async (req, res) => {
  try {
    let result = await db.query(
      `SELECT id, saldo_disponible, saldo_total_agregado, updated_at
       FROM monedero
       WHERE usuario_id = $1`,
      [req.user.id]
    );

    // Si no existe monedero, crear uno
    if (result.rows.length === 0) {
      result = await db.query(
        `INSERT INTO monedero (usuario_id, saldo_disponible, saldo_total_agregado)
         VALUES ($1, 0.00, 0.00)
         RETURNING id, saldo_disponible, saldo_total_agregado, updated_at`,
        [req.user.id]
      );
    }

    res.status(200).json({
      wallet: result.rows[0],
    });
  } catch (err) {
    console.error("Error fetching wallet balance:", err);
    res.status(500).json({ error: "Error al obtener saldo del monedero" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/wallet/add-funds
// Agrega dinero al monedero desde una tarjeta de crédito
// Body: { monto, tarjetaId }
// ─────────────────────────────────────────────────────────────────────────────
router.post("/add-funds", verifyToken, async (req, res) => {
  const client = await db.getClient();
  
  try {
    const { monto, tarjetaId } = req.body;

    // Validaciones
    if (!monto || monto <= 0) {
      return res.status(400).json({ error: "El monto debe ser mayor a 0" });
    }

    if (!tarjetaId) {
      return res.status(400).json({ error: "Tarjeta requerida" });
    }

    // Verificar que la tarjeta pertenece al usuario
    const tarjetaCheck = await client.query(
      "SELECT id, estado FROM tarjetas_credito WHERE id = $1 AND usuario_id = $2",
      [tarjetaId, req.user.id]
    );

    if (tarjetaCheck.rows.length === 0) {
      return res.status(404).json({ error: "Tarjeta no encontrada" });
    }

    if (tarjetaCheck.rows[0].estado !== "activa") {
      return res.status(400).json({ error: "La tarjeta no está activa" });
    }

    await client.query("BEGIN");

    // Obtener o crear monedero
    let walletCheck = await client.query(
      "SELECT id, saldo_disponible FROM monedero WHERE usuario_id = $1",
      [req.user.id]
    );

    let walletId;
    let saldoAnterior = 0;

    if (walletCheck.rows.length === 0) {
      const walletCreate = await client.query(
        `INSERT INTO monedero (usuario_id, saldo_disponible, saldo_total_agregado)
         VALUES ($1, $2, $2)
         RETURNING id, saldo_disponible`,
        [req.user.id, monto]
      );
      walletId = walletCreate.rows[0].id;
      saldoAnterior = 0;
    } else {
      walletId = walletCheck.rows[0].id;
      saldoAnterior = walletCheck.rows[0].saldo_disponible;

      // Actualizar saldo
      await client.query(
        `UPDATE monedero 
         SET saldo_disponible = saldo_disponible + $1,
             saldo_total_agregado = saldo_total_agregado + $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [monto, walletId]
      );
    }

    // Registrar transacción
    const referenciaTransaccion = `WLT-${req.user.id}-${Date.now()}`;
    await client.query(
      `INSERT INTO transacciones_monedero 
       (usuario_id, tipo_transaccion, monto, saldo_anterior, saldo_nuevo, 
        referencia_pago, tarjeta_id, descripcion)
       VALUES ($1, 'agregar_fondos', $2, $3, $4, $5, $6, $7)`,
      [
        req.user.id,
        monto,
        saldoAnterior,
        saldoAnterior + monto,
        referenciaTransaccion,
        tarjetaId,
        `Fondos agregados desde tarjeta`,
      ]
    );

    await client.query("COMMIT");

    // Obtener saldo actualizado
    const walletActualizado = await db.query(
      `SELECT saldo_disponible, saldo_total_agregado, updated_at FROM monedero WHERE id = $1`,
      [walletId]
    );

    res.status(201).json({
      message: "Fondos agregados exitosamente",
      wallet: walletActualizado.rows[0],
      referencia: referenciaTransaccion,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error adding funds:", err);
    res.status(500).json({ error: "Error al agregar fondos al monedero" });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/wallet/wallet-transactions
// Obtiene el historial de transacciones del monedero
// ─────────────────────────────────────────────────────────────────────────────
router.get("/wallet-transactions", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
         id,
         tipo_transaccion,
         monto,
         saldo_anterior,
         saldo_nuevo,
         referencia_pago,
         descripcion,
         created_at
       FROM transacciones_monedero
       WHERE usuario_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.id]
    );

    res.status(200).json({
      transactions: result.rows || [],
    });
  } catch (err) {
    console.error("Error fetching wallet transactions:", err);
    res.status(500).json({ error: "Error al obtener historial de transacciones" });
  }
});

export default router;
