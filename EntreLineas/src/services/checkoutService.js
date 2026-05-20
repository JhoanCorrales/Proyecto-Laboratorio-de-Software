const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4003";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Procesa la compra con los datos proporcionados
 * @param {{
 *   paymentMethod: 'wallet' | 'card',
 *   cardId?: number,
 *   deliveryMethod: 'home' | 'pickup',
 *   shippingAddress?: object
 * }} purchaseData
 */
export async function processPurchase(purchaseData) {
  const res = await fetch(`${API_URL}/api/checkout/purchase`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(purchaseData),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al procesar la compra.");
  return data;
}

/**
 * Obtiene el historial de compras del usuario
 */
export async function getPurchaseHistory() {
  const res = await fetch(`${API_URL}/api/purchases`, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al obtener historial de compras.");
  return data;
}

/**
 * Obtiene los detalles de una compra específica
 */
export async function getPurchaseDetail(purchaseId) {
  const res = await fetch(`${API_URL}/api/purchases/${purchaseId}`, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al obtener detalles de la compra.");
  return data;
}

/**
 * Cancela una compra
 */
export async function cancelPurchase(purchaseId) {
  const res = await fetch(`${API_URL}/api/purchases/${purchaseId}/cancel`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error al cancelar la compra.");
  return data;
}
