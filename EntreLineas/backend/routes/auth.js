import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db/index.js";

const router = Router();

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Verifica credenciales contra la tabla `usuarios` y retorna un JWT
 * con los roles del usuario (tabla `usuario_roles` JOIN `roles`).
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "El correo y la contraseña son obligatorios." });
  }

  try {
    // 1. Buscar usuario por email en la tabla `usuarios`
    const usuarioResult = await db.query(
      `SELECT id, nombre, email, password_hash, estado
       FROM usuarios
       WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (usuarioResult.rows.length === 0) {
      return res
        .status(401)
        .json({ error: "Credenciales incorrectas." });
    }

    const usuario = usuarioResult.rows[0];

    // 2. Verificar que el usuario esté activo
    if (usuario.estado !== "activo") {
      return res
        .status(403)
        .json({ error: "Tu cuenta está inactiva o suspendida." });
    }

    // 3. Comparar contraseña con el hash almacenado
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res
        .status(401)
        .json({ error: "Credenciales incorrectas." });
    }

    // 4. Obtener roles del usuario via `usuario_roles` JOIN `roles`
    const rolesResult = await db.query(
      `SELECT r.nombre
       FROM usuario_roles ur
       JOIN roles r ON ur.rol_id = r.id
       WHERE ur.usuario_id = $1`,
      [usuario.id]
    );

    const roles = rolesResult.rows.map((row) => row.nombre);

    // 5. Generar JWT
    const payload = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      roles,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      message: "Login exitoso.",
      token,
      user: payload,
    });
  } catch (err) {
    console.error("Error en /api/auth/login:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

export default router;
