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
      `SELECT ci.libro_id, ci.cantidad, ci.precio_unitario, l.stock_general, l.titulo
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
    const storeId = deliveryMethod === "pickup" ? (shippingAddress ? shippingAddress.storeId : null) : null;
    if (deliveryMethod === "pickup" && !storeId) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Debe seleccionar una tienda para la recogida" });
    }

    for (const item of cartItems) {
      if (deliveryMethod === "pickup") {
        // Recogida en tienda: Validar stock de esa tienda física
        const storeStockResult = await client.query(
          `SELECT cantidad_disponible FROM inventario_tienda WHERE tienda_id = $1 AND libro_id = $2`,
          [storeId, item.libro_id]
        );
        const storeStock = storeStockResult.rows.length > 0 ? storeStockResult.rows[0].cantidad_disponible : 0;
        if (storeStock < item.cantidad) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: `Stock insuficiente en la tienda seleccionada para "${item.titulo}". Disponible: ${storeStock}, solicitado: ${item.cantidad}`,
          });
        }
      } else {
        // Envío a domicilio: Validar stock general
        if (item.stock_general < item.cantidad) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: `Stock general insuficiente para "${item.titulo}". Disponible: ${item.stock_general}, solicitado: ${item.cantidad}`,
          });
        }
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

    // 6. Crear compra con detalles de entrega
    const tipoEntrega = deliveryMethod === "pickup" ? "recogida" : "domicilio";
    const formattedAddress = deliveryMethod === "home" && shippingAddress
      ? `${shippingAddress.name || ''} - ${shippingAddress.address || ''}, ${shippingAddress.city || ''}`.trim()
      : null;

    const compraResult = await client.query(
      `INSERT INTO compras (usuario_id, total, estado_compra, metodo_pago, tipo_entrega, tienda_id, direccion_envio)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        userId,
        total,
        "confirmada",
        paymentMethod,
        tipoEntrega,
        deliveryMethod === "pickup" ? storeId : null,
        formattedAddress
      ]
    );

    const compraId = compraResult.rows[0].id;

    // 7. Crear items de compra y reducir stock según tipo de entrega
    for (const item of cartItems) {
      if (deliveryMethod === "pickup") {
        // A. Reducir stock de la tienda seleccionada
        await client.query(
          `UPDATE inventario_tienda 
           SET cantidad_disponible = cantidad_disponible - $1, updated_at = NOW()
           WHERE tienda_id = $2 AND libro_id = $3`,
          [item.cantidad, storeId, item.libro_id]
        );

        // B. Crear registro en compra_items con tienda_id
        await client.query(
          `INSERT INTO compra_items (compra_id, libro_id, cantidad, precio_unitario, subtotal, tienda_id)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            compraId,
            item.libro_id,
            item.cantidad,
            item.precio_unitario,
            parseFloat(item.precio_unitario) * item.cantidad,
            storeId,
          ]
        );

        // C. Sincronizar stock global
        await db.updateGlobalStock(item.libro_id, client);

      } else {
        // Envío a Domicilio: Buscar tienda(s) con disponibilidad
        // Primero intentamos buscar una sola tienda que tenga el stock completo
        const availableStoresResult = await client.query(
          `SELECT tienda_id, cantidad_disponible 
           FROM inventario_tienda 
           WHERE libro_id = $1 AND cantidad_disponible >= $2`,
          [item.libro_id, item.cantidad]
        );

        if (availableStoresResult.rows.length > 0) {
          // Si hay tiendas con suficiente stock, elegimos una aleatoria
          const randomIndex = Math.floor(Math.random() * availableStoresResult.rows.length);
          const chosenStoreId = availableStoresResult.rows[randomIndex].tienda_id;

          // A. Reducir stock de la tienda seleccionada
          await client.query(
            `UPDATE inventario_tienda 
             SET cantidad_disponible = cantidad_disponible - $1, updated_at = NOW()
             WHERE tienda_id = $2 AND libro_id = $3`,
            [item.cantidad, chosenStoreId, item.libro_id]
          );

          // B. Insertar en compra_items
          await client.query(
            `INSERT INTO compra_items (compra_id, libro_id, cantidad, precio_unitario, subtotal, tienda_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              compraId,
              item.libro_id,
              item.cantidad,
              item.precio_unitario,
              parseFloat(item.precio_unitario) * item.cantidad,
              chosenStoreId,
            ]
          );

          // C. Sincronizar stock global
          await db.updateGlobalStock(item.libro_id, client);

        } else {
          // Si ninguna tienda tiene stock suficiente individual, dividimos el stock
          // Obtener tiendas con stock > 0
          const partialStoresResult = await client.query(
            `SELECT tienda_id, cantidad_disponible 
             FROM inventario_tienda 
             WHERE libro_id = $1 AND cantidad_disponible > 0 
             ORDER BY cantidad_disponible DESC`,
            [item.libro_id]
          );

          let remaining = item.cantidad;
          const fulfillments = [];

          for (const storeRow of partialStoresResult.rows) {
            const take = Math.min(remaining, storeRow.cantidad_disponible);
            fulfillments.push({ storeId: storeRow.tienda_id, qty: take });
            remaining -= take;
            if (remaining === 0) break;
          }

          if (remaining > 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({
              error: `No hay suficiente stock físico disponible en las tiendas para el despacho de "${item.titulo}"`,
            });
          }

          // Aplicar la reducción y registrar los compra_items correspondientes
          for (const f of fulfillments) {
            await client.query(
              `UPDATE inventario_tienda 
               SET cantidad_disponible = cantidad_disponible - $1, updated_at = NOW()
               WHERE tienda_id = $2 AND libro_id = $3`,
              [f.qty, f.storeId, item.libro_id]
            );

            await client.query(
              `INSERT INTO compra_items (compra_id, libro_id, cantidad, precio_unitario, subtotal, tienda_id)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                compraId,
                item.libro_id,
                f.qty,
                item.precio_unitario,
                parseFloat(item.precio_unitario) * f.qty,
                f.storeId,
              ]
            );
          }

          // C. Sincronizar stock global
          await db.updateGlobalStock(item.libro_id, client);
        }
      }
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
