import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PersonalInfoSection from "../components/profile/PersonalInfoSection";
import SecuritySection from "../components/profile/SecuritySection";
import ShippingSection from "../components/profile/ShippingSection";
import { getCurrentUser } from "../services/authService";

const INITIAL_STATE = {
  nombre: "",
  email: "",
  telefono: "",
  direccion: "",
  ciudad: "",
  departamento: "",
  codigo_postal: "",
};

function EditProfile() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const isRoot = user?.roles?.includes("Root");
  
  const [personal, setPersonal] = useState(INITIAL_STATE);
  const [originalData, setOriginalData] = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) { navigate("/"); return; }

      try {
        const response = await fetch("http://localhost:4003/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("No autorizado");

        const data = await response.json();
        const loaded = {
          nombre:       data.nombre       || "",
          email:        data.email        || "",
          telefono:     data.telefono     || "",
          direccion:    data.direccion    || "",
          ciudad:       data.ciudad       || "",
          departamento: data.departamento || "",
          codigo_postal:data.codigo_postal|| "",
        };
        setPersonal(loaded);
        setOriginalData(loaded); // guardamos copia para el cancelar
      } catch (err) {
        setError("Error al cargar tu perfil");
        if (err.message === "No autorizado") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleChange = (field, value) =>
    setPersonal((prev) => ({ ...prev, [field]: value }));

  // Cancelar restaura los datos originales del servidor (sin recargar página)
  const handleCancel = () => {
    setPersonal(originalData);
    setError("");
    setMessage("");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleSave = async () => {
    setError("");
    setMessage("");
    setSaving(true);

    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }

    try {
      const response = await fetch("http://localhost:4003/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre:        personal.nombre,
          telefono:      personal.telefono,
          direccion:     personal.direccion,
          ciudad:        personal.ciudad,
          departamento:  personal.departamento,
          codigo_postal: personal.codigo_postal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al guardar cambios");
        return;
      }

      setOriginalData(personal); // actualiza la base del cancelar
      setMessage("Perfil actualizado exitosamente");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setError("Error de conexión con el servidor");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background-dark font-display text-slate-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background-dark font-display text-slate-100 min-h-screen relative">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBbG1b3Kwed1viGb7hKEkzSI9Ya9U9be5hu5NQZsUvwatQXmYpZTIMwI2a7qGjkT2X2naUx-_V0BdBTHjQhKQwcSvZmZQPsBLzZO_YY97Rya_4tHHaPxQ2ZAk_q2XF6nQCtGEE3xY0327mCAYErSBV5GxJmPvCbl36RKE9wyXcaC2DCkL3l-HWtRCfmUOYOgwoyF3tNbg5N9KS0WOJDaEgzudhwTIQEhROyGytvAQLNGFOfnye6oKEzWRhtmJJBdcUIS-0We10ybak')" }}
      />
      <div className="fixed inset-0 z-10 bg-background-dark/80" />

      <div className="relative z-20 flex flex-col min-h-screen">
        <Navbar />

        <main className="flex-1 flex justify-center py-8 px-4 md:px-10">
          <div className="w-full max-w-6xl bg-neutral-dark rounded-xl shadow-2xl border border-neutral-border/50 overflow-hidden flex flex-col">

            <div className="px-8 pt-8 pb-6 border-b border-neutral-border/30">
              <h1 className="text-slate-100 text-3xl font-black tracking-tight">Editar perfil</h1>
              <p className="text-neutral-muted mt-1">Actualiza tu información personal y de seguridad</p>
            </div>

            {error && (
              <div className="mx-8 mt-6 p-4 bg-red-900/30 text-red-400 rounded-lg border border-red-600/30">
                {error}
              </div>
            )}
            {message && (
              <div className="mx-8 mt-6 p-4 bg-green-900/30 text-green-400 rounded-lg border border-green-600/30">
                {message}
              </div>
            )}

            <div className="flex flex-col lg:flex-row flex-1 overflow-auto">
              {/* Columna izquierda: datos personales */}
              <PersonalInfoSection
                data={personal}
                onChange={handleChange}
                onLogout={handleLogout}
                isRoot={isRoot}
              />

              {/* Columna derecha: seguridad + envío — comparten el mismo estado */}
              <div className="flex-1 p-8 flex flex-col gap-10">
                <SecuritySection />
                {!isRoot && <ShippingSection data={personal} onChange={handleChange} />}
              </div>
            </div>

            <div className="px-8 py-6 bg-background-dark/30 border-t border-neutral-border/30 flex justify-end gap-4">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-8 py-2.5 rounded-lg text-neutral-muted font-bold hover:text-slate-100 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-10 py-2.5 rounded-lg bg-primary text-background-dark font-black tracking-tight hover:shadow-[0_0_15px_rgba(43,189,238,0.4)] transition-all disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </main>

        <footer className="p-8 text-center text-neutral-muted text-sm">
          <p>© 2026 Entre Líneas - Tu librería de confianza</p>
        </footer>
      </div>
    </div>
  );
}

export default EditProfile;