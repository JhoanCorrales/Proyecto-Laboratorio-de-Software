import FormField from "./FormField";
import { useState } from "react";

function SecuritySection() {
  const [passwords, setPasswords] = useState({ current: "", nueva: "", confirmar: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!passwords.current || !passwords.nueva || !passwords.confirmar) {
      setError("Todos los campos de contraseña son obligatorios");
      return;
    }

    if (passwords.nueva !== passwords.confirmar) {
      setError("Las nuevas contraseñas no coinciden");
      return;
    }

    if (passwords.nueva.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:4003/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.nueva,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al cambiar contraseña");
        setLoading(false);
        return;
      }

      setMessage("Contraseña actualizada exitosamente");
      setPasswords({ current: "", nueva: "", confirmar: "" });
    } catch (err) {
      console.error("Error:", err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setError("");
    setMessage("");

    if (!deletePassword) {
      setError("Debes ingresar tu contraseña para confirmar");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:4003/api/auth/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: deletePassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al eliminar cuenta");
        setLoading(false);
        return;
      }

      // Limpiar localStorage y redirigir
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      console.error("Error:", err);
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <h3 className="text-slate-100 text-lg font-bold flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">lock</span>
        Seguridad
      </h3>

      {/* Cambiar contraseña */}
      <div className="space-y-4 border-b border-neutral-border/30 pb-6">
        <h4 className="text-slate-200 font-semibold">Cambiar Contraseña</h4>

        {error && (
          <div className="p-3 bg-red-900/30 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 bg-green-900/30 text-green-400 rounded-lg text-sm">
            {message}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="grid grid-cols-1 gap-4">
          <FormField
            label="Contraseña actual"
            type="password"
            placeholder="••••••••"
            value={passwords.current}
            onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
          />
          <FormField
            label="Nueva contraseña"
            type="password"
            placeholder="••••••••"
            value={passwords.nueva}
            onChange={(e) => setPasswords((p) => ({ ...p, nueva: e.target.value }))}
          />
          <FormField
            label="Confirmar nueva contraseña"
            type="password"
            placeholder="••••••••"
            value={passwords.confirmar}
            onChange={(e) => setPasswords((p) => ({ ...p, confirmar: e.target.value }))}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-fit px-6 py-2 rounded-lg bg-neutral-accent border border-neutral-border text-slate-100 text-sm font-bold hover:bg-neutral-border transition-colors disabled:opacity-50"
          >
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>
      </div>

      {/* Eliminar cuenta */}
      <div className="space-y-4">
        <h4 className="text-slate-200 font-semibold">Zona de peligro</h4>
        <p className="text-sm text-slate-400">
          Eliminar tu cuenta es una acción permanente. Una vez eliminada, no podrá ser recuperada.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-fit px-6 py-2 rounded-lg bg-red-600/20 border border-red-600 text-red-400 text-sm font-bold hover:bg-red-600/30 transition-colors"
        >
          Eliminar mi cuenta
        </button>
      </div>

      {/* Modal para eliminar cuenta */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-dark rounded-lg border border-neutral-border max-w-md w-full p-6 space-y-4">
            <h4 className="text-slate-100 font-bold text-lg">¿Confirmar eliminación de cuenta?</h4>
            <p className="text-slate-300 text-sm">
              Esta acción es irreversible. Ingresa tu contraseña para confirmar.
            </p>

            {error && (
              <div className="p-3 bg-red-900/30 text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <input
              type="password"
              placeholder="Tu contraseña"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              className="w-full rounded-lg border border-neutral-border bg-neutral-accent text-slate-100 px-4 py-2"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword("");
                  setError("");
                }}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-neutral-accent border border-neutral-border text-slate-100 text-sm font-bold hover:bg-neutral-border transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600/20 border border-red-600 text-red-400 text-sm font-bold hover:bg-red-600/30 transition-colors disabled:opacity-50"
              >
                {loading ? "Eliminando..." : "Eliminar cuenta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SecuritySection;