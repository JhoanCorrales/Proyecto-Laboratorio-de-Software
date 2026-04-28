const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4003";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Obtiene todas las tarjetas de crédito del usuario
 */
export async function getCards() {
  const res = await fetch(`${API_URL}/api/wallet/cards`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al obtener tarjetas.");
  return data.cards;
}

/**
 * Agrega una nueva tarjeta de crédito
 * @param {{ numeroTarjeta, titular, fechaExpiracion, tipoTarjeta, esPrincipal }} card
 */
export async function addCard({ numeroTarjeta, titular, fechaExpiracion, tipoTarjeta, esPrincipal }) {
  const res = await fetch(`${API_URL}/api/wallet/cards`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ numeroTarjeta, titular, fechaExpiracion, tipoTarjeta, esPrincipal }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al agregar tarjeta.");
  return data.card;
}

/**
 * Elimina una tarjeta de crédito
 */
export async function deleteCard(cardId) {
  const res = await fetch(`${API_URL}/api/wallet/cards/${cardId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al eliminar tarjeta.");
  return data;
}

/**
 * Establece una tarjeta como principal
 */
export async function setDefaultCard(cardId) {
  const res = await fetch(`${API_URL}/api/wallet/cards/${cardId}/set-default`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al establecer tarjeta principal.");
  return data.card;
}

/**
 * Obtiene el historial de compras del usuario
 */
export async function getPurchases() {
  const res = await fetch(`${API_URL}/api/wallet/purchases`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al obtener historial de compras.");
  return data.purchases;
}
