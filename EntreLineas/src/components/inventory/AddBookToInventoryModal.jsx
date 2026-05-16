import { useState, useEffect } from 'react';

export default function AddBookToInventoryModal({ isOpen, onClose, storeId, onBookAdded }) {
  const [formData, setFormData] = useState({
    titulo: '',
    autor: '',
    año: new Date().getFullYear().toString(),
    genero: '',
    paginas: '',
    editorial: '',
    isbn: '',
    idioma: 'es',
    fechaPublicacion: '',
    estado: 'nuevo',
    precio: '',
  });

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const generos = [
    { value: 'ficcion', label: 'Ficción' },
    { value: 'no-ficcion', label: 'No Ficción' },
    { value: 'fantasia', label: 'Fantasía' },
    { value: 'terror', label: 'Terror' },
    { value: 'biografia', label: 'Biografía' },
    { value: 'ciencia', label: 'Ciencia' },
    { value: 'infantil', label: 'Infantil' },
    { value: 'autoayuda', label: 'Autoayuda' },
    { value: 'historia', label: 'Historia' },
  ];

  const idiomas = [
    { value: 'es', label: 'Español' },
    { value: 'en', label: 'Inglés' },
    { value: 'fr', label: 'Francés' },
    { value: 'de', label: 'Alemán' },
    { value: 'it', label: 'Italiano' },
    { value: 'pt', label: 'Portugués' },
  ];

  // Helper para renderizar ícono de validación
  const renderFieldIcon = (fieldName) => {
    if (!touched[fieldName]) return null;
    if (errors[fieldName]) {
      return (
        <span className="material-symbols-outlined text-red-400 text-lg">error</span>
      );
    }
    return (
      <span className="material-symbols-outlined text-green-400 text-lg">check_circle</span>
    );
  };

  // Helper para obtener clases del input basado en validación
  const getInputClass = (fieldName) => {
    const baseClass = 'w-full bg-neutral-accent/50 border rounded-lg px-4 py-2 text-slate-100 placeholder:text-slate-500 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all';
    const errorClass = touched[fieldName] && errors[fieldName] ? 'border-red-500' : 'border-neutral-border';
    const successClass = touched[fieldName] && !errors[fieldName] ? 'border-green-500' : '';
    return `${baseClass} ${errorClass} ${successClass}`;
  };

  // Validación de campos
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'titulo':
        if (!value.trim()) {
          newErrors.titulo = 'El título es obligatorio';
        } else if (value.trim().length < 3) {
          newErrors.titulo = 'El título debe tener al menos 3 caracteres';
        } else {
          delete newErrors.titulo;
        }
        break;

      case 'autor':
        if (!value.trim()) {
          newErrors.autor = 'El autor es obligatorio';
        } else if (value.trim().length < 3) {
          newErrors.autor = 'El nombre del autor debe tener al menos 3 caracteres';
        } else {
          delete newErrors.autor;
        }
        break;

      case 'año':
        if (!value) {
          newErrors.año = 'El año es obligatorio';
        } else if (!/^\d{4}$/.test(value)) {
          newErrors.año = 'El año debe ser válido (YYYY)';
        } else if (parseInt(value) < 1000 || parseInt(value) > new Date().getFullYear()) {
          newErrors.año = `El año debe estar entre 1000 y ${new Date().getFullYear()}`;
        } else {
          delete newErrors.año;
        }
        break;

      case 'genero':
        if (!value) {
          newErrors.genero = 'Selecciona un género';
        } else {
          delete newErrors.genero;
        }
        break;

      case 'paginas':
        if (!value) {
          newErrors.paginas = 'Las páginas son obligatorias';
        } else if (parseInt(value) < 1) {
          newErrors.paginas = 'El número de páginas debe ser mayor a 0';
        } else {
          delete newErrors.paginas;
        }
        break;

      case 'editorial':
        if (!value.trim()) {
          newErrors.editorial = 'La editorial es obligatoria';
        } else if (value.trim().length < 2) {
          newErrors.editorial = 'La editorial debe tener al menos 2 caracteres';
        } else {
          delete newErrors.editorial;
        }
        break;

      case 'isbn':
        if (!value.trim()) {
          newErrors.isbn = 'ISSN / ISBN es obligatorio';
        } else if (!/^[0-9\-]{7,}$/.test(value)) {
          newErrors.isbn = 'ISSN / ISBN no es válido';
        } else {
          delete newErrors.isbn;
        }
        break;

      case 'fechaPublicacion':
        if (!value) {
          newErrors.fechaPublicacion = 'La fecha de publicación es obligatoria';
        } else {
          delete newErrors.fechaPublicacion;
        }
        break;

      case 'precio':
        if (!value) {
          newErrors.precio = 'El precio es obligatorio';
        } else if (parseFloat(value) < 0) {
          newErrors.precio = 'El precio no puede ser negativo';
        } else {
          delete newErrors.precio;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleRadioChange = (value) => {
    setFormData(prev => ({ ...prev, estado: value }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.titulo.trim()) newErrors.titulo = 'El título es obligatorio';
    if (!formData.autor.trim()) newErrors.autor = 'El autor es obligatorio';
    if (!formData.año) newErrors.año = 'El año es obligatorio';
    if (!formData.genero) newErrors.genero = 'Selecciona un género';
    if (!formData.paginas) newErrors.paginas = 'Las páginas son obligatorias';
    if (!formData.editorial.trim()) newErrors.editorial = 'La editorial es obligatoria';
    if (!formData.isbn.trim()) newErrors.isbn = 'ISSN / ISBN es obligatorio';
    if (!formData.fechaPublicacion) newErrors.fechaPublicacion = 'La fecha de publicación es obligatoria';
    if (!formData.precio) newErrors.precio = 'El precio es obligatorio';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccess('');

    try {
      // TODO: Conectar con API real
      // const response = await addBookToInventory(storeId, formData);
      
      // Por ahora, simulamos la creación
      console.log('Libro agregado al inventario:', formData);

      setSuccess('¡Libro agregado exitosamente al inventario!');
      
      setTimeout(() => {
        // Notificar al componente padre
        if (onBookAdded) {
          onBookAdded(formData);
        }
        
        // Resetear formulario
        setFormData({
          titulo: '',
          autor: '',
          año: new Date().getFullYear().toString(),
          genero: '',
          paginas: '',
          editorial: '',
          isbn: '',
          idioma: 'es',
          fechaPublicacion: '',
          estado: 'nuevo',
          precio: '',
        });
        setTouched({});
        setErrors({});
        setSuccess('');
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error al agregar libro:', error);
      setErrors({ submit: 'Error al agregar el libro. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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

          {success && (
            <div className="p-3 bg-green-900/30 border border-green-600/50 text-green-400 rounded-lg flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              {success}
            </div>
          )}
          {errors.submit && (
            <div className="p-3 bg-red-900/30 border border-red-600/50 text-red-400 rounded-lg flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-sm">error</span>
              {errors.submit}
            </div>
          )}

          {/* Sección: Información del libro */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">info</span>
              Información del Libro
            </h3>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-100">
                  Título del Libro <span className="text-red-400">*</span>
                </label>
                {renderFieldIcon('titulo')}
              </div>
              <input
                type="text"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Ej: Cien años de soledad"
                className={getInputClass('titulo')}
              />
              {errors.titulo && touched.titulo && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {errors.titulo}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-100">
                  Autor <span className="text-red-400">*</span>
                </label>
                {renderFieldIcon('autor')}
              </div>
              <input
                type="text"
                name="autor"
                value={formData.autor}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nombre completo del autor"
                className={getInputClass('autor')}
              />
              {errors.autor && touched.autor && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {errors.autor}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-100">
                    Año <span className="text-red-400">*</span>
                  </label>
                  {renderFieldIcon('año')}
                </div>
                <input
                  type="number"
                  name="año"
                  value={formData.año}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="YYYY"
                  className={getInputClass('año')}
                />
                {errors.año && touched.año && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    {errors.año}
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-100">
                    Género <span className="text-red-400">*</span>
                  </label>
                  {renderFieldIcon('genero')}
                </div>
                <select
                  name="genero"
                  value={formData.genero}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${getInputClass('genero')} appearance-none`}
                >
                  <option value="">Seleccionar</option>
                  {generos.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
                {errors.genero && touched.genero && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    {errors.genero}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-100">
                    Páginas <span className="text-red-400">*</span>
                  </label>
                  {renderFieldIcon('paginas')}
                </div>
                <input
                  type="number"
                  name="paginas"
                  value={formData.paginas}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="0"
                  className={getInputClass('paginas')}
                />
                {errors.paginas && touched.paginas && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    {errors.paginas}
                  </p>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-100">
                    Editorial <span className="text-red-400">*</span>
                  </label>
                  {renderFieldIcon('editorial')}
                </div>
                <input
                  type="text"
                  name="editorial"
                  value={formData.editorial}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Nombre de editorial"
                  className={getInputClass('editorial')}
                />
                {errors.editorial && touched.editorial && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    {errors.editorial}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sección: Detalles adicionales */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">library_books</span>
              Detalles Adicionales
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-100">
                    ISSN / ISBN <span className="text-red-400">*</span>
                  </label>
                  {renderFieldIcon('isbn')}
                </div>
                <input
                  type="text"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="0000-0000"
                  className={getInputClass('isbn')}
                />
                {errors.isbn && touched.isbn && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    {errors.isbn}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-100 mb-2">
                  Idioma
                </label>
                <select
                  name="idioma"
                  value={formData.idioma}
                  onChange={handleChange}
                  className="w-full bg-neutral-accent/50 border border-neutral-border rounded-lg px-4 py-2 text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all appearance-none"
                >
                  {idiomas.map(i => (
                    <option key={i.value} value={i.value}>{i.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-100">
                    Fecha de Publicación <span className="text-red-400">*</span>
                  </label>
                  {renderFieldIcon('fechaPublicacion')}
                </div>
                <input
                  type="date"
                  name="fechaPublicacion"
                  value={formData.fechaPublicacion}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={getInputClass('fechaPublicacion')}
                />
                {errors.fechaPublicacion && touched.fechaPublicacion && (
                  <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    {errors.fechaPublicacion}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-100 mb-2">
                  Estado
                </label>
                <div className="flex gap-2 p-1 border border-neutral-border rounded-lg bg-neutral-accent/50">
                  {['nuevo', 'usado'].map((val) => (
                    <label
                      key={val}
                      className="flex-1 flex items-center justify-center px-3 py-1.5 rounded-md cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <input
                        type="radio"
                        name="estado"
                        value={val}
                        checked={formData.estado === val}
                        onChange={() => handleRadioChange(val)}
                        className="hidden"
                      />
                      <span className={`text-sm ${formData.estado === val ? 'text-primary font-bold' : 'text-slate-300'}`}>
                        {val.charAt(0).toUpperCase() + val.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-100">
                  Precio (USD) <span className="text-red-400">*</span>
                </label>
                {renderFieldIcon('precio')}
              </div>
              <input
                type="number"
                name="precio"
                value={formData.precio}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="0.00"
                step="0.01"
                className={getInputClass('precio')}
              />
              {errors.precio && touched.precio && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {errors.precio}
                </p>
              )}
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
              disabled={loading}
              className={`flex-1 font-bold px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                !loading
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

          {Object.keys(errors).length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-xs text-red-300 flex items-start gap-2">
              <span className="material-symbols-outlined text-sm flex-shrink-0 mt-0.5">info</span>
              <span>Por favor, completa todos los campos requeridos correctamente para continuar</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
