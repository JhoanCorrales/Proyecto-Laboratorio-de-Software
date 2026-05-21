import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getAllNews, createNews, updateNews, deleteNews } from '../services/newsService';
import { getStores } from '../services/storesService';
import { booksService } from '../services/booksService';

// Reusing dynamic cover logic with improved search
async function getDynamicCover(titulo, editorial, autor = '', retries = 3, searchMode = 'full') {
  if (!titulo) return null;
  try {
    let url;
    
    // Modo 1: Buscar por título + autor (más específico)
    if (searchMode === 'full' && autor) {
      url = `https://openlibrary.org/search.json?title=${encodeURIComponent(titulo)}&author=${encodeURIComponent(autor)}&limit=1`;
    }
    // Modo 2: Buscar por título + editorial
    else if (searchMode === 'editorial' && editorial) {
      url = `https://openlibrary.org/search.json?title=${encodeURIComponent(titulo)}&publisher=${encodeURIComponent(editorial)}&limit=1`;
    }
    // Modo 3: Buscar solo por título
    else {
      url = `https://openlibrary.org/search.json?title=${encodeURIComponent(titulo)}&limit=1`;
    }
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.docs?.length && data.docs[0].cover_i) {
      return `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`;
    }
    
    // Fallback: intentar siguiente modo
    if (searchMode === 'full' && autor) {
      return getDynamicCover(titulo, editorial, autor, retries, 'editorial');
    }
    if (searchMode === 'editorial' && editorial) {
      return getDynamicCover(titulo, editorial, autor, retries, 'title');
    }
    
    // Si llegamos aquí con modo 'title', reintentar con espera
    if (searchMode === 'title' && retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return getDynamicCover(titulo, editorial, autor, retries - 1, 'title');
    }
  } catch {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1500));
      return getDynamicCover(titulo, editorial, autor, retries - 1, searchMode);
    }
  }
  return null;
}

export default function NewsPublisherPage() {
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // View mode: 'list' or 'form'
  const [viewMode, setViewMode] = useState('list');
  
  // Stores and inventory
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [storeInventory, setStoreInventory] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [coverUrl, setCoverUrl] = useState(null);
  
  // Form state
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [resumen, setResumen] = useState('');
  const [estado, setEstado] = useState('publicada');
  const [featured, setFeatured] = useState(false);
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const data = await getAllNews();
        setNews(data.noticias || []);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Error al cargar las noticias');
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  // Load stores on mount
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const data = await getStores();
        setStores(data.stores || []);
      } catch (err) {
        console.error('Error loading stores:', err);
      }
    };
    fetchStores();
  }, []);

  // Load inventory when store changes
  useEffect(() => {
    if (selectedStoreId && viewMode === 'form') {
      setStoreInventory([]);
      setSelectedBookId('');
      setSelectedBook(null);
      setCoverUrl(null);
      booksService.getStoreInventory(selectedStoreId)
        .then(inventory => setStoreInventory(inventory))
        .catch(err => console.error("Error loading inventory:", err));
    } else {
      setStoreInventory([]);
      setSelectedBookId('');
      setSelectedBook(null);
      setCoverUrl(null);
    }
  }, [selectedStoreId, viewMode]);

  // Update selected book details and fetch cover from store inventory data
  useEffect(() => {
    if (selectedBookId && storeInventory.length > 0) {
      const book = storeInventory.find(b => b.id.toString() === selectedBookId.toString());
      setSelectedBook(book || null);
      
      if (book) {
        setCoverUrl(null);
        // Always search dynamically using the store inventory book data
        getDynamicCover(book.titulo, book.editorial, book.autor).then(url => {
          if (url) setCoverUrl(url);
        });
      }
    } else {
      setSelectedBook(null);
      setCoverUrl(null);
    }
  }, [selectedBookId, storeInventory]);

  const resetForm = () => {
    setTitulo('');
    setContenido('');
    setResumen('');
    setEstado('publicada');
    setFeatured(false);
    setSelectedStoreId('');
    setSelectedBookId('');
    setSelectedBook(null);
    setCoverUrl(null);
    setIsEditing(false);
    setEditingId(null);
    setError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setViewMode('form');
  };

  const handleOpenEdit = (noticia) => {
    setTitulo(noticia.titulo);
    setContenido(noticia.contenido);
    setResumen(noticia.resumen || '');
    setEstado(noticia.estado || 'publicada');
    setFeatured(noticia.featured || false);
    setIsEditing(true);
    setEditingId(noticia.id);
    setError('');
    setViewMode('form');
  };

  const handleBackToList = () => {
    setViewMode('list');
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!titulo.trim() || !contenido.trim()) {
      setError('El título y contenido son obligatorios');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    const newsData = {
      titulo,
      contenido,
      resumen,
      estado,
      fecha_publicacion: new Date().toISOString().split('T')[0],
      featured,
      libro_relacionado_id: selectedBook ? selectedBook.id : null,
    };

    try {
      if (isEditing && editingId) {
        await updateNews(editingId, newsData);
        setSuccess('Noticia actualizada con éxito');
        setNews(news.map(n => n.id === editingId ? { ...n, ...newsData } : n));
      } else {
        const response = await createNews(newsData);
        setSuccess('Noticia creada con éxito');
        setNews([response.noticia, ...news]);
      }
      
      setTimeout(() => {
        handleBackToList();
        setSuccess('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error al guardar la noticia');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setSubmitting(true);
    setError('');
    
    try {
      await deleteNews(id);
      setSuccess('Noticia eliminada con éxito');
      setNews(news.filter(n => n.id !== id));
      setDeleteConfirm(null);
      
      setTimeout(() => setSuccess(''), 1500);
    } catch (err) {
      setError(err.message || 'Error al eliminar la noticia');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background-dark font-display text-slate-100 min-h-screen">
      <Navbar />
      <div 
        className="fixed inset-0 z-0 opacity-10 bg-center bg-cover" 
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCsO1KjwnvU9fRI3E_vm9vhLEG9xjWGfqEfmjAZ7jobjHdjH8G7fJdDqMXwLNKfDe5vTiiFyLE-E3SL-k90sua1b-aEHHJPnGdNoLvaX1MVtxJ46hQQG5qO9JakJaPkfeTlP8BTvPEsCbjysAaBMXGAjak1CSeBFyznnBFVSryNmFzcbnkLqbkgSbN_hIrb0p0WYU80dWM5WfaIO3B3AliMfDaaJ0N_rnc5Yfx16ZkZAF7H8LvUDwSe-7y6sWOH89BRszEHcXuUW6U')" }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-background-dark to-background-dark/95" />

      {viewMode === 'list' ? (
        // Vista de lista
        <main className="relative z-10 max-w-5xl mx-auto px-6 py-16">
          <header className="mb-12 text-center flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-6">
              <button 
                onClick={() => navigate('/stores')}
                className="flex items-center gap-2 text-neutral-muted hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Volver
              </button>
              <button
                onClick={handleOpenCreate}
                className="bg-primary hover:bg-primary/90 text-background-dark font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined">add</span>
                Nueva noticia
              </button>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">Gestionar Noticias</h1>
            <p className="text-neutral-muted text-lg max-w-2xl">Visualiza, crea, edita y elimina las noticias de la biblioteca Entre Líneas</p>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-600/50 text-red-400 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-900/30 border border-green-600/50 text-green-400 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined">check_circle</span>
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <span className="material-symbols-outlined text-primary text-5xl animate-spin">autorenew</span>
            </div>
          ) : news.length === 0 ? (
            <div className="text-center py-20 bg-neutral-dark/40 border border-neutral-border rounded-2xl">
              <span className="material-symbols-outlined text-6xl text-neutral-muted mb-4">newspaper</span>
              <h2 className="text-2xl font-bold text-white mb-2">No hay noticias aún</h2>
              <p className="text-neutral-muted mb-4">Crea tu primera noticia para que aparezca aquí</p>
              <button
                onClick={handleOpenCreate}
                className="bg-primary hover:bg-primary/90 text-background-dark font-bold py-2 px-6 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined">add</span>
                Crear noticia
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {news.map((item) => (
                <AdminNewsCard 
                  key={item.id} 
                  noticia={item} 
                  onEdit={handleOpenEdit}
                  onDelete={() => setDeleteConfirm(item.id)}
                  isDeleting={submitting && deleteConfirm === item.id}
                />
              ))}
            </div>
          )}
        </main>
      ) : (
        // Vista del formulario (mockup)
        <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
          <header className="mb-10">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 text-neutral-muted hover:text-white transition-colors mb-4"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Volver
            </button>
            <h1 className="text-4xl font-bold text-white mb-2">Publicar libro en noticias</h1>
            <p className="text-neutral-muted text-lg">Crea una noticia destacada para promocionar un libro en la biblioteca Entre Líneas</p>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-600/50 text-red-400 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Columna izquierda - Formulario */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Selección de libro */}
              <section className="bg-neutral-dark/80 border border-neutral-border p-6 rounded-xl">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">menu_book</span>
                  Selección del libro
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">1. Seleccionar tienda</label>
                    <select 
                      value={selectedStoreId}
                      onChange={(e) => setSelectedStoreId(e.target.value)}
                      className="w-full bg-background-dark border border-neutral-border rounded-lg h-14 px-4 text-white focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                    >
                      <option value="">Seleccione una tienda...</option>
                      {stores.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre} - {s.ciudad}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">2. Seleccionar libro</label>
                    <select 
                      value={selectedBookId}
                      onChange={(e) => setSelectedBookId(e.target.value)}
                      disabled={!selectedStoreId || storeInventory.length === 0}
                      className="w-full bg-background-dark border border-neutral-border rounded-lg h-14 px-4 text-white focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer disabled:opacity-50"
                    >
                      <option value="">Buscar libro para publicar...</option>
                      {storeInventory.map(b => (
                        <option key={b.id} value={b.id}>{b.titulo} - {b.autor}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-background-dark rounded-lg border border-neutral-border/50">
                    <div className="w-16 h-24 bg-neutral-dark border border-neutral-border rounded shadow-md flex items-center justify-center text-neutral-muted overflow-hidden">
                      {coverUrl ? (
                        <img src={coverUrl} alt="Portada" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-4xl">book</span>
                      )}
                    </div>
                    <div>
                      {selectedBook ? (
                        <>
                          <p className="text-white font-medium">{selectedBook.titulo}</p>
                          <p className="text-neutral-muted text-sm">{selectedBook.autor}</p>
                          <p className="text-neutral-muted text-xs mt-1">Stock: {selectedBook.stock}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-white font-medium">Ningún libro seleccionado</p>
                          <p className="text-neutral-muted text-sm italic">Seleccione tienda y libro para ver vista previa</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Información de la noticia */}
              <section className="bg-neutral-dark/80 border border-neutral-border p-6 rounded-xl">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">article</span>
                  Información de la noticia
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Título de la noticia *</label>
                    <input 
                      type="text" 
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      className="w-full bg-background-dark border border-neutral-border rounded-lg h-12 px-4 text-white placeholder:text-neutral-muted/50 focus:ring-2 focus:ring-primary focus:border-primary" 
                      placeholder="Ej: Nueva edición especial disponible"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Contenido o descripción de la noticia *</label>
                    <textarea 
                      value={contenido}
                      onChange={(e) => setContenido(e.target.value)}
                      className="w-full bg-background-dark border border-neutral-border rounded-lg p-4 text-white placeholder:text-neutral-muted/50 focus:ring-2 focus:ring-primary focus:border-primary resize-none" 
                      placeholder="Escribe el cuerpo de la noticia aquí..."
                      rows="6"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Resumen breve (opcional)</label>
                    <input 
                      type="text" 
                      value={resumen}
                      onChange={(e) => setResumen(e.target.value)}
                      className="w-full bg-background-dark border border-neutral-border rounded-lg h-12 px-4 text-white placeholder:text-neutral-muted/50 focus:ring-2 focus:ring-primary focus:border-primary" 
                      placeholder="Un pequeño extracto para la lista de noticias"
                    />
                  </div>
                </div>
              </section>

              {/* Configuración de publicación */}
              <section className="bg-neutral-dark/80 border border-neutral-border p-6 rounded-xl">
                <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">settings</span>
                  Configuración de publicación
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">Estado</label>
                    <select 
                      value={estado}
                      onChange={(e) => setEstado(e.target.value)}
                      className="w-full bg-background-dark border border-neutral-border rounded-lg h-12 px-4 text-white focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                    >
                      <option value="borrador">Borrador</option>
                      <option value="publicada">Publicar ahora</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 flex items-center gap-3 py-2">
                    <input 
                      type="checkbox" 
                      id="featured"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="w-5 h-5 rounded bg-background-dark border border-neutral-border text-primary focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="featured" className="text-white text-sm font-medium cursor-pointer">
                      Marcar como noticia destacada
                    </label>
                  </div>
                </div>
              </section>
            </div>

            {/* Columna derecha - Vista previa y botones */}
            <div className="lg:col-span-5">
              <div className="sticky top-12 space-y-6">
                
                {/* Vista previa */}
                <div className="bg-neutral-dark/80 border border-neutral-border rounded-xl overflow-hidden shadow-2xl">
                  <div className="p-4 border-b border-neutral-border flex justify-between items-center bg-white/5">
                    <span className="text-white font-bold uppercase tracking-wider text-xs">Vista Previa</span>
                    <span className="material-symbols-outlined text-neutral-muted text-sm">visibility</span>
                  </div>
                  <div className="p-0">
                    <div className="relative h-64 bg-slate-800 flex items-center justify-center overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-background-dark to-transparent opacity-80 z-10"></div>
                      {coverUrl ? (
                        <img 
                          className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40" 
                          alt="Background" 
                          src={coverUrl}
                        />
                      ) : (
                        <img 
                          className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40" 
                          alt="Background" 
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAma6dOe7pGrXxAnyhNh3TT10Y912ZMcnFfHeZyCUcOiHyvllWkcYzQA1XZimdgibv0AzKlk8yOMlYErpQGs0GtYcgDfbNmRiPZeN1FxGTTE30GwKdfSSQYlTtbEel1K5-zhO7-dIgNxO_InWQCm_3O9m5Ocd2vt38taCLK9c6CD2pglInoLfVPzMweKodkfdmjl4Ou-NsfULvUydF_YrTIyMAUY8dfDeJ1KgttiyEHCA10cKWm0tMCuSkok_RYC2CitVaKgjN-PQc"
                        />
                      )}
                      <div className="relative z-20 text-center p-6">
                        <h3 className="text-2xl font-bold text-white leading-tight">
                          {titulo || 'Título de la noticia aquí'}
                        </h3>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex gap-4">
                        <div className="w-24 h-36 bg-background-dark border border-neutral-border flex-shrink-0 flex items-center justify-center rounded overflow-hidden">
                          {coverUrl ? (
                            <img src={coverUrl} alt="Portada" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-3xl text-neutral-border">menu_book</span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {selectedBook ? (
                            <>
                              <p className="text-white font-bold">{selectedBook.titulo}</p>
                              <p className="text-primary text-sm">{selectedBook.autor}</p>
                              <p className="text-neutral-muted text-sm line-clamp-4 mt-2">
                                {resumen || contenido || 'Aquí aparecerá el resumen breve de la noticia...'}
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="h-4 w-3/4 bg-neutral-border/30 rounded"></div>
                              <div className="h-3 w-1/2 bg-neutral-border/20 rounded"></div>
                              <p className="text-neutral-muted text-sm line-clamp-4 mt-2">
                                {resumen || contenido || 'Aquí aparecerá el resumen breve de la noticia que escribas en el formulario...'}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="pt-4 flex justify-end">
                        <button type="button" className="bg-primary/20 text-primary border border-primary/30 px-6 py-2 rounded-full font-medium hover:bg-primary/30 transition-colors">
                          Ver más
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="bg-neutral-dark/80 border border-neutral-border p-6 rounded-xl flex flex-col gap-3">
                  <button 
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">send</span>
                    {isEditing ? 'Guardar cambios' : 'Publicar'}
                  </button>
                  <button 
                    type="button"
                    onClick={handleBackToList}
                    disabled={submitting}
                    className="w-full bg-background-dark hover:bg-neutral-accent text-white border border-neutral-border font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Guardar como borrador
                  </button>
                  <button 
                    type="button"
                    onClick={handleBackToList}
                    disabled={submitting}
                    className="w-full text-red-400 hover:text-red-300 font-medium py-2 px-6 rounded-lg transition-colors text-sm"
                  >
                    Cancelar y descartar
                  </button>
                </div>
              </div>
            </div>
          </form>
        </main>
      )}

      {/* Modal de confirmación de eliminación - accesible desde ambas vistas */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-neutral-dark border border-red-600/50 rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-400">warning</span>
              Eliminar noticia
            </h3>
            <p className="text-neutral-muted mb-6">¿Estás seguro de que deseas eliminar esta noticia? Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => handleDelete(deleteConfirm)}
                disabled={submitting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                Sí, eliminar
              </button>
              <button 
                onClick={() => setDeleteConfirm(null)}
                disabled={submitting}
                className="flex-1 bg-neutral-dark hover:bg-neutral-accent text-white border border-neutral-border font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Admin version of NewsCard with edit/delete buttons
function AdminNewsCard({ noticia, onEdit, onDelete, isDeleting }) {
  const [coverUrl, setCoverUrl] = useState(noticia.portada_url || null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!noticia.portada_url && noticia.libro_titulo) {
      let cancelled = false;
      getDynamicCover(noticia.libro_titulo, noticia.libro_editorial, noticia.libro_autor || '').then(url => {
        if (!cancelled && url) {
          setCoverUrl(url);
        }
      });
      return () => { cancelled = true; };
    }
  }, [noticia]);

  const handleImageError = () => {
    if (noticia.libro_titulo) {
      setCoverUrl(null);
      getDynamicCover(noticia.libro_titulo, noticia.libro_editorial, noticia.libro_autor || '').then(url => {
        if (url) setCoverUrl(url);
      });
    }
  };

  return (
    <article className="bg-neutral-dark/80 border border-neutral-border rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-primary/30 transition-all duration-300 flex flex-col md:flex-row group">
      
      {/* Cover Side */}
      <div className="md:w-1/3 relative bg-slate-900 min-h-[250px] flex items-center justify-center overflow-hidden">
        {coverUrl ? (
           <>
             <img src={coverUrl} onError={handleImageError} className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40 scale-110 group-hover:scale-100 transition-transform duration-700" alt="Fondo" />
             <img src={coverUrl} onError={handleImageError} className="relative z-10 w-32 md:w-40 h-auto rounded shadow-2xl group-hover:-translate-y-2 transition-transform duration-500" alt="Libro" />
           </>
        ) : (
          <div className="flex flex-col items-center justify-center text-neutral-muted">
            <span className="material-symbols-outlined text-5xl mb-2">menu_book</span>
            <span className="text-sm font-medium">Libro relacionado</span>
          </div>
        )}
      </div>

      {/* Content Side */}
      <div className="md:w-2/3 p-6 md:p-8 flex flex-col justify-between bg-gradient-to-r from-transparent to-neutral-dark/30">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <span className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">campaign</span>
                Novedad
              </span>
              <span className={`text-xs font-bold px-2 py-1 rounded ${
                noticia.estado === 'publicada' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {noticia.estado}
              </span>
            </div>
            <span className="text-neutral-muted text-sm font-medium bg-neutral-accent px-3 py-1 rounded-full">
              {new Date(noticia.fecha_publicacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
            {noticia.titulo}
          </h2>
          
          {noticia.resumen && (
            <p className="text-slate-300 text-lg mb-4 italic border-l-2 border-primary/50 pl-4">
              {noticia.resumen}
            </p>
          )}
          
          <p className={`text-neutral-muted leading-relaxed whitespace-pre-wrap ${!isExpanded ? 'line-clamp-4' : ''}`}>
            {noticia.contenido}
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-sm">person</span>
            </div>
            <div>
              <p className="text-xs text-neutral-muted">Publicado por</p>
              <p className="text-sm font-bold text-slate-200">{noticia.autor_noticia || 'Administrador'}</p>
            </div>
          </div>
          
          <div className="w-full sm:w-auto flex gap-2">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-1 sm:flex-none bg-neutral-accent hover:bg-primary hover:text-background-dark text-white font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-sm">
                {isExpanded ? 'expand_less' : 'arrow_forward'}
              </span>
              {isExpanded ? 'Ocultar' : 'Leer'}
            </button>
            <button 
              onClick={() => onEdit(noticia)}
              className="flex-1 sm:flex-none bg-blue-600/20 hover:bg-blue-600/40 border border-blue-600/50 text-blue-400 font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              Editar
            </button>
            <button 
              onClick={onDelete}
              disabled={isDeleting}
              className="flex-1 sm:flex-none bg-red-600/20 hover:bg-red-600/40 border border-red-600/50 text-red-400 font-bold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
