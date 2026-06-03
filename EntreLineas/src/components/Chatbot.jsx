import { useState, useRef, useEffect } from 'react';
import { recommendationService } from '../services/recommendationService';
import { getToken } from '../services/authService';
import '../styles/chatbot.css';

function Chatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: '¡Hola! Soy tu asistente de recomendaciones literarias. ¿Qué tipo de libros te gustaría descubrir hoy?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [userPreferences, setUserPreferences] = useState([]);
  const messagesEndRef = useRef(null);

  // Auto-scroll a los últimos mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cargar categorías y preferencias al montar
  useEffect(() => {
    // Verificar que el usuario esté autenticado
    const token = getToken();
    if (!token) {
      setMessages([{
        id: 1,
        type: 'bot',
        text: 'Error: No estás autenticado. Por favor, inicia sesión.',
        timestamp: new Date()
      }]);
      return;
    }

    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const categoriesData = await recommendationService.getCategories();
      setCategories(categoriesData);

      const preferencesData = await recommendationService.getUserPreferences();
      if (preferencesData.length > 0) {
        setUserPreferences(preferencesData);
        
        // Agregar mensaje con preferencias
        const genres = [...new Set(preferencesData.map(p => p.genero))].filter(Boolean).slice(0, 3);
        if (genres.length > 0) {
          addBotMessage(`Veo que te interesan géneros como: ${genres.join(', ')}. Puedo usar esto para mejores recomendaciones.`);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      // No es fatal si no puedo cargar preferencias
    }
  };

  const addBotMessage = (text) => {
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      type: 'bot',
      text,
      timestamp: new Date()
    }]);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      type: 'user',
      text,
      timestamp: new Date()
    }]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userQuery = inputValue;
    addUserMessage(userQuery);
    setInputValue('');
    setLoading(true);

    try {
      const result = await recommendationService.getRecommendations(userQuery, selectedCategories);

      if (result.success && result.recommendations.length > 0) {
        // Mensaje con resumen
        addBotMessage(result.message);

        // Crear mensaje con recomendaciones como tarjetas
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          type: 'recommendations',
          recommendations: result.recommendations,
          timestamp: new Date()
        }]);
      } else {
        addBotMessage('No encontré recomendaciones que coincidan con tu búsqueda. ¿Puedes ser más específico o seleccionar algunas categorías?');
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.message.includes('No estás autenticado')) {
        addBotMessage('Por favor, inicia sesión para usar este servicio.');
      } else {
        addBotMessage('Lo siento, ocurrió un error al procesar tu solicitud. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSuggestion = (suggestion) => {
    setInputValue(suggestion);
  };

  const suggestions = [
    'Recomiéndame un thriller',
    'Quiero libros de romance',
    'Dame clásicos de literatura',
    'Libros de aventura y misterio'
  ];

  return (
    <div className="flex flex-col h-screen bg-background-dark">
      {/* Header */}
      <div className="bg-gradient-to-r from-neutral-dark to-neutral-accent border-b border-neutral-border p-6">
        <h1 className="text-2xl font-bold text-primary">Asistente de Recomendaciones</h1>
        <p className="text-neutral-muted text-sm mt-1">
          Cuéntame qué tipo de libros buscas y te daré recomendaciones personalizadas
        </p>
      </div>

      {/* Category Selector */}
      <div className="border-b border-neutral-border p-4 bg-neutral-dark/50">
        <button
          onClick={() => setShowCategorySelector(!showCategorySelector)}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <span>🏷️ Filtrar por categoría</span>
          <span className="text-xs ml-2 bg-primary/20 px-2 py-1 rounded">
            {selectedCategories.length > 0 ? selectedCategories.length : '0'}
          </span>
        </button>

        {showCategorySelector && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {categories.map(cat => (
              <label
                key={cat.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-neutral-accent cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="w-4 h-4 accent-primary"
                />
                <span className="text-sm text-neutral-muted">{cat.nombre}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-neutral-muted">Cargando chat...</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'user' ? (
                  <div className="max-w-md bg-primary/20 border border-primary/40 text-neutral-muted px-4 py-3 rounded-lg">
                    {msg.text}
                  </div>
                ) : msg.type === 'bot' ? (
                  <div className="max-w-2xl bg-neutral-dark border border-neutral-border text-neutral-muted px-4 py-3 rounded-lg">
                    {msg.text}
                  </div>
                ) : msg.type === 'recommendations' ? (
                  <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {msg.recommendations.map((book, i) => (
                      <div
                        key={i}
                        className="bg-neutral-accent border border-neutral-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                      >
                        {book.portada_url && (
                          <img
                            src={book.portada_url}
                            alt={book.titulo}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold text-primary text-sm line-clamp-2">
                            {book.titulo}
                          </h3>
                          <p className="text-xs text-neutral-muted mt-1">{book.autor}</p>
                          {book.categoria && (
                            <span className="text-xs mt-2 inline-block px-2 py-1 bg-primary/20 text-primary rounded">
                              {book.categoria}
                            </span>
                          )}
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-neutral-border">
                            <span className="text-sm font-bold text-primary">
                              ${book.precio}
                            </span>
                            <span className="text-xs text-neutral-muted">
                              {book.stock_total > 0 ? `${book.stock_total} en stock` : 'Sin stock'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-neutral-dark border border-neutral-border text-neutral-muted px-4 py-3 rounded-lg">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Suggestions - Mostrar solo si no hay categorías seleccionadas */}
      {selectedCategories.length === 0 && !loading && (
        <div className="border-t border-neutral-border p-4 bg-neutral-dark/50">
          <p className="text-xs text-neutral-muted mb-3">Sugerencias:</p>
          <div className="flex gap-2 flex-wrap">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(sug)}
                className="text-xs px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-neutral-border bg-neutral-dark p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Cuéntame qué tipo de libros buscas..."
            disabled={loading}
            className="flex-1 bg-neutral-accent border border-neutral-border rounded px-4 py-3 text-neutral-muted placeholder-neutral-muted/50 focus:outline-none focus:border-primary/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="bg-primary hover:bg-primary/80 disabled:bg-neutral-border disabled:cursor-not-allowed text-white px-6 py-3 rounded font-semibold transition-colors"
          >
            {loading ? '...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chatbot;
