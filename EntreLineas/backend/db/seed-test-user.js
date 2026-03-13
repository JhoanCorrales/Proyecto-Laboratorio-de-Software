/**
 * Script para insertar un usuario de prueba en la DB.
 * Ejecutar UNA SOLA VEZ desde la carpeta backend/:
 *   node db/seed-test-user.js
 */
import pkg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;
const pool = new Pool();

async function seedTestUser() {
  const email = "test@entrelineas.com";
  const password = "password123";
  const nombre = "Usuario Test";

  // 1. Verificar si ya existe el usuario
  const existing = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email]);
  if (existing.rows.length > 0) {
    console.log(`✅ El usuario ${email} ya existe (id: ${existing.rows[0].id}). No se insertó de nuevo.`);
    await pool.end();
    return;
  }

  // 2. Generar hash de la contraseña
  const password_hash = await bcrypt.hash(password, 10);

  // 3. Insertar usuario
  const userResult = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, estado)
     VALUES ($1, $2, $3, 'activo')
     RETURNING id`,
    [nombre, email, password_hash]
  );
  const userId = userResult.rows[0].id;
  console.log(`✅ Usuario creado con id: ${userId}`);

  // 4. Asignar rol "Cliente" (id=2 según el schema.sql)
  const rolResult = await pool.query("SELECT id FROM roles WHERE nombre = 'Cliente'");
  if (rolResult.rows.length > 0) {
    const rolId = rolResult.rows[0].id;
    await pool.query(
      "INSERT INTO usuario_roles (usuario_id, rol_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [userId, rolId]
    );
    console.log(`✅ Rol "Cliente" asignado.`);
  } else {
    console.warn("⚠️  No se encontró el rol 'Cliente'. Asegúrese de que el schema.sql fue ejecutado.");
  }

  console.log("\n📋 Credenciales de prueba:");
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);

  await pool.end();
}

seedTestUser().catch((err) => {
  console.error("Error en seed:", err.message);
  process.exit(1);
});
