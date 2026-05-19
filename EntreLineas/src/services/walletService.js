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
  const token = localStorage.getItem("token");
  console.log("Token guardado:", token ? "✅ Presente" : "❌ No encontrado");
  console.log("Card ID:", cardId);
  
  const res = await fetch(`${API_URL}/api/wallet/cards/${cardId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  
  console.log("Response status:", res.status);
  const data = await res.json();
  console.log("Response data:", data);
  
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

/**
 * Obtiene el saldo disponible del monedero del usuario
 */
export async function getWalletBalance() {
  const res = await fetch(`${API_URL}/api/wallet/balance`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al obtener saldo del monedero.");
  return data.wallet;
}

/**
 * Agrega fondos al monedero desde una tarjeta de crédito
 * @param {{ monto, tarjetaId }} fundData
 */
export async function addFundsToWallet({ monto, tarjetaId }) {
  const res = await fetch(`${API_URL}/api/wallet/add-funds`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ monto, tarjetaId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al agregar fondos al monedero.");
  return data;
}

/**
 * Obtiene el historial de transacciones del monedero
 */
export async function getWalletTransactions() {
  const res = await fetch(`${API_URL}/api/wallet/wallet-transactions`, {
    headers: getAuthHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al obtener historial de transacciones.");
  return data.transactions;
}
