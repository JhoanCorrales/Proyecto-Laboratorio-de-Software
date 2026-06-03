import jwt from "jsonwebtoken";

/**
 * Middleware para verificar JWT
 * Extrae el token del header Authorization (Bearer token)
 * Agrega los datos del usuario a req.user
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("Auth error: No auth header or invalid format", { authHeader });
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  const token = authHeader.substring(7); // Remover "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token verified successfully for user:", decoded.id);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Error verificando token:", err.message);
    console.error("JWT_SECRET length:", process.env.JWT_SECRET?.length);
    return res.status(401).json({ error: "Token inválido o expirado", details: err.message });
  }
}

/**
 * Middleware para verificar roles
 * Requiere que el usuario tenga al menos uno de los roles especificados
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "No autenticado." });
    }
    const userRoles = req.user.roles ?? [];
    const hasRole = roles.some((r) => userRoles.includes(r));
    if (!hasRole) {
      return res.status(403).json({ error: "No tienes permisos para realizar esta acción." });
    }
    next();
  };
};

export default verifyToken;
