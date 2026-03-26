import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db/index.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

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
        .json({ error: "No existe una cuenta con este correo electrónico." });
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

/**
 * GET /api/auth/profile
 * Obtiene la información del perfil del usuario autenticado
 * Requiere: Authorization: Bearer <token>
 */
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(
      `SELECT id, nombre, email, telefono, direccion, ciudad, departamento, codigo_postal, estado, created_at
       FROM usuarios
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuario = result.rows[0];

    // Obtener roles
    const rolesResult = await db.query(
      `SELECT r.nombre
       FROM usuario_roles ur
       JOIN roles r ON ur.rol_id = r.id
       WHERE ur.usuario_id = $1`,
      [userId]
    );

    const roles = rolesResult.rows.map((row) => row.nombre);

    return res.status(200).json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      telefono: usuario.telefono,
      direccion: usuario.direccion,
      ciudad: usuario.ciudad,
      departamento: usuario.departamento,
      codigo_postal: usuario.codigo_postal,
      roles,
    });
  } catch (err) {
    console.error("Error en /api/auth/profile:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

/**
 * PUT /api/auth/profile
 * Actualiza la información del perfil del usuario
 * Requiere: Authorization: Bearer <token>
 * Body: { nombre, telefono, direccion, ciudad, departamento, codigo_postal }
 */
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { nombre, telefono, direccion, ciudad, departamento, codigo_postal } = req.body;

    // Validar que al menos nombre sea proporcionado
    if (!nombre) {
      return res.status(400).json({ error: "El nombre es obligatorio" });
    }

    const result = await db.query(
      `UPDATE usuarios
       SET nombre = $1, telefono = $2, direccion = $3, ciudad = $4, departamento = $5, codigo_postal = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, nombre, email, telefono, direccion, ciudad, departamento, codigo_postal`,
      [nombre, telefono || null, direccion || null, ciudad || null, departamento || null, codigo_postal || null, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuario = result.rows[0];

    return res.status(200).json({
      message: "Perfil actualizado exitosamente",
      user: usuario,
    });
  } catch (err) {
    console.error("Error en /api/auth/profile (PUT):", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

/**
 * PUT /api/auth/change-password
 * Cambia la contraseña del usuario
 * Requiere: Authorization: Bearer <token>
 * Body: { currentPassword, newPassword }
 */
router.put("/change-password", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Contraseña actual y nueva son obligatorias" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 8 caracteres" });
    }

    // Obtener usuario actual
    const userResult = await db.query(
      "SELECT password_hash FROM usuarios WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const usuario = userResult.rows[0];

    // Verificar contraseña actual
    const passwordValida = await bcrypt.compare(currentPassword, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: "Contraseña actual incorrecta" });
    }

    // Generar nuevo hash
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await db.query(
      "UPDATE usuarios SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [newPasswordHash, userId]
    );

    return res.status(200).json({
      message: "Contraseña actualizada exitosamente",
    });
  } catch (err) {
    console.error("Error en /api/auth/change-password:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

/**
 * DELETE /api/auth/delete-account
 * Elimina la cuenta del usuario (soft delete - marca como inactivo)
 * Requiere: Authorization: Bearer <token>
 * Body: { password } - confirmación de contraseña
 */
router.delete("/delete-account", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "La contraseña es requerida para eliminar la cuenta" });
    }

    const userResult = await db.query(
      "SELECT password_hash FROM usuarios WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const passwordValida = await bcrypt.compare(password, userResult.rows[0].password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    await db.query("DELETE FROM usuarios WHERE id = $1", [userId]);

    return res.status(200).json({ message: "Cuenta eliminada exitosamente" });
  } catch (err) {
    console.error("Error en /api/auth/delete-account:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

// GET /api/categories — público, no requiere token
router.get("/categories", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, nombre, descripcion FROM categorias ORDER BY nombre"
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error en /api/categories:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

// GET /api/auth/openlibrary?q=...&type=search|work
router.get("/openlibrary", async (req, res) => {
  const { q, type } = req.query;
  
  try {
    let url;
    if (type === "work") {
      url = `https://openlibrary.org${q}.json`;
    } else {
      url = `https://openlibrary.org/search.json?${q}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error("Error al contactar Open Library");
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("Error en proxy OpenLibrary:", err);
    return res.status(500).json({ error: "Error al obtener datos de Open Library" });
  }
});

// ============================================================
// GESTIÓN DE USUARIOS — Solo Root
// ============================================================

/**
 * GET /api/auth/users
 * Lista usuarios con paginación, búsqueda y filtro por rol
 * Solo Root puede acceder
 */
router.get("/users", verifyToken, requireRole("Root"), async (req, res) => {
  try {
    const { search = "", rol = "", page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = [];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(u.nombre ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx})`);
      values.push(`%${search}%`);
      paramIdx++;
    }

    if (rol) {
      conditions.push(`r.nombre = $${paramIdx}`);
      values.push(rol);
      paramIdx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countQuery = `
      SELECT COUNT(DISTINCT u.id)
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
      ${where}
    `;
    const countResult = await db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT
        u.id,
        u.nombre,
        u.email,
        u.estado,
        u.created_at,
        COALESCE(
          json_agg(r.nombre) FILTER (WHERE r.nombre IS NOT NULL),
          '[]'
        ) AS roles
      FROM usuarios u
      LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
      LEFT JOIN roles r ON ur.rol_id = r.id
      ${where}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    values.push(Number(limit), offset);

    const result = await db.query(dataQuery, values);

    return res.status(200).json({
      users: result.rows,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("Error en GET /api/auth/users:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

/**
 * PUT /api/auth/users/:id/role
 * Cambia el rol de un usuario
 * Solo Root puede acceder
 */
router.put("/users/:id/role", verifyToken, requireRole("Root"), async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    if (!rol) {
      return res.status(400).json({ error: "El rol es obligatorio." });
    }

    // No permitir cambiar el propio rol
    if (Number(id) === req.user.id) {
      return res.status(400).json({ error: "No puedes cambiar tu propio rol." });
    }

    const rolResult = await db.query("SELECT id FROM roles WHERE nombre = $1", [rol]);
    if (rolResult.rows.length === 0) {
      return res.status(404).json({ error: "Rol no encontrado." });
    }
    const rolId = rolResult.rows[0].id;

    // Eliminar roles actuales y asignar el nuevo
    await db.query("DELETE FROM usuario_roles WHERE usuario_id = $1", [id]);
    await db.query(
      "INSERT INTO usuario_roles (usuario_id, rol_id) VALUES ($1, $2)",
      [id, rolId]
    );

    return res.status(200).json({ message: "Rol actualizado exitosamente." });
  } catch (err) {
    console.error("Error en PUT /api/auth/users/:id/role:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

/**
 * PUT /api/auth/users/:id/estado
 * Activa o suspende una cuenta
 * Solo Root puede acceder
 */
router.put("/users/:id/estado", verifyToken, requireRole("Root"), async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!["activo", "suspendido"].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido." });
    }

    if (Number(id) === req.user.id) {
      return res.status(400).json({ error: "No puedes cambiar tu propio estado." });
    }

    await db.query(
      "UPDATE usuarios SET estado = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [estado, id]
    );

    return res.status(200).json({ message: `Cuenta ${estado === "activo" ? "activada" : "suspendida"} exitosamente.` });
  } catch (err) {
    console.error("Error en PUT /api/auth/users/:id/estado:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

/**
 * POST /api/auth/users/create-admin
 * Crea un nuevo usuario con rol Administrador
 * Solo Root puede acceder
 */
router.post("/users/create-admin", verifyToken, requireRole("Root"), async (req, res) => {
  try {
    const { nombre, apellidos, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Nombre, correo y contraseña son obligatorios." });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener mínimo 8 caracteres." });
    }

    const existing = await db.query("SELECT id FROM usuarios WHERE email = $1", [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "El correo ya está registrado." });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const nombreCompleto = apellidos ? `${nombre} ${apellidos}` : nombre;

    const userResult = await db.query(
      `INSERT INTO usuarios (nombre, email, password_hash, estado)
       VALUES ($1, $2, $3, 'activo')
       RETURNING id, nombre, email`,
      [nombreCompleto, email.toLowerCase().trim(), password_hash]
    );

    const userId = userResult.rows[0].id;

    const rolResult = await db.query("SELECT id FROM roles WHERE nombre = 'Administrador'");
    if (rolResult.rows.length > 0) {
      await db.query(
        "INSERT INTO usuario_roles (usuario_id, rol_id) VALUES ($1, $2)",
        [userId, rolResult.rows[0].id]
      );
    }

    return res.status(201).json({
      message: "Administrador creado exitosamente.",
      user: userResult.rows[0],
    });
  } catch (err) {
    console.error("Error en POST /api/auth/users/create-admin:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
});

export default router;