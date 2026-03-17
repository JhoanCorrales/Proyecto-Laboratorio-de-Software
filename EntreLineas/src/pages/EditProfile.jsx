import { useState } from "react";
import Navbar from "../components/Navbar";
import PersonalInfoSection from "../components/profile/PersonalInfoSection";
import SecuritySection from "../components/profile/SecuritySection";
import ShippingSection from "../components/profile/ShippingSection";

const INITIAL_PERSONAL = {
  nombre: "Alejandro Rodríguez",
  email: "a.rodriguez@email.com",
  telefono: "+34 600 000 000",
  documento: "12345678X",
};

const INITIAL_SHIPPING = {
  direccion: "Calle de los Libros 42",
  ciudad: "Madrid",
  departamento: "Madrid",
  codigoPostal: "28001",
};

function EditProfile() {
  const [personal, setPersonal] = useState(INITIAL_PERSONAL);
  const [shipping, setShipping] = useState(INITIAL_SHIPPING);

  const handlePersonal = (field, value) =>
    setPersonal((prev) => ({ ...prev, [field]: value }));

  const handleShipping = (field, value) =>
    setShipping((prev) => ({ ...prev, [field]: value }));

  const handleCancel = () => {
    setPersonal(INITIAL_PERSONAL);
    setShipping(INITIAL_SHIPPING);
  };

  return (
    <div className="bg-background-dark font-display text-slate-100 min-h-screen relative">
      {/* Fondo */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBbG1b3Kwed1viGb7hKEkzSI9Ya9U9be5hu5NQZsUvwatQXmYpZTIMwI2a7qGjkT2X2naUx-_V0BdBTHjQhKQwcSvZmZQPsBLzZO_YY97Rya_4tHHaPxQ2ZAk_q2XF6nQCtGEE3xY0327mCAYErSBV5GxJmPvCbl36RKE9wyXcaC2DCkL3l-HWtRCfmUOYOgwoyF3tNbg5N9KS0WOJDaEgzudhwTIQEhROyGytvAQLNGFOfnye6oKEzWRhtmJJBdcUIS-0We10ybak')" }}
      />
      <div className="fixed inset-0 z-10 bg-background-dark/80" />

      <div className="relative z-20 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 flex justify-center py-8 px-4 md:px-10">
          <div className="w-full max-w-6xl bg-neutral-dark rounded-xl shadow-2xl border border-neutral-border/50 overflow-hidden flex flex-col">

            {/* Título */}
            <div className="px-8 pt-8 pb-6 border-b border-neutral-border/30">
              <h1 className="text-slate-100 text-3xl font-black tracking-tight">Editar perfil</h1>
              <p className="text-neutral-muted mt-1">Actualiza tu información personal y de seguridad</p>
            </div>

            {/* Columnas */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-auto">
              <PersonalInfoSection data={personal} onChange={handlePersonal} />

              <div className="flex-1 p-8 flex flex-col gap-10">
                <SecuritySection />
                <ShippingSection data={shipping} onChange={handleShipping} />
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-background-dark/30 border-t border-neutral-border/30 flex justify-end gap-4">
              <button
                onClick={handleCancel}
                className="px-8 py-2.5 rounded-lg text-neutral-muted font-bold hover:text-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button className="px-10 py-2.5 rounded-lg bg-primary text-background-dark font-black tracking-tight hover:shadow-[0_0_15px_rgba(43,189,238,0.4)] transition-all">
                Guardar cambios
              </button>
            </div>
          </div>
        </main>

        <footer className="p-8 text-center text-neutral-muted text-sm">
          <p>© 2024 Entre Líneas - Tu librería de confianza</p>
        </footer>
      </div>
    </div>
  );
}

export default EditProfile;