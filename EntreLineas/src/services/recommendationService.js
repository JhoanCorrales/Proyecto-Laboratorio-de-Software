/**
 * Recommendation Service - AI-like recommendations using NLP
 */

const API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE_URL = `${API_URL}/api`;

// Obtener token del localStorage
const getToken = () => localStorage.getItem('token');

export const recommendationService = {
  /**
   * Get recommendations based on natural language query
   */
  async getRecommendations(query, selectedCategories = []) {
    try {
      const token = getToken();
      if (!token) {
        throw new Error('No estás autenticado');
      }

      const response = await fetch(`${API_BASE_URL}/recommendations/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query,
          selectedCategories
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Error getting recommendations');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in getRecommendations:', error);
      throw error;
    }
  },

  /**
   * Get all available categories
   */
  async getCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Error fetching categories');

      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error('Error in getCategories:', error);
      throw error;
    }
  },

  /**
   * Get user preferences based on purchase history
   */
  async getUserPreferences() {
    try {
      const token = getToken();
      if (!token) {
        console.warn('No token found, skipping user preferences');
        return [];
      }

      const response = await fetch(`${API_BASE_URL}/recommendations/user-preferences`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.warn('Could not fetch preferences:', response.status);
        return [];
      }

      const data = await response.json();
      return data.preferences || [];
    } catch (error) {
      console.error('Error in getUserPreferences:', error);
      return [];
    }
  }
};
