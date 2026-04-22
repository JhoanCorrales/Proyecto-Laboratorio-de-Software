import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function AddPaymentMethod() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    alias: "",
    isDefault: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
      cardNumber: formatted,
    }));
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
      expiryDate: formatted,
    }));
  };

  const handleCVVChange = (e) => {
    // Only allow digits and limit to 4 characters
    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
    setFormData((prev) => ({
      ...prev,
      cvv: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.cardholderName.trim()) {
      alert("Por favor ingresa el nombre del titular");
      return;
    }
    if (formData.cardNumber.replace(/\s/g, "").length !== 16) {
      alert("El número de tarjeta debe tener 16 dígitos");
      return;
    }
    if (formData.expiryDate.length !== 5) {
      alert("Por favor ingresa una fecha de vencimiento válida (MM/AA)");
      return;
    }
    if (formData.cvv.length < 3) {
      alert("Por favor ingresa un CVV válido");
      return;
    }
    if (!formData.alias.trim()) {
      alert("Por favor ingresa un alias para la tarjeta");
      return;
    }

    // Guardar en backend
    saveCard();
  };

  const saveCard = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes estar autenticado");
      navigate("/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:4003/api/payment/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          numeroTarjeta: formData.cardNumber,
          titular: formData.cardholderName,
          fechaExpiracion: formData.expiryDate,
          cvv: formData.cvv,
          alias: formData.alias,
          esDefault: formData.isDefault,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Error al guardar la tarjeta");
        return;
      }

      alert("¡Tarjeta guardada correctamente!");
      navigate("/wallet");
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión con el servidor");
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
              {/* Titular */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-200">
                  Nombre del titular
                </label>
                <input
                  type="text"
                  name="cardholderName"
                  value={formData.cardholderName}
                  onChange={handleInputChange}
                  placeholder="Nombre completo como aparece en la tarjeta"
                  className="form-input w-full rounded-lg bg-neutral-accent border-transparent focus:border-primary focus:ring-1 focus:ring-primary text-slate-100 h-12 px-4 placeholder:text-slate-500"
                />
              </div>

              {/* Numero Tarjeta */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-200">
                  Número de tarjeta
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="XXXX XXXX XXXX XXXX"
                  maxLength="19"
                  className="form-input w-full rounded-lg bg-neutral-accent border-transparent focus:border-primary focus:ring-1 focus:ring-primary text-slate-100 h-12 px-4 placeholder:text-slate-500 tracking-[0.2em]"
                />
              </div>

              {/* Row: Vencimiento y CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-200">
                    Fecha de vencimiento
                  </label>
                  <input
                    type="text"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleExpiryDateChange}
                    placeholder="MM/AA"
                    maxLength="5"
                    className="form-input w-full rounded-lg bg-neutral-accent border-transparent focus:border-primary focus:ring-1 focus:ring-primary text-slate-100 h-12 px-4 placeholder:text-slate-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-200">
                    Código de seguridad (CVV)
                  </label>
                  <input
                    type="password"
                    name="cvv"
                    value={formData.cvv}
                    onChange={handleCVVChange}
                    placeholder="123"
                    maxLength="4"
                    className="form-input w-full rounded-lg bg-neutral-accent border-transparent focus:border-primary focus:ring-1 focus:ring-primary text-slate-100 h-12 px-4 placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Alias */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-200">
                  Alias o nombre identificador
                </label>
                <input
                  type="text"
                  name="alias"
                  value={formData.alias}
                  onChange={handleInputChange}
                  placeholder="ej. Tarjeta personal"
                  className="form-input w-full rounded-lg bg-neutral-accent border-transparent focus:border-primary focus:ring-1 focus:ring-primary text-slate-100 h-12 px-4 placeholder:text-slate-500"
                />
              </div>

              {/* Checkbox Default */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="default-payment"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-transparent bg-neutral-accent text-primary focus:ring-offset-neutral-dark focus:ring-primary"
                />
                <label
                  htmlFor="default-payment"
                  className="text-sm text-slate-300 cursor-pointer select-none"
                >
                  Establecer como método de pago predeterminado
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-background-dark font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-primary/20"
                >
                  Guardar tarjeta
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
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
