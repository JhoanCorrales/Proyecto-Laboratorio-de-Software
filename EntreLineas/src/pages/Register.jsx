'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from "../components/Input"
import Select from "../components/Select"
import { Label } from "../components/ui/label"
import { motion } from 'motion/react';
import { departamentos, getCiudades, getCodigoPostal } from '../assets/data/Colombiadata';
import { getCurrentUser } from '../services/authService';

export default function Register() {
  const navigate = useNavigate();
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Si el usuario ya está autenticado, redirigir a home
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      navigate("/home");
    }
  }, [navigate]);
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    direccion: '',
    ciudad: '',
    departamento: '',
    codigo_postal: '',
    fecha_nacimiento: '',
    lugar_nacimiento: '',
    genero: '',
    tema_literario: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    if (formData.departamento) {
      // Si cambia el departamento, limpia ciudad y código postal
      setFormData(prev => ({
        ...prev,
        ciudad: '',
        codigo_postal: '',
      }));
    }
  }, [formData.departamento]);

  useEffect(() => {
    if (formData.departamento && formData.ciudad) {
      const cp = getCodigoPostal(formData.departamento, formData.ciudad);
      setFormData(prev => ({ ...prev, codigo_postal: cp }));
    }
  }, [formData.ciudad]);

  const validateForm = () => {
    // Expresión regular para validar correo electrónico
    const emailRegex = /^[a-zA-Z][a-zA-Z0-9_.]*@[a-zA-Z][a-zA-Z0-9]+\.[a-zA-Z]{2,3}(\.[a-zA-Z]{2})?$/;

    // Validar que ningún campo esté vacío
    const campos = {
      nombre: 'nombre',
      apellidos: 'apellidos',
      email: 'correo electrónico',
      password: 'contraseña',
      confirmPassword: 'confirmación de contraseña',
      telefono: 'teléfono',
      ciudad: 'ciudad',
      direccion: 'dirección',
      departamento: 'departamento',
      codigo_postal: 'código postal'
    };

    for (const [key, label] of Object.entries(campos)) {
      if (!formData[key] || !formData[key].trim()) {
        setError(`El campo ${label} es obligatorio`);
        return false;
      }
    }

    // Validar formato del email con regex
    if (!emailRegex.test(formData.email.trim())) {
      setError('El correo electrónico no tiene un formato válido. Ej: usuario@ejemplo.com');
      return false;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    if (!isChecked) {
      setError('Debes aceptar el tratamiento de datos');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:4003/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          apellidos: formData.apellidos,
          email: formData.email,
          password: formData.password,
          telefono: formData.telefono,
          direccion: formData.direccion,
          ciudad: formData.ciudad,
          departamento: formData.departamento,
          codigo_postal: formData.codigo_postal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error en el registro');
        setLoading(false);
        return;
      }

      // Guardar el token en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      setSuccess('¡Registro exitoso! Redirigiendo...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">

      {/* Background Image */}
      <div
        className="fixed inset-0 z-0 bg-center bg-cover bg-no-repeat opacity-40"
        style={{
          backgroundImage:
            'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA08qmVusJV3vHNSzWiklfnXIGs8YrVV5dpis2ntdCCRMYkFboPcL14pAQLhRS_SPpIHiNBPQQq2wW7qC-uT6AZKoIITiSJnAhOrQyGz-CuFkKqKSLWMzyFXH24gNtVkYiETXH6iqihsRnZmmECj4mMPce0nTMhY65R_dxTWakExUk5dw0glmrWCkVzQRcqAOTJ6MYEOEN4LecgpAjlkejPVlptlaHhxyBFpXyVPl9lIPygbVOlOje6zYQqP8q7fkuOFi7D8HtP1_g")',
        }}
      />

      <div className="relative z-10 w-full max-w-[800px] bg-background-light dark:bg-[#192d33] shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-6 sm:p-10 border-b border-slate-200 dark:border-[#325a67] flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-4xl">
              menu_book
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Entre Líneas
          </h1>

          <p className="text-slate-600 dark:text-[#92bbc9] mt-2">
            Crea tu cuenta para acceder a nuestra biblioteca digital
          </p>
        </div>

        {/* Form Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Nombres */}
            <Input 
              label="Nombres" 
              placeholder="Sus nombres"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
            />

            {/* Apellidos */}
            <Input 
              label="Apellidos" 
              placeholder="Sus apellidos"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleInputChange}
            />

            {/* Email */}
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="ejemplo@correo.com"
              className="md:col-span-2"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />

            {/* Contraseña */}
            <Input
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              showPassword={showPassword}
              onToggleShowPassword={() => setShowPassword(!showPassword)}
              isLoading={loading}
              required
            />

            {/* Confirmar Contraseña */}
            <Input
              label="Confirmar Contraseña"
              type={showPassword ? "text" : "password"}
              placeholder="Repite tu contraseña"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              showPassword={showPassword}
              onToggleShowPassword={() => setShowPassword(!showPassword)}
              isLoading={loading}
              required
            />

            {/* Teléfono */}
            <Input 
              label="Teléfono" 
              placeholder="Tu número de teléfono"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
            />

            {/* Departamento - ahora es un Select */}
            <Select
              label="Departamento"
              name="departamento"
              value={formData.departamento}
              onChange={(value) => handleSelectChange('departamento', value)}
              options={departamentos.map(d => ({ value: d, label: d }))}
              placeholder="Selecciona tu departamento"
              required
            />

            {/* Ciudad - filtrada por departamento */}
            <Select
              label="Ciudad"
              name="ciudad"
              value={formData.ciudad}
              onChange={(value) => handleSelectChange('ciudad', value)}
              options={getCiudades(formData.departamento).map(c => ({ value: c, label: c }))}
              placeholder={formData.departamento ? "Selecciona tu ciudad" : "Primero selecciona un departamento"}
              disabled={!formData.departamento}
              required
            />

            {/* Dirección */}
            <Input
              label="Dirección de correspondencia"
              placeholder="Calle, número, ciudad y código postal"
              className="md:col-span-2"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
            />

            {/* Código Postal - se llena automático */}
            <Input 
              label="Código Postal" 
              placeholder="Se llena automáticamente"
              name="codigo_postal"
              value={formData.codigo_postal}
              onChange={handleInputChange}
              readOnly={!!formData.codigo_postal}
              className="md:col-span-2"
            />

            {/* Checkbox */}
            <div className="md:col-span-2 flex items-center gap-3 mt-2">
              <motion.input
                id="data-treatment"
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                animate={isChecked ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
                className="w-5 h-5 rounded border-slate-300 dark:border-[#325a67] text-primary cursor-pointer"
              />
              <motion.div
                animate={isChecked ? { x: [0, -5, 5, -5, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <Label htmlFor="data-treatment" direction="right" disableAnimation className="text-sm text-slate-700 dark:text-[#92bbc9] cursor-pointer">
                  Acepto el tratamiento de datos personales
                </Label>
              </motion.div>
            </div>

            {/* Botón */}
            <div className="md:col-span-2 mt-4">
              <button
                type="submit"
                disabled={loading || !isChecked}
                className={`w-full font-bold py-4 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 ${
                  isChecked && !loading
                    ? 'bg-primary hover:opacity-90 text-background-dark shadow-primary/20 cursor-pointer'
                    : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-50'
                }`}
              >
                <span>{loading ? 'Registrando...' : 'Registrarse'}</span>
                <span className="material-symbols-outlined">
                  {loading ? 'hourglass_bottom' : 'person_add'}
                </span>
              </button>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-[#111e22] border-t border-slate-200 dark:border-[#325a67] text-center">
          <p className="text-slate-600 dark:text-[#92bbc9] text-sm">
            ¿Ya tienes una cuenta?
            <a href="/" className="text-primary font-semibold hover:underline ml-1 cursor-pointer">
              Iniciar sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}