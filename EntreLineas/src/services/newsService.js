const API_URL = `${import.meta.env.VITE_API_URL || ""}/api/noticias`;

// Obtener todas las noticias (públicas o autenticadas)
export const getNews = async () => {
  const response = await fetch(`${API_URL}`);
  if (!response.ok) throw new Error("Error fetching news");
  return response.json();
};

// Obtener todas las noticias (solo Admin)
export const getAllNews = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/all`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Error fetching all news");
  return response.json();
};

// Crear nueva noticia (solo Admin)
export const createNews = async (newsData) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(newsData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Error al crear la noticia");
  }
  
  return response.json();
};

// Actualizar una noticia (solo Admin)
export const updateNews = async (id, newsData) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(newsData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Error al actualizar la noticia");
  }
  
  return response.json();
};

// Eliminar una noticia (solo Admin)
export const deleteNews = async (id) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Error al eliminar la noticia");
  }
  
  return response.json();
};
