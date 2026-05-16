import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getStores } from '../services/storesService';
import AddBookToInventoryModal from '../components/inventory/AddBookToInventoryModal';
import EditBookModal from '../components/inventory/EditBookModal';
import { booksService } from '../services/booksService';

export default function StoreInventoryPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showEditBookModal, setShowEditBookModal] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState(null);

  // Búsqueda y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const itemsPerPage = 5;

  const retryLoad = () => {
    setError('');
    setRetryCount(c => c + 1);
  };

  // Cargar tienda
  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoading(true);
        const data = await getStores();
        const foundStore = data.stores.find(s => s.id === parseInt(storeId));
        if (!foundStore) {
          setError('Tienda no encontrada');
          return;
        }
        setStore(foundStore);
        setError('');
      } catch (err) {
        console.error('Error cargando tienda:', err);
        setError('Error al cargar la tienda');
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [storeId, retryCount]);

  // Cargar inventario de la tienda
  useEffect(() => {
    const fetchInventory = async () => {
      if (!store) return;
      
      try {
        setLoading(true);
        const inventory = await booksService.getStoreInventory(store.id);
        
        // Transformar datos del inventario para la tabla
        const formattedBooks = inventory.map((item, index) => ({
          id: item.id,
          codigo: `LIB-${String(item.libro_id).padStart(4, '0')}`,
          titulo: item.titulo,
          autor: item.autor,
          categoria: item.genero,
          stock: item.stock,
          estado: item.stock > 5 ? 'disponible' : item.stock > 0 ? 'bajo' : 'agotado',
          libro_id: item.libro_id,
          precio: item.precio,
        }));
        
        setBooks(formattedBooks);
        setError('');
      } catch (err) {
        console.error('Error cargando inventario:', err);
        setError('Error al cargar el inventario');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [store, retryCount]);

  // Filtrar libros
  const filteredBooks = books.filter(book => {
    const matchesSearch =
      book.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.codigo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || book.categoria === selectedCategory;
    const matchesStatus = !selectedStatus || book.estado === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBooks = filteredBooks.slice(startIndex, startIndex + itemsPerPage);

  // Estadísticas
  const stats = {
    disponibles: books.filter(b => b.estado === 'disponible').length,
    bajoStock: books.filter(b => b.estado === 'bajo').length,
    agotados: books.filter(b => b.estado === 'agotado').length,
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'disponible':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'bajo':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'agotado':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-neutral-accent text-neutral-muted';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'disponible':
        return 'Disponible';
      case 'bajo':
        return 'Bajo Stock';
      case 'agotado':
        return 'Agotado';
      default:
        return status;
    }
  };

  const handleBookAdded = (newBook) => {
    const codigo = `LIB-${String(newBook.libro_id).padStart(4, '0')}`;
    const estado = newBook.stock > 5 ? 'disponible' : newBook.stock > 0 ? 'bajo' : 'agotado';
    const bookWithId = {
      id: newBook.id,
      codigo,
      titulo: newBook.titulo,
      autor: newBook.autor,
      categoria: newBook.genero,
      stock: newBook.stock,
      estado,
      libro_id: newBook.libro_id,
    };
    setBooks(prev => [bookWithId, ...prev]);
    setSuccess(`¡${newBook.titulo} agregado al inventario!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleBookUpdated = () => {
    // Para recargar los datos
    const event = new Event('reload_inventory');
    document.dispatchEvent(event);
  };

  // Reload inventory whenever 'reload_inventory' event is fired (or we could extract fetchInventory)
  useEffect(() => {
    const fetchInventory = async () => {
      if (!store) return;
      try {
        setLoading(true);
        const inventory = await booksService.getStoreInventory(store.id);
        const formattedBooks = inventory.map((item) => ({
          id: item.id,
          codigo: `LIB-${String(item.libro_id).padStart(4, '0')}`,
          titulo: item.titulo,
          autor: item.autor,
          categoria: item.genero,
          stock: item.stock,
          estado: item.stock > 5 ? 'disponible' : item.stock > 0 ? 'bajo' : 'agotado',
          libro_id: item.libro_id,
          precio: item.precio,
        }));
        setBooks(formattedBooks);
      } catch (err) {
        console.error('Error cargando inventario:', err);
      } finally {
        setLoading(false);
      }
    };
    
    document.addEventListener('reload_inventory', fetchInventory);
    return () => document.removeEventListener('reload_inventory', fetchInventory);
  }, [store]);

  if (loading) {
    return (
      <div className="dark min-h-screen bg-background-dark text-slate-100">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin">
              <span className="material-symbols-outlined text-primary text-6xl">
                inventory_2
              </span>
            </div>
            <p className="mt-4 text-neutral-muted">Cargando tienda...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="dark min-h-screen bg-background-dark text-slate-100">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-red-400">
              error
            </span>
            <p className="mt-4 text-red-400">{error || 'Tienda no encontrada'}</p>
            <div className="flex gap-3 mt-4 justify-center">
              <button
                onClick={retryLoad}
                className="px-4 py-2 bg-primary text-background-dark font-bold rounded-lg hover:bg-primary/90 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Reintentar
              </button>
              <button
                onClick={() => navigate('/stores')}
                className="px-4 py-2 bg-neutral-accent text-slate-100 font-bold rounded-lg hover:bg-neutral-accent/80"
              >
                Volver a Tiendas
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background-dark text-slate-100">
      <Navbar />

      <div className="pt-20 lg:pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          {/* Header con breadcrumb */}
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => navigate('/stores')}
              className="flex items-center gap-2 text-neutral-muted hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Tiendas
            </button>
            <span className="text-neutral-muted">/</span>
            <span className="text-slate-100 font-semibold">{store.nombre}</span>
          </div>

          {/* Título y botón */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-1">Gestionar Existencias</h1>
              <p className="text-neutral-muted text-sm">
                Control de inventario de <span className="text-primary">{store.nombre}</span> en tiempo real.
              </p>
            </div>
            <button
              onClick={() => setShowAddBookModal(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-background-dark px-4 py-2 rounded-lg font-bold transition-colors"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Agregar Libro
            </button>
          </div>

          {/* Mensajes */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/30 border border-red-600/50 text-red-400 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              <span className="flex-1">{error}</span>
              <button
                onClick={retryLoad}
                className="ml-auto flex items-center gap-1 text-sm font-bold px-3 py-1 bg-red-600/20 hover:bg-red-600/40 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Reintentar
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-900/30 border border-green-600/50 text-green-400 rounded-lg flex items-center gap-2">
              <span className="material-symbols-outlined">check_circle</span>
              {success}
            </div>
          )}

          {/* Búsqueda y Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-neutral-dark/40 p-4 rounded-xl border border-neutral-border/30 backdrop-blur-sm mb-6">
            <div className="md:col-span-6">
              <label className="flex flex-col w-full h-11">
                <div className="flex w-full flex-1 items-stretch rounded-lg h-full group">
                  <div className="text-neutral-muted flex border border-r-0 border-neutral-border bg-neutral-accent/50 items-center justify-center pl-4 rounded-l-lg transition-colors group-focus-within:border-primary group-focus-within:text-primary">
                    <span className="material-symbols-outlined">search</span>
                  </div>
                  <input
                    className="form-input flex w-full min-w-0 flex-1 border border-l-0 border-neutral-border bg-neutral-accent/50 text-slate-100 focus:ring-0 focus:border-primary h-full placeholder:text-neutral-muted/70 px-4 rounded-r-lg text-sm transition-colors"
                    placeholder="Buscar por nombre o código del libro"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </label>
            </div>
            <div className="md:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-11 rounded-lg bg-neutral-accent border border-neutral-border px-4 text-slate-100 hover:bg-neutral-accent/80 transition-colors focus:border-primary focus:ring-primary/30 appearance-none cursor-pointer"
              >
                <option value="">Todas las Categorías</option>
                {[...new Set(books.map(b => b.categoria))].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-3">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-11 rounded-lg bg-neutral-accent border border-neutral-border px-4 text-slate-100 hover:bg-neutral-accent/80 transition-colors focus:border-primary focus:ring-primary/30 appearance-none cursor-pointer"
              >
                <option value="">Todos los Estados</option>
                <option value="disponible">Disponible</option>
                <option value="bajo">Bajo Stock</option>
                <option value="agotado">Agotado</option>
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-neutral-dark/60 rounded-xl border border-neutral-border/50 overflow-hidden backdrop-blur-md shadow-2xl mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-accent/50 border-b border-neutral-border/50">
                    <th className="px-6 py-4 text-slate-100 text-xs font-bold uppercase tracking-wider">Código</th>
                    <th className="px-6 py-4 text-slate-100 text-xs font-bold uppercase tracking-wider w-1/3">Nombre del Libro</th>
                    <th className="px-6 py-4 text-slate-100 text-xs font-bold uppercase tracking-wider">Categoría</th>
                    <th className="px-6 py-4 text-slate-100 text-xs font-bold uppercase tracking-wider text-center">Stock</th>
                    <th className="px-6 py-4 text-slate-100 text-xs font-bold uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-neutral-muted text-xs font-bold uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border/30">
                  {paginatedBooks.length > 0 ? (
                    paginatedBooks.map(book => (
                      <tr key={book.id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-6 py-4 text-neutral-muted text-sm font-mono">{book.codigo}</td>
                        <td className="px-6 py-4 text-slate-100 text-sm font-semibold">{book.titulo}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-accent text-neutral-muted">
                            {book.categoria}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-100 text-sm font-bold">{book.stock}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-tight border ${getStatusBadgeColor(book.estado)}`}>
                            {getStatusLabel(book.estado)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedBookId(book.libro_id);
                                setShowEditBookModal(true);
                              }}
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Editar Libro"
                            >
                              <span className="material-symbols-outlined">edit</span>
                            </button>
                            <button
                              className="p-2 text-neutral-muted hover:bg-neutral-accent rounded-lg transition-colors"
                              title="Ver historial"
                            >
                              <span className="material-symbols-outlined">history</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center">
                        <div className="text-neutral-muted">
                          <span className="material-symbols-outlined text-4xl block mb-2">search_off</span>
                          <p>No se encontraron libros con los criterios de búsqueda</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer de tabla con paginación */}
            {filteredBooks.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 bg-neutral-accent/30 border-t border-neutral-border/30">
                <p className="text-neutral-muted text-xs">
                  Mostrando {startIndex + 1} de {filteredBooks.length} libros
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex size-8 items-center justify-center rounded-lg border border-neutral-border text-slate-100 hover:bg-neutral-accent transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-primary text-background-dark'
                            : 'border border-neutral-border text-slate-100 hover:bg-neutral-accent'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && <span className="text-neutral-muted px-1">...</span>}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex size-8 items-center justify-center rounded-lg border border-neutral-border text-slate-100 hover:bg-neutral-accent transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-dark/40 border border-neutral-border/30 p-4 rounded-xl flex items-center gap-4">
              <div className="size-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div>
                <p className="text-neutral-muted text-xs uppercase tracking-wider font-bold">Libros Disponibles</p>
                <p className="text-2xl font-bold text-slate-100">{stats.disponibles}</p>
              </div>
            </div>
            <div className="bg-neutral-dark/40 border border-neutral-border/30 p-4 rounded-xl flex items-center gap-4">
              <div className="size-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div>
                <p className="text-neutral-muted text-xs uppercase tracking-wider font-bold">Bajo Stock</p>
                <p className="text-2xl font-bold text-slate-100">{stats.bajoStock}</p>
              </div>
            </div>
            <div className="bg-neutral-dark/40 border border-neutral-border/30 p-4 rounded-xl flex items-center gap-4">
              <div className="size-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                <span className="material-symbols-outlined">error</span>
              </div>
              <div>
                <p className="text-neutral-muted text-xs uppercase tracking-wider font-bold">Agotados</p>
                <p className="text-2xl font-bold text-slate-100">{stats.agotados}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddBookToInventoryModal
        isOpen={showAddBookModal}
        onClose={() => setShowAddBookModal(false)}
        storeId={storeId}
        onBookAdded={handleBookAdded}
      />

      {showEditBookModal && (
        <EditBookModal
          isOpen={showEditBookModal}
          onClose={() => {
            setShowEditBookModal(false);
            setSelectedBookId(null);
          }}
          storeId={storeId}
          libroId={selectedBookId}
          onBookUpdated={handleBookUpdated}
        />
      )}
    </div>
  );
}
