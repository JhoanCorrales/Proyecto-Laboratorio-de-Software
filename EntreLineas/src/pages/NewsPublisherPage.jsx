import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getStores } from '../services/storesService';
import { booksService } from '../services/booksService';
import { createNews } from '../services/newsService';

// Reusing dynamic cover logic from other components
async function getDynamicCover(titulo, editorial, retries = 3, usePublisher = true) {
  if (!titulo) return null;
  try {
    let url = `https://openlibrary.org/search.json?title=${encodeURIComponent(titulo)}&limit=1&fields=cover_i`;
    if (usePublisher && editorial) url += `&publisher=${encodeURIComponent(editorial)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.docs?.length && data.docs[0].cover_i) {
      return `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`;
    }
    if (usePublisher && editorial) return getDynamicCover(titulo, editorial, retries, false);
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return getDynamicCover(titulo, editorial, retries - 1, false);
    }
  } catch {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1500));
      return getDynamicCover(titulo, editorial, retries - 1, usePublisher);
    }
  }
  return null;
}

export default function NewsPublisherPage() {
  const navigate = useNavigate();
  
  // Data State
  const [stores, setStores] = useState([]);
  const [storeInventory, setStoreInventory] = useState([]);
  
  // Form State
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  
  const [tituloNoticia, setTituloNoticia] = useState('');
  const [contenido, setContenido] = useState('');
  const [resumen, setResumen] = useState('');
  const [estado, setEstado] = useState('publicada');
  const [fechaPublicacion, setFechaPublicacion] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [coverUrl, setCoverUrl] = useState(null);

  useEffect(() => {
    // Load stores on mount
    getStores()
      .then(data => setStores(data.stores || []))
      .catch(err => console.error("Error loading stores:", err));
  }, []);

  useEffect(() => {
    // Load inventory when store changes
    if (selectedStoreId) {
      setStoreInventory([]);
      setSelectedBookId('');
      setSelectedBook(null);
      booksService.getStoreInventory(selectedStoreId)
        .then(inventory => setStoreInventory(inventory))
        .catch(err => console.error("Error loading inventory:", err));
    } else {
      setStoreInventory([]);
      setSelectedBookId('');
      setSelectedBook(null);
    }
  }, [selectedStoreId]);

  useEffect(() => {
    // Update selected book details and fetch cover
    if (selectedBookId && storeInventory.length > 0) {
      const book = storeInventory.find(b => b.id.toString() === selectedBookId.toString());
      setSelectedBook(book || null);
      
      if (book) {
        setCoverUrl(null); // Reset cover while loading
        if (book.portada_url) {
          setCoverUrl(book.portada_url);
        } else {
          getDynamicCover(book.titulo, book.editorial).then(url => {
            if (url) setCoverUrl(url);
          });
        }
      }
    } else {
      setSelectedBook(null);
      setCoverUrl(null);
    }
  }, [selectedBookId, storeInventory]);

  const handleSubmit = async (e, forceEstado = null) => {
    if (e) e.preventDefault();
    if (!tituloNoticia.trim() || !contenido.trim()) {
      setError('El título y el contenido son obligatorios.');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    const finalEstado = forceEstado || estado;

    try {
      await createNews({
        titulo: tituloNoticia,
        contenido,
        resumen,
        estado: finalEstado,
        fecha_publicacion: fechaPublicacion,
        libro_relacionado_id: selectedBook ? selectedBook.id : null,
      });
      setSuccess(`Noticia ${finalEstado === 'borrador' ? 'guardada como borrador' : 'publicada'} con éxito.`);
      
      // Reset form on success after short delay
      setTimeout(() => {
        setTituloNoticia('');
        setContenido('');
        setResumen('');
        setSelectedStoreId('');
        setSuccess('');
        window.scrollTo(0, 0);
      }, 3000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la noticia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-dark text-slate-100 min-h-screen relative font-display">
      <Navbar />
      <div 
        className="fixed inset-0 z-0 opacity-30 bg-center bg-cover" 
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCsO1KjwnvU9fRI3E_vm9vhLEG9xjWGfqEfmjAZ7jobjHdjH8G7fJdDqMXwLNKfDe5vTiiFyLE-E3SL-k90sua1b-aEHHJPnGdNoLvaX1MVtxJ46hQQG5qO9JakJaPkfeTlP8BTvPEsCbjysAaBMXGAjak1CSeBFyznnBFVSryNmFzcbnkLqbkgSbN_hIrb0p0WYU80dWM5WfaIO3B3AliMfDaaJ0N_rnc5Yfx16ZkZAF7H8LvUDwSe-7y6sWOH89BRszEHcXuUW6U')" }}
      />
      <div className="fixed inset-0 z-0 bg-background-dark/80" />
      
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Publicar libro en noticias</h1>
            <p className="text-neutral-muted text-lg">Crea una noticia destacada para promocionar un libro en la biblioteca Entre Líneas</p>
          </div>
          <button 
            onClick={() => navigate('/stores')}
            className="flex items-center gap-2 text-neutral-muted hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Volver a Tiendas
          </button>
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Formulario (Izquierda) */}
          <div className="lg:col-span-7 space-y-6">
            <section className="bg-neutral-dark/80 border border-neutral-border p-6 rounded-xl backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">menu_book</span>
                Selección del libro
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">1. Seleccionar Tienda</label>
                    <select 
                      value={selectedStoreId}
                      onChange={(e) => setSelectedStoreId(e.target.value)}
                      className="w-full bg-background-dark border border-neutral-border rounded-lg h-12 px-4 text-white focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                    >
                      <option value="">Seleccione una tienda...</option>
                      {stores.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre} - {s.ciudad}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">2. Seleccionar Libro</label>
                    <select 
                      value={selectedBookId}
                      onChange={(e) => setSelectedBookId(e.target.value)}
                      disabled={!selectedStoreId || storeInventory.length === 0}
                      className="w-full bg-background-dark border border-neutral-border rounded-lg h-12 px-4 text-white focus:ring-primary focus:border-primary appearance-none disabled:opacity-50 cursor-pointer"
                    >
                      <option value="">Buscar libro para publicar...</option>
                      {storeInventory.map(b => (
                        <option key={b.id} value={b.id}>{b.titulo} - {b.autor}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-background-dark rounded-lg border border-neutral-border/50">
                  <div className="w-16 h-24 bg-neutral-dark border border-neutral-border rounded shadow-md flex items-center justify-center overflow-hidden">
                    {coverUrl ? (
                      <img src={coverUrl} alt="Portada" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-neutral-muted">book</span>
                    )}
                  </div>
                  <div>
                    {selectedBook ? (
                      <>
                        <p className="text-white font-medium">{selectedBook.titulo}</p>
                        <p className="text-neutral-muted text-sm">{selectedBook.autor}</p>
                        <p className="text-neutral-muted text-xs mt-1">Stock en tienda: {selectedBook.stock}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-white font-medium">Ningún libro seleccionado</p>
                        <p className="text-neutral-muted text-sm italic">Seleccione tienda y título arriba</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-neutral-dark/80 border border-neutral-border p-6 rounded-xl backdrop-blur-sm">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">article</span>
                Información de la noticia
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Título de la noticia</label>
                  <input 
                    type="text" 
                    value={tituloNoticia}
                    onChange={(e) => setTituloNoticia(e.target.value)}
                    className="w-full bg-background-dark border border-neutral-border rounded-lg h-12 px-4 text-white placeholder:text-neutral-muted/50 focus:ring-primary focus:border-primary" 
                    placeholder="Ej: Nueva edición especial disponible" 
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Contenido o descripción de la noticia</label>
                  <textarea 
                    value={contenido}
                    onChange={(e) => setContenido(e.target.value)}
                    className="w-full bg-background-dark border border-neutral-border rounded-lg p-4 text-white placeholder:text-neutral-muted/50 focus:ring-primary focus:border-primary resize-none" 
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
                    className="w-full bg-background-dark border border-neutral-border rounded-lg h-12 px-4 text-white placeholder:text-neutral-muted/50 focus:ring-primary focus:border-primary" 
                    placeholder="Un pequeño extracto para la lista de noticias" 
                  />
                </div>
              </div>
            </section>

            <section className="bg-neutral-dark/80 border border-neutral-border p-6 rounded-xl backdrop-blur-sm">
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
                    className="w-full bg-background-dark border border-neutral-border rounded-lg h-12 px-4 text-white focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="borrador">Borrador</option>
                    <option value="publicada">Publicar ahora</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Fecha de publicación</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={fechaPublicacion}
                      onChange={(e) => setFechaPublicacion(e.target.value)}
                      className="w-full bg-background-dark border border-neutral-border rounded-lg h-12 px-4 text-white focus:ring-primary focus:border-primary [color-scheme:dark]" 
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Vista Previa y Acciones (Derecha) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-6">
              
              <div className="bg-neutral-dark/80 border border-neutral-border rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
                <div className="p-4 border-b border-neutral-border flex justify-between items-center bg-white/5">
                  <span className="text-white font-bold uppercase tracking-wider text-xs">Vista Previa</span>
                  <span className="material-symbols-outlined text-neutral-muted text-sm">visibility</span>
                </div>
                
                <div className="p-0">
                  <div className="relative h-64 bg-slate-800 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-background-dark to-transparent opacity-90 z-10"></div>
                    {coverUrl ? (
                      <img src={coverUrl} className="absolute inset-0 w-full h-full object-cover blur-sm opacity-50" alt="Fondo" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background-dark" />
                    )}
                    <div className="relative z-20 text-center p-6 w-full">
                      <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-lg">
                        {tituloNoticia || 'Título de la noticia aquí'}
                      </h3>
                      {fechaPublicacion && (
                        <p className="text-primary mt-2 text-sm font-bold">
                          {new Date(fechaPublicacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4 bg-background-dark">
                    <div className="flex gap-4">
                      <div className="w-24 h-36 bg-neutral-dark border border-neutral-border flex-shrink-0 flex items-center justify-center overflow-hidden rounded-md shadow-lg">
                        {coverUrl ? (
                          <img src={coverUrl} className="w-full h-full object-cover" alt="Libro" />
                        ) : (
                          <span className="material-symbols-outlined text-3xl text-neutral-muted">menu_book</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {selectedBook ? (
                          <>
                            <h4 className="text-white font-bold truncate">{selectedBook.titulo}</h4>
                            <p className="text-primary text-sm truncate">{selectedBook.autor}</p>
                          </>
                        ) : (
                          <>
                            <div className="h-4 w-3/4 bg-neutral-border/30 rounded mb-2"></div>
                            <div className="h-3 w-1/2 bg-neutral-border/20 rounded"></div>
                          </>
                        )}
                        <p className="text-neutral-muted text-sm line-clamp-4 mt-3 whitespace-pre-wrap">
                          {resumen || contenido || 'Aquí aparecerá el resumen breve o contenido de la noticia que escribas en el formulario...'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                      <button disabled className="bg-primary/10 text-primary border border-primary/20 px-6 py-2 rounded-full font-medium opacity-70 cursor-not-allowed">
                        Ver más
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-dark/80 border border-neutral-border p-6 rounded-xl flex flex-col gap-3 backdrop-blur-sm">
                <button 
                  onClick={(e) => handleSubmit(e, 'publicada')}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">send</span>
                  Publicar ahora
                </button>
                <button 
                  onClick={(e) => handleSubmit(e, 'borrador')}
                  disabled={loading}
                  className="w-full bg-background-dark hover:bg-neutral-accent text-white border border-neutral-border font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                >
                  Guardar como borrador
                </button>
                <button 
                  onClick={() => navigate('/stores')}
                  disabled={loading}
                  className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 font-medium py-2 px-6 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  Cancelar y volver
                </button>
              </div>
              
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
