import { useState, useEffect } from 'react';
import { booksService } from '../../services/booksService';

export default function EditBookModal({ isOpen, onClose, storeId, libroId, onBookUpdated }) {
  const [formData, setFormData] = useState({
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
    cantidadInicial: '',
    portada_url: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar datos
  useEffect(() => {
    if (!isOpen || !libroId) return;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const bookData = await booksService.getBookById(libroId);
        const inventoryData = await booksService.getStoreInventory(storeId);
        const itemInventory = inventoryData.find(i => i.libro_id === libroId);

        setFormData({
          titulo: bookData.titulo || '',
          autor: bookData.autor || '',
          año: bookData.año || '',
          genero: bookData.genero || '',
          paginas: bookData.paginas ? String(bookData.paginas) : '',
          editorial: bookData.editorial || '',
          isbn: bookData.isbn || '',
          idioma: bookData.idioma || '',
          fechaPublicacion: bookData.fecha_publicacion ? bookData.fecha_publicacion.split('T')[0] : '',
          precioUnitarioPesos: bookData.precio ? String(bookData.precio) : '',
          cantidadInicial: itemInventory ? String(itemInventory.stock) : '0',
          portada_url: bookData.portada_url || '',
        });
      } catch (err) {
        console.error("Error fetching book for edit", err);
        setError("Error cargando los detalles del libro");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, libroId, storeId]);

  // Cambiar campo
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  // Validar el formulario
  const validateForm = () => {
    if (!formData.titulo || !formData.autor) {
      setError('El título y el autor son obligatorios.');
      return false;
    }
    if (!formData.precioUnitarioPesos || parseFloat(formData.precioUnitarioPesos) <= 0) {
      setError('El precio debe ser mayor a 0');
      return false;
    }
    if (formData.cantidadInicial === '' || parseInt(formData.cantidadInicial) < 0) {
      setError('La cantidad no puede ser negativa');
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

    setSaving(true);
    setSuccess('');
    setError('');

    try {
      // 1. Actualizar el libro en la base de datos local
      await booksService.updateBook(libroId, {
        titulo: formData.titulo,
        autor: formData.autor,
        isbn: formData.isbn,
        editorial: formData.editorial,
        paginas: formData.paginas,
        idioma: formData.idioma,
        año: formData.año,
        genero: formData.genero,
        precio: parseFloat(formData.precioUnitarioPesos),
        portada_url: formData.portada_url,
      });

      // 2. Actualizar el inventario
      const inventoryData = {
        cantidadInicial: formData.cantidadInicial
      };
      await booksService.updateBookInventory(storeId, libroId, inventoryData);

      setSuccess(`¡Libro actualizado correctamente!`);

      setTimeout(() => {
        if (onBookUpdated) {
          onBookUpdated();
        }
        onClose();
        setSuccess('');
      }, 1500);
    } catch (err) {
      console.error('Error al editar libro:', err);
      setError(err.message || 'Error al actualizar el libro. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background-dark/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-dark border border-neutral-border/50 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-neutral-border/30 px-6 py-4 flex items-center justify-between bg-neutral-dark">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">edit_square</span>
            <h2 className="text-lg font-bold text-slate-100">Editar Libro</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-neutral-accent rounded-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-neutral-muted">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-4">hourglass_empty</span>
              <p className="text-neutral-muted">Cargando información del libro...</p>
            </div>
          ) : (
            <div className="space-y-6">
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

              {/* Información Básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-100 mb-2">
                    Título <span className="text-red-400">*</span>
                  </label>
                  <input type="text" name="titulo" value={formData.titulo} onChange={handleChange} className="w-full bg-neutral-accent/50 border border-neutral-border rounded-lg px-4 py-2 text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-100 mb-2">
                    Autor <span className="text-red-400">*</span>
                  </label>
                  <input type="text" name="autor" value={formData.autor} onChange={handleChange} className="w-full bg-neutral-accent/50 border border-neutral-border rounded-lg px-4 py-2 text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-100 mb-2">
                    Editorial
                  </label>
                  <input type="text" name="editorial" value={formData.editorial} onChange={handleChange} className="w-full bg-neutral-accent/50 border border-neutral-border rounded-lg px-4 py-2 text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-100 mb-2">
                    Género / Categoría
                  </label>
                  <input type="text" name="genero" value={formData.genero} onChange={handleChange} className="w-full bg-neutral-accent/50 border border-neutral-border rounded-lg px-4 py-2 text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-100 mb-2">
                    ISBN
                  </label>
                  <input type="text" name="isbn" value={formData.isbn} onChange={handleChange} className="w-full bg-neutral-accent/50 border border-neutral-border rounded-lg px-4 py-2 text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-100 mb-2">
                    Año Publicación
                  </label>
                  <input type="text" name="año" value={formData.año} onChange={handleChange} className="w-full bg-neutral-accent/50 border border-neutral-border rounded-lg px-4 py-2 text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all" placeholder="Ej: 1997"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-100 mb-2">
                    Páginas
                  </label>
                  <input type="number" name="paginas" value={formData.paginas} onChange={handleChange} className="w-full bg-neutral-accent/50 border border-neutral-border rounded-lg px-4 py-2 text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"/>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-100 mb-2">
                    Idioma
                  </label>
                  <input type="text" name="idioma" value={formData.idioma} onChange={handleChange} className="w-full bg-neutral-accent/50 border border-neutral-border rounded-lg px-4 py-2 text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-100 mb-2">
                    URL de Portada
                  </label>
                  <input type="text" name="portada_url" value={formData.portada_url} onChange={handleChange} className="w-full bg-neutral-accent/50 border border-neutral-border rounded-lg px-4 py-2 text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all" placeholder="https://..."/>
                </div>
              </div>

              {/* Sección de Inventario */}
              <div className="pt-6 border-t border-neutral-border/30">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary text-lg">inventory_2</span>
                  Detalles de Inventario y Precio
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-100 mb-2">
                      Stock / Cantidad Disponible <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      name="cantidadInicial"
                      value={formData.cantidadInicial}
                      onChange={handleChange}
                      min="0"
                      className="w-full bg-neutral-accent/50 border border-neutral-border rounded-lg px-4 py-2 text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                  </div>
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
                      />
                    </div>
                  </div>
                </div>
              </div>

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
                  disabled={saving}
                  className={`flex-1 font-bold px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    !saving
                      ? 'bg-primary text-background-dark hover:bg-primary/90 cursor-pointer'
                      : 'bg-neutral-accent text-neutral-muted cursor-not-allowed opacity-50'
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {saving ? 'hourglass_empty' : 'save'}
                  </span>
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
