const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4003";

/**
 * Hace login contra el backend.
 * @param {string} email
 * @param {string} password
 * @returns {{ token: string, user: { id, nombre, email, roles: string[] } }}
 * @throws {Error} con el mensaje de error del servidor
 */
export async function login(email, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Error al iniciar sesión.");
  }

  return data; // { token, user }
}

/**
 * Guarda el token y los datos del usuario en localStorage.
 * @param {string} token
 * @param {{ id, nombre, email, roles: string[] }} user
 */
export function saveSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

/**
 * Obtiene el usuario actual desde localStorage.
 * @returns {{ id, nombre, email, roles: string[] } | null}
 */
export function getCurrentUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

/**
 * Obtiene el token JWT almacenado.
 * @returns {string | null}
 */
export function getToken() {
  return localStorage.getItem("token");
}

/**
 * Cierra la sesión eliminando los datos del localStorage.
 */
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
