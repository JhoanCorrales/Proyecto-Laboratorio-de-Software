/**
 * Servicio para gestión de tiendas
 * Realiza operaciones CRUD con la API backend
 */

const API_URL = "http://localhost:4003/api/stores";

/**
 * Obtiene todas las tiendas
 */
export async function getStores() {
  try {
    const response = await fetch(`${API_URL}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching stores:", error);
    throw error;
  }
}

/**
 * Crea una nueva tienda
 * @param {Object} storeData - Datos de la tienda
 */
export async function createStore(storeData) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authenticated");
    }

    const response = await fetch(`${API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(storeData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Error creating store:", error);
    throw error;
  }
}

/**
 * Actualiza una tienda existente
 * @param {number} storeId - ID de la tienda
 * @param {Object} storeData - Datos a actualizar
 */
export async function updateStore(storeId, storeData) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authenticated");
    }

    const response = await fetch(`${API_URL}/${storeId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(storeData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Error updating store:", error);
    throw error;
  }
}

/**
 * Elimina una tienda
 * @param {number} storeId - ID de la tienda
 */
export async function deleteStore(storeId) {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authenticated");
    }

    const response = await fetch(`${API_URL}/${storeId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Error deleting store:", error);
    throw error;
  }
}
