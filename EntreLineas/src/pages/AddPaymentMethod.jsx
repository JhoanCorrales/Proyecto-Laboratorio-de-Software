import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { addCard } from "../services/walletService";

export default function AddPaymentMethod() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    titular: "",
    numeroTarjeta: "",
    fechaExpiracion: "",
    tipoTarjeta: "VISA",
    esPrincipal: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error al cambiar el campo
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const formatCardNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    // Add spaces every 4 digits
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData((prev) => ({
      ...prev,
      numeroTarjeta: formatted,
    }));
    if (errors.numeroTarjeta) {
      setErrors((prev) => ({
        ...prev,
        numeroTarjeta: "",
      }));
    }
  };

  const formatExpiryDate = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    // Add slash after 2 digits
    if (digits.length >= 2) {
      return digits.slice(0, 2) + "/" + digits.slice(2, 4);
    }
    return digits;
  };

  const handleExpiryDateChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    setFormData((prev) => ({
      ...prev,
      fechaExpiracion: formatted,
    }));
    if (errors.fechaExpiracion) {
      setErrors((prev) => ({
        ...prev,
        fechaExpiracion: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};

    // Validar titular
    if (!formData.titular.trim()) {
      newErrors.titular = "El nombre del titular es requerido";
    } else if (formData.titular.trim().length < 3) {
      newErrors.titular = "El nombre debe tener al menos 3 caracteres";
    }

    // Validar número de tarjeta
    const numeroTarjetaLimpio = formData.numeroTarjeta.replace(/\s/g, "");
    if (!numeroTarjetaLimpio) {
      newErrors.numeroTarjeta = "El número de tarjeta es requerido";
    } else if (!/^\d{13,19}$/.test(numeroTarjetaLimpio)) {
      newErrors.numeroTarjeta = "Número de tarjeta inválido (13-19 dígitos)";
    }

    // Validar fecha de vencimiento
    if (!formData.fechaExpiracion) {
      newErrors.fechaExpiracion = "La fecha de vencimiento es requerida";
    } else if (!/^\d{2}\/\d{2}$/.test(formData.fechaExpiracion)) {
      newErrors.fechaExpiracion = "Formato debe ser MM/YY";
    } else {
      const [mes, anio] = formData.fechaExpiracion.split("/");
      const mesNum = parseInt(mes, 10);
      if (mesNum < 1 || mesNum > 12) {
        newErrors.fechaExpiracion = "Mes inválido (01-12)";
      } else {
        // Verificar que no esté expirada
        const ahora = new Date();
        const anioCompleto = 2000 + parseInt(anio, 10);
        const fechaExp = new Date(anioCompleto, mesNum - 1, 1);
        if (fechaExp < ahora) {
          newErrors.fechaExpiracion = "La tarjeta está expirada";
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setServerError("");
      await addCard({
        numeroTarjeta: numeroTarjetaLimpio,
        titular: formData.titular.trim(),
        fechaExpiracion: formData.fechaExpiracion,
        tipoTarjeta: formData.tipoTarjeta,
        esPrincipal: formData.esPrincipal,
      });
      // Redirigir al wallet después de agregar la tarjeta
      navigate("/wallet");
    } catch (err) {
      setServerError(err.message || "Error al guardar la tarjeta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark min-h-screen bg-background-dark text-slate-100">
      <Navbar />
      
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl bg-neutral-dark rounded-xl shadow-2xl border border-white/5 overflow-hidden">
          <div className="p-8">
            <div className="mb-8">
              <h1 className="text-2xl font-black text-slate-100 tracking-tight">
                Agregar tarjeta de crédito
              </h1>
              <p className="text-slate-400 mt-1">
                Registra un nuevo método de pago para tu suscripción
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {serverError && (
                <div className="p-4 bg-red-900/30 text-red-400 rounded-lg border border-red-600/30">
                  {serverError}
                </div>
              )}

              {/* Titular */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-200">
                  Nombre del titular
                </label>
                <input
                  type="text"
                  name="titular"
                  value={formData.titular}
                  onChange={handleInputChange}
                  placeholder="Nombre completo como aparece en la tarjeta"
                  className={`form-input w-full rounded-lg bg-neutral-accent border-2 transition-colors focus:ring-0 text-slate-100 h-12 px-4 placeholder:text-slate-500 ${
                    errors.titular
                      ? "border-red-500 focus:border-red-500"
                      : "border-transparent focus:border-primary"
                  }`}
                />
                {errors.titular && (
                  <p className="text-xs text-red-400">{errors.titular}</p>
                )}
              </div>

              {/* Numero Tarjeta */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-200">
                  Número de tarjeta
                </label>
                <input
                  type="text"
                  name="numeroTarjeta"
                  value={formData.numeroTarjeta}
                  onChange={handleCardNumberChange}
                  placeholder="XXXX XXXX XXXX XXXX"
                  maxLength="23"
                  className={`form-input w-full rounded-lg bg-neutral-accent border-2 transition-colors focus:ring-0 text-slate-100 h-12 px-4 placeholder:text-slate-500 tracking-[0.2em] ${
                    errors.numeroTarjeta
                      ? "border-red-500 focus:border-red-500"
                      : "border-transparent focus:border-primary"
                  }`}
                />
                {errors.numeroTarjeta && (
                  <p className="text-xs text-red-400">{errors.numeroTarjeta}</p>
                )}
              </div>

              {/* Row: Vencimiento y Tipo de Tarjeta */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-200">
                    Fecha de vencimiento
                  </label>
                  <input
                    type="text"
                    name="fechaExpiracion"
                    value={formData.fechaExpiracion}
                    onChange={handleExpiryDateChange}
                    placeholder="MM/YY"
                    maxLength="5"
                    className={`form-input w-full rounded-lg bg-neutral-accent border-2 transition-colors focus:ring-0 text-slate-100 h-12 px-4 placeholder:text-slate-500 ${
                      errors.fechaExpiracion
                        ? "border-red-500 focus:border-red-500"
                        : "border-transparent focus:border-primary"
                    }`}
                  />
                  {errors.fechaExpiracion && (
                    <p className="text-xs text-red-400">{errors.fechaExpiracion}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-200">
                    Tipo de tarjeta
                  </label>
                  <select
                    name="tipoTarjeta"
                    value={formData.tipoTarjeta}
                    onChange={handleInputChange}
                    className="form-input w-full rounded-lg bg-neutral-accent border-2 border-transparent transition-colors focus:border-primary focus:ring-0 text-slate-100 h-12 px-4"
                  >
                    <option value="VISA">VISA</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="American Express">American Express</option>
                    <option value="Diners Club">Diners Club</option>
                  </select>
                </div>
              </div>

              {/* Bandera: Principal o Secundaria */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-200">
                  Categoría de tarjeta
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="esPrincipal"
                      value="true"
                      checked={formData.esPrincipal === true}
                      onChange={() => setFormData((prev) => ({ ...prev, esPrincipal: true }))}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm text-slate-200">Tarjeta Principal</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="esPrincipal"
                      value="false"
                      checked={formData.esPrincipal === false}
                      onChange={() => setFormData((prev) => ({ ...prev, esPrincipal: false }))}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm text-slate-200">Tarjeta Secundaria</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-background-dark font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-background-dark border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar tarjeta"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/wallet")}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-slate-200 font-semibold py-3 px-6 rounded-lg transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
