import { Router } from "express";
import db from "../db/index.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

/**
 * POST /api/checkout/purchase
 * Procesa la compra: valida, crea orden, reduce stock, descuenta wallet, limpia carrito
 */
router.post("/purchase", verifyToken, async (req, res) => {
  const { paymentMethod, cardId, deliveryMethod, shippingAddress } = req.body;
  const userId = req.user.id;

  if (!paymentMethod || !deliveryMethod) {
    return res.status(400).json({
      error: "paymentMethod y deliveryMethod son requeridos",
    });
  }

  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    // 1. Obtener carrito del usuario
    const cartResult = await client.query(
      `SELECT id FROM carrito WHERE usuario_id = $1`,
      [userId]
    );

    if (cartResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No tienes carrito" });
    }

    const cartId = cartResult.rows[0].id;

    // 2. Obtener items del carrito
    const cartItemsResult = await client.query(
      `SELECT ci.libro_id, ci.cantidad, ci.precio_unitario, l.stock_general
       FROM carrito_items ci
       JOIN libros l ON ci.libro_id = l.id
       WHERE ci.carrito_id = $1`,
      [cartId]
    );

    const cartItems = cartItemsResult.rows;

    if (cartItems.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Tu carrito está vacío" });
    }

    // 3. Validar stock disponible
    for (const item of cartItems) {
      if (item.stock_general < item.cantidad) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: `Stock insuficiente para un libro en tu carrito. Disponible: ${item.stock_general}, solicitado: ${item.cantidad}`,
        });
      }
    }

    // 4. Calcular total
    const subtotal = cartItems.reduce(
      (acc, item) => acc + parseFloat(item.precio_unitario) * item.cantidad,
      0
    );
    const IVA = 0.19;
    const iva = subtotal * IVA;
    const total = subtotal + iva;

    // 5. Validar método de pago y saldo
    let walletBalance = 0;
    if (paymentMethod === "wallet") {
      const walletResult = await client.query(
        `SELECT saldo_disponible FROM monedero WHERE usuario_id = $1`,
        [userId]
      );

      if (walletResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: "No tienes monedero configurado",
        });
      }

      walletBalance = parseFloat(walletResult.rows[0].saldo_disponible);

      if (walletBalance < total) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: `Saldo insuficiente. Necesitas $${total.toFixed(2)}, tienes $${walletBalance.toFixed(2)}`,
        });
      }
    }

    // 6. Crear compra
    const compraResult = await client.query(
      `INSERT INTO compras (usuario_id, total, estado_compra, metodo_pago)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userId, total, "confirmada", paymentMethod]
    );

    const compraId = compraResult.rows[0].id;

    // 7. Crear items de compra y reducir stock
    for (const item of cartItems) {
      // Insertar en compra_items
      await client.query(
        `INSERT INTO compra_items (compra_id, libro_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          compraId,
          item.libro_id,
          item.cantidad,
          item.precio_unitario,
          parseFloat(item.precio_unitario) * item.cantidad,
        ]
      );

      // Reducir stock
      await client.query(
        `UPDATE libros SET stock_general = stock_general - $1
         WHERE id = $2`,
        [item.cantidad, item.libro_id]
      );
    }

    // 8. Procesar pago con wallet
    if (paymentMethod === "wallet") {
      const newBalance = walletBalance - total;

      // Actualizar saldo del monedero
      await client.query(
        `UPDATE monedero SET saldo_disponible = $1, updated_at = NOW()
         WHERE usuario_id = $2`,
        [newBalance, userId]
      );

      // Registrar transacción
      await client.query(
        `INSERT INTO transacciones_monedero 
         (usuario_id, tipo_transaccion, monto, saldo_anterior, saldo_nuevo, compra_id, descripcion)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          "compra",
          total,
          walletBalance,
          newBalance,
          compraId,
          `Compra de ${cartItems.length} libro(s)`,
        ]
      );
    }

    // 9. Registrar pago
    await client.query(
      `INSERT INTO pagos (compra_id, monto, estado_pago, metodo_pago, tarjeta_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        compraId,
        total,
        paymentMethod === "wallet" ? "aprobado" : "pendiente",
        paymentMethod,
        paymentMethod === "card" ? cardId : null,
      ]
    );

    // 10. Limpiar carrito
    await client.query(
      `DELETE FROM carrito_items WHERE carrito_id = $1`,
      [cartId]
    );

    // 11. Actualizar timestamp del carrito
    await client.query(
      `UPDATE carrito SET fecha_ultima_actualizacion = NOW() WHERE id = $1`,
      [cartId]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Compra procesada exitosamente",
      compra_id: compraId,
      total,
      metodo_pago: paymentMethod,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error en POST /api/checkout/purchase:", err);
    return res.status(500).json({
      error: "Error al procesar la compra",
      details: err.message,
    });
  } finally {
    client.release();
  }
});

export default router;
