/**
 * Books Service - Fetch book data from API
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4003';
const API_BASE_URL = `${API_URL}/api`;

export const booksService = {
  /**
   * Search books by title
   */
  async searchByTitle(query) {
    try {
      const response = await fetch(`${API_BASE_URL}/books/search?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (!response.ok) throw new Error('Error searching books');
      
      const data = await response.json();
      return data.books || [];
    } catch (error) {
      console.error('Error in searchByTitle:', error);
      throw error;
    }
  },

  /**
   * Add a new book
   */
  async addBook(bookData) {
    try {
      const response = await fetch(`${API_BASE_URL}/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(bookData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error creating book');
      }
      
      const data = await response.json();
      return data.book;
    } catch (error) {
      console.error('Error in addBook:', error);
      throw error;
    }
  },

  /**
   * Get book by ID
   */
  async getBookById(bookId) {
    try {
      const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (!response.ok) throw new Error('Error fetching book');
      
      const data = await response.json();
      return data.book;
    } catch (error) {
      console.error('Error in getBookById:', error);
      throw error;
    }
  },

  /**
   * Get all books
   */
  async getAllBooks() {
    try {
      const response = await fetch(`${API_BASE_URL}/books`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (!response.ok) throw new Error('Error fetching books');
      
      const data = await response.json();
      return data.books || [];
    } catch (error) {
      console.error('Error in getAllBooks:', error);
      throw error;
    }
  },

  /**
   * Get store inventory (books in a specific store)
   */
  async getStoreInventory(storeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/stores/${storeId}/inventory`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
      });

      if (!response.ok) throw new Error('Error fetching store inventory');
      
      const data = await response.json();
      return data.inventory || [];
    } catch (error) {
      console.error('Error in getStoreInventory:', error);
      throw error;
    }
  },

  /**
   * Add book to store inventory
   */
  async addBookToInventory(storeId, bookData) {
    try {
      const response = await fetch(`${API_BASE_URL}/stores/${storeId}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          libro_id: bookData.libroId,
          cantidad_disponible: parseInt(bookData.cantidadInicial),
          precio_unitario: parseFloat(bookData.precioUnitarioPesos),
          cantidad_minima: 5,
          cantidad_maxima: 100,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error adding book to inventory');
      }
      
      const data = await response.json();
      return data.inventory;
    } catch (error) {
      console.error('Error in addBookToInventory:', error);
      throw error;
    }
  },

  /**
   * Update an existing book globally
   */
  async updateBook(bookId, bookData) {
    try {
      const response = await fetch(`${API_BASE_URL}/books/${bookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(bookData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error updating book');
      }
      
      const data = await response.json();
      return data.book;
    } catch (error) {
      console.error('Error in updateBook:', error);
      throw error;
    }
  },

  /**
   * Update book inventory stock for a store
   */
  async updateBookInventory(storeId, bookId, inventoryData) {
    try {
      const response = await fetch(`${API_BASE_URL}/stores/${storeId}/inventory/${bookId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          cantidad_disponible: parseInt(inventoryData.cantidadInicial),
          cantidad_minima: 5,
          cantidad_maxima: 100,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error updating book inventory');
      }
      
      const data = await response.json();
      return data.inventory;
    } catch (error) {
      console.error('Error in updateBookInventory:', error);
      throw error;
    }
  },
};
