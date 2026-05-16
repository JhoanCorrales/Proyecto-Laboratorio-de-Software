import { useState, useEffect } from 'react';

// Regex patterns para validaciones
const PHONE_REGEX = /^[0-9]{10}$/;
const EMAIL_REGEX = /^[a-zA-Z][a-zA-Z0-9_.]*@[a-zA-Z][a-zA-Z0-9]+\.[a-zA-Z]{2,3}(\.[a-zA-Z]{2})?$/;
const POSTAL_CODE_REGEX = /^[0-9]{6}$/;

export default function StoreFormModal({ isOpen, tempMarker, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    ciudad: 'Pereira',
    departamento: 'Risaralda',
    codigo_postal: '',
    telefono: '',
    email: '',
    horario_atencion: '',
    latitud: 0,
    longitud: 0,
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (tempMarker) {
      setFormData((prev) => ({
        ...prev,
        latitud: tempMarker.lat,
        longitud: tempMarker.lng,
      }));
    }
  }, [tempMarker]);

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'nombre':
        if (!value.trim()) {
          error = 'El nombre de la tienda es requerido';
        } else if (value.trim().length < 3) {
          error = 'El nombre debe tener al menos 3 caracteres';
        }
        break;

      case 'direccion':
        if (!value.trim()) {
          error = 'La dirección es requerida';
        } else if (value.trim().length < 5) {
          error = 'La dirección debe tener al menos 5 caracteres';
        }
        break;

      case 'email':
        if (!value.trim()) {
          error = 'El email es requerido';
        } else if (!EMAIL_REGEX.test(value)) {
          error = 'El email debe ser válido (ej: tienda@entrelineas.com)';
        }
        break;

      case 'telefono':
        if (!value.trim()) {
          error = 'El teléfono es requerido';
        } else if (!PHONE_REGEX.test(value.replace(/\D/g, ''))) {
          error = 'El teléfono debe tener 10 dígitos (ej: 6015551234)';
        }
        break;

      case 'codigo_postal':
        if (value && !POSTAL_CODE_REGEX.test(value)) {
          error = 'El código postal debe tener 6 dígitos';
        }
        break;

      default:
        break;
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validar en tiempo real después de que el campo haya sido tocado
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => {
        if (error) {
          return { ...prev, [name]: error };
        } else {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        }
      });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    const error = validateField(name, value);
    setErrors((prev) => {
      if (error) {
        return { ...prev, [name]: error };
      } else {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      }
    });
  };

  const validateForm = () => {
    const newErrors = {};
    const fieldsToValidate = ['nombre', 'direccion', 'email', 'telefono'];

    fieldsToValidate.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    // Validar código postal solo si tiene contenido
    if (formData.codigo_postal) {
      const error = validateField('codigo_postal', formData.codigo_postal);
      if (error) {
        newErrors.codigo_postal = error;
      }
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    // Marcar todos los campos como tocados
    setTouched({
      nombre: true,
      direccion: true,
      email: true,
      telefono: true,
      codigo_postal: true,
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
    setFormData({
      nombre: '',
      direccion: '',
      ciudad: 'Pereira',
      departamento: 'Risaralda',
      codigo_postal: '',
      telefono: '',
      email: '',
      horario_atencion: '',
      latitud: 0,
      longitud: 0,
    });
    setErrors({});
    setTouched({});
  };

  if (!isOpen) return null;

  // Verificar si el formulario es válido
  const isFormValid = Object.keys(validateForm()).length === 0 && 
    formData.nombre.trim() && 
    formData.direccion.trim() && 
    formData.email.trim() && 
    formData.telefono.trim();

  const getFieldError = (fieldName) => errors[fieldName];

  const getFieldStatus = (fieldName) => {
    if (touched[fieldName] || errors[fieldName]) {
      return errors[fieldName] ? 'error' : 'success';
    }
    return 'idle';
  };

  const renderFieldIcon = (fieldName) => {
    const status = getFieldStatus(fieldName);
    if (status === 'success') {
      return <span className="material-symbols-outlined text-green-400 text-lg">check_circle</span>;
    } else if (status === 'error') {
      return <span className="material-symbols-outlined text-red-400 text-lg">error</span>;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-dark border border-neutral-border/50 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-neutral-dark/95 border-b border-neutral-border/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-2xl">
              location_on
            </span>
            <h2 className="text-lg font-bold text-slate-100">Nueva Tienda en Pereira</h2>
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
          {/* Coordenadas del mapa */}
          <div className="bg-neutral-accent/30 border border-neutral-border/30 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-muted font-semibold mb-2">
                  Latitud
                </label>
                <div className="bg-neutral-accent/50 border border-neutral-border rounded-lg px-4 py-2 text-slate-100 font-mono text-sm">
                  {tempMarker?.lat.toFixed(6) || '0.000000'}
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-neutral-muted font-semibold mb-2">
                  Longitud
                </label>
                <div className="bg-neutral-accent/50 border border-neutral-border rounded-lg px-4 py-2 text-slate-100 font-mono text-sm">
                  {tempMarker?.lng.toFixed(6) || '0.000000'}
                </div>
              </div>
            </div>
            <p className="text-xs text-neutral-muted mt-2">
              📍 Coordenadas obtenidas del mapa - Arrastra el marcador para ajustar
            </p>
          </div>

          {/* Información de la tienda */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">info</span>
              Información de la Tienda
            </h3>

            {/* Nombre */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-100">
                  Nombre de la Tienda <span className="text-red-400">*</span>
                </label>
                {renderFieldIcon('nombre')}
              </div>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full bg-neutral-accent/50 border rounded-lg px-4 py-2 text-slate-100 placeholder:text-neutral-muted/70 outline-none focus:ring-2 transition-all ${
                  getFieldStatus('nombre') === 'error'
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                    : getFieldStatus('nombre') === 'success'
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500/30'
                    : 'border-neutral-border focus:border-primary focus:ring-primary/30'
                }`}
                placeholder="Ej: Tienda Centro Pereira"
              />
              {errors.nombre && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {errors.nombre}
                </p>
              )}
            </div>

            {/* Dirección */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-100">
                  Dirección <span className="text-red-400">*</span>
                </label>
                {renderFieldIcon('direccion')}
              </div>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full bg-neutral-accent/50 border rounded-lg px-4 py-2 text-slate-100 placeholder:text-neutral-muted/70 outline-none focus:ring-2 transition-all ${
                  getFieldStatus('direccion') === 'error'
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                    : getFieldStatus('direccion') === 'success'
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500/30'
                    : 'border-neutral-border focus:border-primary focus:ring-primary/30'
                }`}
                placeholder="Ej: Calle 19 #10-30"
              />
              {errors.direccion && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {errors.direccion}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-100 mb-2">
                  Ciudad
                </label>
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
                  className="w-full bg-neutral-accent/50 border border-neutral-border rounded-lg px-4 py-2 text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-100 mb-2">
                  Departamento
                </label>
                <input
                  type="text"
                  name="departamento"
                  value={formData.departamento}
                  className="w-full bg-neutral-accent/50 border border-neutral-border rounded-lg px-4 py-2 text-slate-100 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
                  disabled
                />
              </div>
            </div>

            {/* Código Postal */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-100">
                  Código Postal
                </label>
                {renderFieldIcon('codigo_postal')}
              </div>
              <input
                type="text"
                name="codigo_postal"
                value={formData.codigo_postal}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full bg-neutral-accent/50 border rounded-lg px-4 py-2 text-slate-100 placeholder:text-neutral-muted/70 outline-none focus:ring-2 transition-all ${
                  getFieldStatus('codigo_postal') === 'error'
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                    : getFieldStatus('codigo_postal') === 'success'
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500/30'
                    : 'border-neutral-border focus:border-primary focus:ring-primary/30'
                }`}
                placeholder="Ej: 660000"
              />
              {errors.codigo_postal && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {errors.codigo_postal}
                </p>
              )}
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">phone</span>
              Información de Contacto
            </h3>

            {/* Teléfono */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-100">
                  Teléfono <span className="text-red-400">*</span>
                </label>
                {renderFieldIcon('telefono')}
              </div>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full bg-neutral-accent/50 border rounded-lg px-4 py-2 text-slate-100 placeholder:text-neutral-muted/70 outline-none focus:ring-2 transition-all ${
                  getFieldStatus('telefono') === 'error'
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                    : getFieldStatus('telefono') === 'success'
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500/30'
                    : 'border-neutral-border focus:border-primary focus:ring-primary/30'
                }`}
                placeholder="Ej: 6015551234"
                maxLength="10"
              />
              {errors.telefono && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {errors.telefono}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-100">
                  Email <span className="text-red-400">*</span>
                </label>
                {renderFieldIcon('email')}
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full bg-neutral-accent/50 border rounded-lg px-4 py-2 text-slate-100 placeholder:text-neutral-muted/70 outline-none focus:ring-2 transition-all ${
                  getFieldStatus('email') === 'error'
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                    : getFieldStatus('email') === 'success'
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-500/30'
                    : 'border-neutral-border focus:border-primary focus:ring-primary/30'
                }`}
                placeholder="Ej: tienda@entrelineas.com"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Horario */}
            <div>
              <label className="block text-sm font-semibold text-slate-100 mb-2">
                Horario de Atención
              </label>
              <input
                type="text"
                name="horario_atencion"
                value={formData.horario_atencion}
                onChange={handleChange}
                className="w-full bg-neutral-accent/50 border border-neutral-border rounded-lg px-4 py-2 text-slate-100 placeholder:text-neutral-muted/70 outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
                placeholder="Ej: Lunes - Domingo: 9:00 AM - 9:00 PM"
              />
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
              disabled={!isFormValid}
              className={`flex-1 font-bold px-6 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                isFormValid
                  ? 'bg-primary text-background-dark hover:bg-primary/90 cursor-pointer'
                  : 'bg-neutral-accent text-neutral-muted cursor-not-allowed opacity-50'
              }`}
            >
              <span className="material-symbols-outlined">add</span>
              Crear Tienda
            </button>
          </div>

          {/* Helper text */}
          {!isFormValid && Object.keys(errors).length > 0 && (
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
