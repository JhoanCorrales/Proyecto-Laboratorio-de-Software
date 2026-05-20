import { Router } from "express";
import db from "../db/index.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/purchases
 * Obtiene todas las compras del usuario autenticado
 */
router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
         c.id,
         c.usuario_id,
         c.fecha,
         c.total,
         c.estado_compra,
         c.metodo_pago,
         c.numero_seguimiento,
         c.fecha_entrega_estimada,
         c.created_at,
         COUNT(ci.id) as cantidad_items
       FROM compras c
       LEFT JOIN compra_items ci ON c.id = ci.compra_id
       WHERE c.usuario_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );

    return res.json({
      compras: result.rows,
    });
  } catch (err) {
    console.error("Error en GET /api/purchases:", err);
    return res.status(500).json({
      error: "Error al obtener historial de compras",
    });
  }
});

/**
 * GET /api/purchases/:compraId
 * Obtiene los detalles de una compra específica
 */
router.get("/:compraId", verifyToken, async (req, res) => {
  const compraId = parseInt(req.params.compraId, 10);

  try {
    // Validar que la compra pertenece al usuario
    const compraResult = await db.query(
      `SELECT c.id, c.usuario_id, c.fecha, c.total, c.estado_compra, 
              c.metodo_pago, c.numero_seguimiento, c.fecha_entrega_estimada, c.created_at,
              c.tipo_entrega, c.tienda_id, c.direccion_envio, t.nombre as tienda_nombre, t.direccion as tienda_direccion
       FROM compras c
       LEFT JOIN tiendas t ON c.tienda_id = t.id
       WHERE c.id = $1 AND c.usuario_id = $2`,
      [compraId, req.user.id]
    );

    if (compraResult.rows.length === 0) {
      return res.status(404).json({
        error: "Compra no encontrada",
      });
    }

    const compra = compraResult.rows[0];

    // Obtener items de la compra
    const itemsResult = await db.query(
      `SELECT 
         ci.id,
         ci.libro_id,
         ci.cantidad,
         ci.precio_unitario,
         ci.subtotal,
         l.titulo,
         l.autor,
         l.portada_url,
         l.isbn
       FROM compra_items ci
       JOIN libros l ON ci.libro_id = l.id
       WHERE ci.compra_id = $1`,
      [compraId]
    );

    return res.json({
      compra: {
        ...compra,
        items: itemsResult.rows,
      },
    });
  } catch (err) {
    console.error("Error en GET /api/purchases/:compraId:", err);
    return res.status(500).json({
      error: "Error al obtener detalles de la compra",
    });
  }
});

/**
 * POST /api/purchases/:compraId/cancel
 * Cancela una compra y reembolsa el dinero al wallet
 */
router.post("/:compraId/cancel", verifyToken, async (req, res) => {
  const compraId = parseInt(req.params.compraId, 10);
  const userId = req.user.id;

  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    // 1. Validar que la compra pertenece al usuario y está en estado cancelable
    const compraResult = await client.query(
      `SELECT * FROM compras WHERE id = $1 AND usuario_id = $2`,
      [compraId, userId]
    );

    if (compraResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Compra no encontrada" });
    }

    const compra = compraResult.rows[0];

    if (compra.estado_compra !== "confirmada") {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: `No puedes cancelar una compra en estado ${compra.estado_compra}`,
      });
    }

    // 2. Obtener items de la compra para restaurar stock
    const itemsResult = await client.query(
      `SELECT libro_id, cantidad, tienda_id FROM compra_items WHERE compra_id = $1`,
      [compraId]
    );

    // 3. Restaurar stock
    for (const item of itemsResult.rows) {
      if (item.tienda_id) {
        // Verificar si existe la relación en inventario_tienda
        const invCheck = await client.query(
          `SELECT id FROM inventario_tienda WHERE tienda_id = $1 AND libro_id = $2`,
          [item.tienda_id, item.libro_id]
        );

        if (invCheck.rows.length > 0) {
          // Si existe, sumamos al stock de la tienda
          await client.query(
            `UPDATE inventario_tienda 
             SET cantidad_disponible = cantidad_disponible + $1, updated_at = NOW()
             WHERE tienda_id = $2 AND libro_id = $3`,
            [item.cantidad, item.tienda_id, item.libro_id]
          );
        } else {
          // Si no existe, creamos el registro
          await client.query(
            `INSERT INTO inventario_tienda (tienda_id, libro_id, cantidad_disponible, ultimo_reabastecimiento)
             VALUES ($1, $2, $3, NOW())`,
            [item.tienda_id, item.libro_id, item.cantidad]
          );
        }
      }

      // Sincronizar el stock global de este libro
      await db.updateGlobalStock(item.libro_id, client);
    }

    // 4. Actualizar estado de la compra
    await client.query(
      `UPDATE compras SET estado_compra = 'cancelada', updated_at = NOW()
       WHERE id = $1`,
      [compraId]
    );

    // 5. Reembolsar al wallet si fue pagado con wallet
    if (compra.metodo_pago === "wallet") {
      const walletResult = await client.query(
        `SELECT saldo_disponible FROM monedero WHERE usuario_id = $1`,
        [userId]
      );

      if (walletResult.rows.length > 0) {
        const currentBalance = parseFloat(walletResult.rows[0].saldo_disponible);
        const newBalance = currentBalance + parseFloat(compra.total);

        // Actualizar saldo
        await client.query(
          `UPDATE monedero SET saldo_disponible = $1, updated_at = NOW()
           WHERE usuario_id = $2`,
          [newBalance, userId]
        );

        // Registrar transacción de reembolso
        await client.query(
          `INSERT INTO transacciones_monedero 
           (usuario_id, tipo_transaccion, monto, saldo_anterior, saldo_nuevo, compra_id, descripcion)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            userId,
            "reembolso",
            compra.total,
            currentBalance,
            newBalance,
            compraId,
            `Reembolso por cancelación de compra #${compraId}`,
          ]
        );
      }
    }

    // 6. Actualizar estado del pago
    await client.query(
      `UPDATE pagos SET estado_pago = 'reembolsado', updated_at = NOW()
       WHERE compra_id = $1`,
      [compraId]
    );

    await client.query("COMMIT");

    return res.json({
      message: "Compra cancelada exitosamente",
      compra_id: compraId,
      reembolso: compra.metodo_pago === "wallet" ? compra.total : null,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error en POST /api/purchases/:compraId/cancel:", err);
    return res.status(500).json({
      error: "Error al cancelar la compra",
      details: err.message,
    });
  } finally {
    client.release();
  }
});

export default router;
