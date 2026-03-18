import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db/index.js";

const router = Router();

/**
 * POST /api/auth/register
 * Body: { nombre, apellidos, email, password, telefono, direccion, ciudad, departamento, codigo_postal }
 * Registra un nuevo usuario y lo asigna al rol "Cliente"
 */
router.post("/register", async (req, res) => {
  const { nombre, apellidos, email, password, telefono, direccion, ciudad, departamento, codigo_postal } = req.body;

  // Validar campos requeridos
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Nombre, correo y contraseña son obligatorios." });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "La contraseña debe tener mínimo 8 caracteres." });
  }

  try {
    // 1. Verificar si el email ya existe
    const existingUser = await db.query("SELECT id FROM usuarios WHERE email = $1", [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "El correo ya está registrado." });
    }

    // 2. Generar hash de la contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // 3. Combinar nombre y apellidos
    const nombreCompleto = apellidos ? `${nombre} ${apellidos}` : nombre;

    // 4. Insertar nuevo usuario
    const userResult = await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash, telefono, direccion, ciudad, departamento, codigo_postal, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'activo')
       RETURNING id, nombre, email`,
      [nombreCompleto, email.toLowerCase().trim(), password_hash, telefono || null, direccion || null, ciudad || null, departamento || null, codigo_postal || null]
    );
    
    const userId = userResult.rows[0].id;
    const user = userResult.rows[0];

    // 5. Asignar rol "Cliente" por defecto
    const rolResult = await db.query("SELECT id FROM roles WHERE nombre = 'Cliente'");
    if (rolResult.rows.length > 0) {
      const rolId = rolResult.rows[0].id;
      await db.query(
        "INSERT INTO usuario_roles (usuario_id, rol_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [userId, rolId]
      );
    }

    // 6. Generar JWT
    const payload = {
      id: userId,
      nombre: user.nombre,
      email: user.email,
      roles: ["Cliente"],
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      message: "Registro exitoso.",
      token,
      user: payload,
    });
  } catch (err) {
    console.error("Error en /api/auth/register:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

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
