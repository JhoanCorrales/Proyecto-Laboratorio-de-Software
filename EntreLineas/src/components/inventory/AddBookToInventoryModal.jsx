import { useState, useEffect, useRef } from 'react';
import { booksService } from '../../services/booksService';
import { getLanguageName } from '../../lib/languageMap';

export default function AddBookToInventoryModal({ isOpen, onClose, storeId, onBookAdded }) {
  const [formData, setFormData] = useState({
    libroId: null,
    openLibraryKey: null,
    titulo: '',
    autor: '',
    año: '',
    genero: '',
    paginas: '',
    editorial: '',
    isbn: '',
    idioma: '',
    fechaPublicacion: '',
    precioUnitarioPesos: '',
    cantidadInicial: '1',
    portada_url: '',
  });

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState(new Set());
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const loadCats = async () => {
      try {
        const res = await fetch("http://localhost:4003/api/auth/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (e) {}
    }
    loadCats();
  }, []);

  // Buscar libros mientras el usuario escribe
  const handleTituloChange = async (e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      titulo: value,
      libroId: null,
    }));
    setError('');

    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSearchLoading(true);
    try {
      const searchParams = new URLSearchParams({
        q: `q=${encodeURIComponent(value)}&limit=10&fields=key,title,author_name,cover_i,isbn,first_publish_year,subject,language,number_of_pages_median,publisher`,
        type: "search"
      });
      const res = await fetch(`http://localhost:4003/api/auth/openlibrary?${searchParams}`);
      if (!res.ok) throw new Error("Error buscando libros");
      const data = await res.json();
      
      const parsedBooks = (data.docs || []).map(doc => ({
        id: doc.key,
        titulo: doc.title || '',
        autor: doc.author_name?.[0] || '',
        isbn: doc.isbn?.[0] || '',
        año: doc.first_publish_year ? String(doc.first_publish_year) : '',
        genero: doc.subject?.[0] || '',
        paginas: doc.number_of_pages_median ? String(doc.number_of_pages_median) : '',
        editorial: doc.publisher?.[0] || '',
        idioma: doc.language?.[0] ? getLanguageName(doc.language[0]) : '',
        portada_url: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : '',
      }));
      setSuggestions(parsedBooks);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Error buscando libros:', err);
      setError('Error al buscar libros en Open Library');
    } finally {
      setSearchLoading(false);
    }
  };

  // Seleccionar un libro de las sugerencias
  const handleSelectBook = (book) => {
    setFormData(prev => ({
      ...prev,
      libroId: null,
      openLibraryKey: book.id,
      titulo: book.titulo,
      autor: book.autor || '',
      año: book.año || '',
      genero: '',
      paginas: book.paginas || '',
      editorial: book.editorial || '',
      isbn: book.isbn || '',
      idioma: book.idioma || '',
      portada_url: book.portada_url || '',
      fechaPublicacion: book.año ? `${book.año}-01-01` : '',
    }));
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Cambiar campo de cantidad o precio
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  // Validar el formulario
  const validateForm = () => {
    if (!formData.titulo || !formData.autor) {
      setError('El título y el autor son obligatorios. Selecciona un libro del catálogo.');
      return false;
    }
    if (!formData.precioUnitarioPesos || parseFloat(formData.precioUnitarioPesos) <= 0) {
      setError('El precio debe ser mayor a 0');
      return false;
    }
    if (!formData.cantidadInicial || parseInt(formData.cantidadInicial) < 1) {
      setError('La cantidad debe ser al menos 1');
      return false;
    }
    return true;
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccess('');
    setError('');

    try {
      // 1. Crear el libro en la base de datos local
      const newBook = await booksService.addBook({
        titulo: formData.titulo,
        autor: formData.autor,
        isbn: formData.isbn,
        editorial: formData.editorial,
        paginas: formData.paginas,
        idioma: formData.idioma,
        año: formData.año,
        genero: Array.from(selectedGenres).join(', '),
        precio: parseFloat(formData.precioUnitarioPesos),
        portada_url: formData.portada_url,
      });

      // 2. Agregar al inventario con el nuevo ID (o existente)
      const inventoryData = {
        ...formData,
        libroId: newBook.id
      };
      const result = await booksService.addBookToInventory(storeId, inventoryData);

      setSuccess(`¡${formData.titulo} agregado al inventario!`);

      setTimeout(() => {
        if (onBookAdded) {
          onBookAdded(result);
        }

        setFormData({
          libroId: null,
          openLibraryKey: null,
          titulo: '',
          autor: '',
          año: '',
          genero: '',
          paginas: '',
          editorial: '',
          isbn: '',
          idioma: '',
          fechaPublicacion: '',
          precioUnitarioPesos: '',
          cantidadInicial: '1',
          portada_url: '',
        });
        setSelectedGenres(new Set());
        setError('');
        setSuccess('');
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error al agregar libro:', err);
      setError(err.message || 'Error al agregar el libro. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-dark border border-neutral-border/50 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-neutral-border/30 px-6 py-4 flex items-center justify-between bg-neutral-dark">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">menu_book</span>
            <h2 className="text-lg font-bold text-slate-100">Agregar Libro al Inventario</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-accent rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-neutral-muted">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Mensajes */}
          {success && (
            <div className="p-3 bg-green-900/30 border border-green-600/50 text-green-400 rounded-lg flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {success}
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-600/50 text-red-400 rounded-lg flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {/* Sección: Búsqueda de Libro */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">search</span>
              Buscar Libro
            </h3>

            {/* Campo de búsqueda de título */}
            <div className="relative">
              <label className="block text-sm font-semibold text-slate-100 mb-2">
                Título del Libro <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={formData.titulo}
                  onChange={handleTituloChange}
                  onFocus={() => formData.titulo.trim().length >= 2 && setShowSuggestions(true)}
                  placeholder="Escribe el título del libro (ej: Cien años de...)"
                  className="w-full bg-neutral-accent/50 border border-neutral-border rounded-lg px-4 py-2 text-slate-100 placeholder:text-slate-500 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
                />
                {searchLoading && (
                  <span className="absolute right-3 top-10 material-symbols-outlined text-primary animate-spin">
                    hourglass_empty
                  </span>
                )}
              </div>

              {/* Sugerencias */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-neutral-dark border border-neutral-border/50 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
                >
                  {suggestions.map(book => (
                    <button
                      key={book.id}
                      type="button"
                      onClick={() => handleSelectBook(book)}
                      className="w-full px-4 py-2 text-left hover:bg-neutral-accent/50 transition-colors border-b border-neutral-border/30 last:border-b-0"
                    >
                      <div className="text-slate-100 text-sm font-semibold">{book.titulo}</div>
                      <div className="text-neutral-muted text-xs">{book.autor || 'Autor desconocido'}</div>
                    </button>
                  ))}
                </div>
              )}

              {showSuggestions && formData.titulo.trim().length >= 2 && suggestions.length === 0 && !searchLoading && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-dark border border-neutral-border/50 rounded-lg shadow-lg z-10 p-3 text-center text-neutral-muted text-sm">
                  No se encontraron libros con ese título
                </div>
              )}
            </div>

            {/* Mostrar detalles del libro seleccionado */}
            {(formData.openLibraryKey || formData.autor) && (
              <div className="bg-neutral-accent/30 border border-neutral-border/30 rounded-lg p-4 space-y-2">
                <div className="text-sm">
                  <span className="text-neutral-muted">Autor:</span>
                  <span className="text-slate-100 ml-2">{formData.autor || 'N/A'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-neutral-muted">Género O.L.:</span>
                  <span className="text-slate-100 ml-2">{formData.openLibraryKey ? "Sugerido autollenar o verificar" : 'N/A'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-neutral-muted">Editorial:</span>
                  <span className="text-slate-100 ml-2">{formData.editorial || 'N/A'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-neutral-muted">ISBN:</span>
                  <span className="text-slate-100 ml-2">{formData.isbn || 'N/A'}</span>
                </div>
              </div>
            )}
          </div>

        {/* Sección: Detalles de Inventario */}
          {(formData.openLibraryKey || formData.autor) && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">local_offer</span>
                Clasificación del Libro
              </h3>

              <div className="bg-neutral-accent/30 border border-neutral-border/30 rounded-lg p-4">
                <label className="block text-sm font-semibold text-slate-100 mb-2">
                  Géneros / Categorías Locales <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-40 overflow-y-auto custom-scrollbar p-1">
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={selectedGenres.has(cat.nombre)}
                        onChange={() => {
                          const newSet = new Set(selectedGenres);
                          if (newSet.has(cat.nombre)) {
                            newSet.delete(cat.nombre);
                          } else {
                            newSet.add(cat.nombre);
                          }
                          setSelectedGenres(newSet);
                        }}
                      />
                      <div className={`size-4 rounded-sm border flex items-center justify-center transition-colors ${selectedGenres.has(cat.nombre) ? 'bg-primary border-primary' : 'border-neutral-border group-hover:border-primary/50'}`}>
                        {selectedGenres.has(cat.nombre) && <span className="material-symbols-outlined text-background-dark text-[10px] font-bold">check</span>}
                      </div>
                      <span className="text-sm text-slate-300 group-hover:text-white transition-colors select-none">{cat.nombre}</span>
                    </label>
                  ))}
                </div>
              </div>

              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2 mt-4">
                <span className="material-symbols-outlined text-primary text-lg">inventory_2</span>
                Detalles de Inventario
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Cantidad inicial */}
                <div>
                  <label className="block text-sm font-semibold text-slate-100 mb-2">
                    Cantidad Inicial <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    name="cantidadInicial"
                    value={formData.cantidadInicial}
                    onChange={handleChange}
                    min="1"
                    className="w-full bg-neutral-accent/50 border border-neutral-border rounded-lg px-4 py-2 text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
                    placeholder="1"
                  />
                </div>

                {/* Precio en Pesos */}
                <div>
                  <label className="block text-sm font-semibold text-slate-100 mb-2">
                    Precio por Unidad (COP) <span className="text-red-400">*</span>
                  </label>
                  <div className="flex">
                    <span className="flex items-center px-3 bg-neutral-accent/50 border border-r-0 border-neutral-border rounded-l-lg text-neutral-muted">
                      $
                    </span>
                    <input
                      type="number"
                      name="precioUnitarioPesos"
                      value={formData.precioUnitarioPesos}
                      onChange={handleChange}
                      step="100"
                      min="0"
                      className="flex-1 bg-neutral-accent/50 border border-l-0 border-neutral-border rounded-r-lg px-4 py-2 text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-neutral-border/30">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-neutral-accent text-slate-100 font-bold px-6 py-2 rounded-lg hover:bg-neutral-accent/80 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (!formData.openLibraryKey && !formData.autor)}
              className={`flex-1 font-bold px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                !loading && (formData.openLibraryKey || formData.autor)
                  ? 'bg-primary text-background-dark hover:bg-primary/90 cursor-pointer'
                  : 'bg-neutral-accent text-neutral-muted cursor-not-allowed opacity-50'
              }`}
            >
              <span className="material-symbols-outlined">
                {loading ? 'hourglass_empty' : 'add_circle'}
              </span>
              {loading ? 'Agregando...' : 'Agregar Libro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

