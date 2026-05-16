import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import StoreMap from '../components/map/StoreMap';
import StoreFormModal from '../components/map/StoreFormModal';
import { getStores, createStore, deleteStore } from '../services/storesService';

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [tempMarker, setTempMarker] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar tiendas de la API
  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getStores();
      setStores(data.stores || []);
    } catch (err) {
      console.error('Error cargando tiendas:', err);
      setError('Error al cargar las tiendas');
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (latlng) => {
    setTempMarker({ lat: latlng.lat, lng: latlng.lng });
    setShowForm(true);
  };

  const handleRemoveMarker = () => {
    setTempMarker(null);
    setShowForm(false);
  };

  const handleCreateStore = async (formData) => {
    try {
      setError('');
      setSuccess('');
      
      // formData ya contiene latitud y longitud del marcador
      await createStore(formData);
      
      setSuccess('Tienda creada exitosamente');
      setTempMarker(null);
      setShowForm(false);
      
      // Recargar tiendas
      await fetchStores();
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error creando tienda:', err);
      setError(err.message || 'Error al crear la tienda');
    }
  };

  const handleDeleteStore = async (storeId) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta tienda?')) {
      try {
        setError('');
        setSuccess('');
        
        await deleteStore(storeId);
        
        setSuccess('Tienda eliminada exitosamente');
        
        // Recargar tiendas
        await fetchStores();
        
        // Limpiar mensaje de éxito después de 3 segundos
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Error eliminando tienda:', err);
        setError(err.message || 'Error al eliminar la tienda');
      }
    }
  };

  if (loading) {
    return (
      <div className="dark min-h-screen bg-background-dark text-slate-100">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin">
              <span className="material-symbols-outlined text-primary text-6xl">
                location_on
              </span>
            </div>
            <p className="mt-4 text-neutral-muted">Cargando tiendas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background-dark text-slate-100">
      <Navbar />

      <div className="pt-20 lg:pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-screen flex flex-col">
          {/* Mensajes de estado */}
          {error && (
            <div className="mb-4 p-4 bg-red-900/30 border border-red-600/50 text-red-400 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">error</span>
                {error}
              </div>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-4 bg-green-900/30 border border-green-600/50 text-green-400 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">check_circle</span>
                {success}
              </div>
              <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-300">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-slate-100 mb-2 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-4xl">
                location_on
              </span>
              Gestionar Tiendas en Pereira
            </h1>
            <p className="text-neutral-muted">
              Crea y administra tus puntos de venta en diferentes ubicaciones de Pereira
            </p>
          </div>

          {/* Grid: Mapa + Listado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            {/* Mapa - 2/3 del ancho */}
            <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
              <div className="bg-neutral-dark/40 border border-neutral-border/30 rounded-xl overflow-hidden flex-1">
                <StoreMap
                  stores={stores}
                  tempMarker={tempMarker}
                  onMapClick={handleMapClick}
                  onRemoveMarker={handleRemoveMarker}
                />
              </div>

              {/* Información */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-neutral-dark/60 border border-neutral-border/50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-lg">store</span>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-muted font-semibold">
                        Tiendas Activas
                      </p>
                      <p className="text-2xl font-bold text-slate-100">{stores.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-dark/60 border border-neutral-border/50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-muted font-semibold">
                        Operativas
                      </p>
                      <p className="text-2xl font-bold text-slate-100">
                        {stores.filter((s) => s.estado === 'activa').length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-dark/60 border border-neutral-border/50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <span className="material-symbols-outlined text-lg">location_on</span>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-muted font-semibold">
                        Ubicadas
                      </p>
                      <p className="text-2xl font-bold text-slate-100">{stores.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Listado - 1/3 del ancho */}
            <div className="flex flex-col gap-4 min-h-0">
              <div className="bg-neutral-dark/40 border border-neutral-border/30 rounded-xl p-6 overflow-y-auto flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-100">Tus Tiendas</h2>
                  <span className="text-sm font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {stores.length}
                  </span>
                </div>

                {stores.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-5xl text-neutral-muted/30">
                      location_on
                    </span>
                    <p className="text-neutral-muted mt-2">No hay tiendas aún</p>
                    <p className="text-xs text-neutral-muted mt-1">
                      Haz clic en el mapa para crear una
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stores.map((store) => (
                      <div
                        key={store.id}
                        className="bg-neutral-accent/30 border border-neutral-border/30 rounded-lg p-3 hover:border-primary/50 transition-all group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-sm font-bold text-slate-100 truncate">
                              {store.nombre}
                            </h3>
                            <p className="text-xs text-neutral-muted truncate">
                              {store.ciudad}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              store.estado === 'activa'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {store.estado === 'activa' ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>

                        <div className="text-xs text-neutral-muted mb-2 space-y-0.5">
                          <p>📍 {parseFloat(store.latitud).toFixed(4)}, {parseFloat(store.longitud).toFixed(4)}</p>
                          {store.telefono && <p>📞 {store.telefono}</p>}
                        </div>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setTempMarker({
                                lat: parseFloat(store.latitud),
                                lng: parseFloat(store.longitud),
                              });
                              // Aquí podrías abrir un modal de edición
                            }}
                            className="flex-1 text-xs bg-primary/20 text-primary hover:bg-primary/30 px-2 py-1 rounded transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteStore(store.id)}
                            className="flex-1 text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 px-2 py-1 rounded transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón para crear */}
              {!showForm && (
                <button
                  onClick={() => {
                    setTempMarker(null);
                    setShowForm(true);
                  }}
                  className="w-full bg-primary text-background-dark font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">add_box</span>
                  Nueva Tienda
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de formulario */}
      <StoreFormModal
        isOpen={showForm}
        tempMarker={tempMarker}
        onSubmit={handleCreateStore}
        onClose={handleRemoveMarker}
      />
    </div>
  );
}
