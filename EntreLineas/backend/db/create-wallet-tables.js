/**
 * Script para migrar tablas del monedero a la base de datos existente
 * Ejecutar: node create-wallet-tables.js
 */

import db from "./index.js";

async function createWalletTables() {
  const client = await db.connect();
  
  try {
    console.log("📊 Creando tablas del monedero...\n");

    // 1. Crear tabla monedero
    console.log("1️⃣  Creando tabla 'monedero'...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS monedero (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL UNIQUE,
        saldo_disponible DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (saldo_disponible >= 0),
        saldo_total_agregado DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (saldo_total_agregado >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      );
    `);
    console.log("   ✅ Tabla 'monedero' creada");

    // 2. Crear índice en monedero
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_monedero_usuario_id ON monedero(usuario_id);
    `);
    console.log("   ✅ Índice 'idx_monedero_usuario_id' creado\n");

    // 3. Crear tabla transacciones_monedero
    console.log("2️⃣  Creando tabla 'transacciones_monedero'...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS transacciones_monedero (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL,
        tipo_transaccion VARCHAR(50) NOT NULL CHECK (tipo_transaccion IN ('agregar_fondos', 'compra', 'reembolso')),
        monto DECIMAL(10, 2) NOT NULL CHECK (monto > 0),
        saldo_anterior DECIMAL(10, 2),
        saldo_nuevo DECIMAL(10, 2),
        referencia_pago VARCHAR(100),
        tarjeta_id INTEGER,
        compra_id INTEGER,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (tarjeta_id) REFERENCES tarjetas_credito(id) ON DELETE SET NULL,
        FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE SET NULL
      );
    `);
    console.log("   ✅ Tabla 'transacciones_monedero' creada");

    // 4. Crear índices en transacciones_monedero
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transacciones_monedero_usuario_id ON transacciones_monedero(usuario_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transacciones_monedero_tipo ON transacciones_monedero(tipo_transaccion);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_transacciones_monedero_fecha ON transacciones_monedero(created_at);
    `);
    console.log("   ✅ Índices de transacciones creados\n");

    console.log("✅ ¡Migraciones completadas exitosamente!");
    console.log("\nTablas creadas:");
    console.log("  • monedero");
    console.log("  • transacciones_monedero");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error durante la migración:", err.message);
    console.error("\nDetalles:", err);
    process.exit(1);
  } finally {
    client.release();
  }
}

createWalletTables();
