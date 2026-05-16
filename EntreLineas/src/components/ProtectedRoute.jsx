import { Navigate } from "react-router-dom";

/**
 * Componente ProtectedRoute
 * Protege rutas requiriendo autenticación y opcionalmente un rol específico
 * 
 * Uso:
 * <ProtectedRoute requiredRole="Root">
 *   <RoleManagement />
 * </ProtectedRoute>
 * 
 * <ProtectedRoute excludeRoles={["Root", "Administrador"]}>
 *   <Wallet />
 * </ProtectedRoute>
 */
function ProtectedRoute({ children, requiredRole, excludeRoles = [] }) {
  const token = localStorage.getItem("token");
  
  // Si no hay token, redirigir a login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    // Decodificar el token (JWT)
    const payload = JSON.parse(atob(token.split(".")[1]));
    const roles = payload.roles ?? [];

    // Si se requiere un rol específico y el usuario no lo tiene, redirigir a home
    if (requiredRole && !roles.includes(requiredRole)) {
      return <Navigate to="/home" replace />;
    }

    // Si hay roles excluidos y el usuario tiene alguno, redirigir a home
    if (excludeRoles.length > 0 && roles.some(role => excludeRoles.includes(role))) {
      return <Navigate to="/home" replace />;
    }

    // Token válido y permisos correctos, renderizar el componente
    return children;
  } catch {
    // Token inválido, redirigir a login
    return <Navigate to="/" replace />;
  }
}

export default ProtectedRoute;
