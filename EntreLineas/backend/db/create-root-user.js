/**
 * Script para crear el usuario Root
 * Ejecutar: node create-root-user.js
 */

import bcrypt from "bcryptjs";
import db from "./index.js";

const password = "RootPassword123!"; // IMPORTANTE: Cambiar esta contraseña en producción
const email = "root@entrelineas.com";
const nombre = "Root";

async function createRootUser() {
  try {
    console.log("🔐 Creando usuario Root...");

    // 1. Verificar si el usuario Root ya existe
    const existingUser = await db.query("SELECT id FROM usuarios WHERE email = $1", [email]);
    if (existingUser.rows.length > 0) {
      console.log("⚠️  El usuario Root ya existe en la base de datos.");
      process.exit(0);
    }

    // 2. Generar hash de la contraseña
    const hash = await bcrypt.hash(password, 10);
    console.log("✓ Hash de contraseña generado");

    // 3. Insertar usuario Root
    const result = await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash, estado)
       VALUES ($1, $2, $3, 'activo')
       RETURNING id`,
      [nombre, email, hash]
    );

    const userId = result.rows[0].id;
    console.log(`✓ Usuario Root creado con id: ${userId}`);

    // 4. Obtener el ID del rol Root
    const rolResult = await db.query("SELECT id FROM roles WHERE nombre = 'Root'");
    if (rolResult.rows.length === 0) {
      console.error("❌ Error: El rol 'Root' no existe en la base de datos.");
      console.error("   Asegúrate de ejecutar schema.sql primero.");
      process.exit(1);
    }

    const rolId = rolResult.rows[0].id;

    // 5. Asignar rol Root al usuario
    await db.query(
      "INSERT INTO usuario_roles (usuario_id, rol_id) VALUES ($1, $2)",
      [userId, rolId]
    );
    console.log(`✓ Rol Root asignado al usuario`);

    console.log("\n✅ Usuario Root creado exitosamente!");
    console.log(`\n📧 Email: ${email}`);
    console.log(`🔑 Contraseña: ${password}`);
    console.log("\n⚠️  IMPORTANTE:");
    console.log("   - Cambiar la contraseña después del primer inicio de sesión");
    console.log("   - Esta contraseña es temporal solo para setup inicial");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error al crear usuario Root:", err);
    process.exit(1);
  }
}

createRootUser();
