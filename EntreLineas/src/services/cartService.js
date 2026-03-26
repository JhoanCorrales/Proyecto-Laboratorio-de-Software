const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4003";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Obtiene el carrito del usuario autenticado.
 * @returns {{ carrito_id: number, items: CartItem[] }}
 */
export async function getCart() {
  const res = await fetch(`${API_URL}/api/cart`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al obtener el carrito.");
  return data;
}

/**
 * Agrega un libro al carrito (o incrementa su cantidad si ya existe).
 * @param {{ titulo, autor, isbn?, portada_url?, precio_unitario, cantidad? }} libro
 */
export async function addToCart({ titulo, autor, isbn, portada_url, precio_unitario, cantidad = 1 }) {
  const res = await fetch(`${API_URL}/api/cart/items`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ titulo, autor, isbn, portada_url, precio_unitario, cantidad }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al agregar el libro al carrito.");
  return data;
}

/**
 * Actualiza la cantidad de un item en el carrito.
 * Si cantidad <= 0, el backend elimina el item.
 */
export async function updateCartItem(libroId, cantidad) {
  const res = await fetch(`${API_URL}/api/cart/items/${libroId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ cantidad }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al actualizar el carrito.");
  return data;
}

/**
 * Elimina un item del carrito por libro_id.
 */
export async function removeCartItem(libroId) {
  const res = await fetch(`${API_URL}/api/cart/items/${libroId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al eliminar el item.");
  return data;
}

/**
 * Vacía todo el carrito del usuario.
 */
export async function clearCart() {
  const res = await fetch(`${API_URL}/api/cart`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al vaciar el carrito.");
  return data;
}
