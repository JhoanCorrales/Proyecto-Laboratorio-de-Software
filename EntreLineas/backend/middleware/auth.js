import jwt from "jsonwebtoken";

/**
 * Middleware para verificar JWT
 * Extrae el token del header Authorization (Bearer token)
 * Agrega los datos del usuario a req.user
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  const token = authHeader.substring(7); // Remover "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Error verificando token:", err.message);
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

export default verifyToken;
