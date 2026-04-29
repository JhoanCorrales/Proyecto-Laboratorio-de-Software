import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const API = "http://localhost:4003/api/auth";
const ROLES = ["Root", "Administrador", "Cliente", "Visitante"];

const ROLE_BADGE = {
  Root: "bg-primary/20 text-primary border border-primary/30",
  Administrador: "bg-slate-100 text-background-dark",
  Cliente: "bg-neutral-accent text-neutral-muted border border-neutral-border/40",
  Visitante: "bg-neutral-accent/50 text-neutral-muted border border-neutral-border/30",
};

function RoleBadge({ rol }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${ROLE_BADGE[rol] ?? "bg-neutral-accent text-neutral-muted"}`}>
      {rol === "Root" && <span className="material-symbols-outlined text-[14px]">shield_person</span>}
      {rol?.toUpperCase()}
    </span>
  );
}

function StatusDot({ estado }) {
  return (
    <span className={`size-2.5 rounded-full inline-block ${
      estado === "activo"
        ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
        : "bg-neutral-border"
    }`} />
  );
}

function CreateAdminModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ nombre: "", apellidos: "", email: "" });
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Generar contraseña aleatoria
  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  useEffect(() => {
    setGeneratedPassword(generatePassword());
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/users/create-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, password: generatedPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess(`Administrador creado exitosamente. Contraseña temporal: ${generatedPassword}`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-dark border border-neutral-border rounded-xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">person_add</span>
            Nuevo Administrador
          </h3>
          <button onClick={onClose} className="text-neutral-muted hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-900/30 text-red-400 rounded-lg text-sm border border-red-600/30">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-neutral-muted text-xs font-medium">Nombre</label>
              <input
                required
                className="w-full bg-neutral-accent border border-neutral-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => setForm(p => ({ ...p, nombre: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-neutral-muted text-xs font-medium">Apellidos</label>
              <input
                className="w-full bg-neutral-accent border border-neutral-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
                placeholder="Apellidos"
                value={form.apellidos}
                onChange={(e) => setForm(p => ({ ...p, apellidos: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-neutral-muted text-xs font-medium">Correo electrónico</label>
            <input
              required
              type="email"
              className="w-full bg-neutral-accent border border-neutral-border rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-primary"
              placeholder="correo@ejemplo.com"
              value={form.email}
              onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1 bg-neutral-accent/30 p-3 rounded-lg border border-neutral-border">
            <label className="text-neutral-muted text-xs font-medium">Contraseña Temporal (Generada)</label>
            <div className="flex items-center gap-2">
              <input
                type={showPassword ? "text" : "password"}
                readOnly
                className="flex-1 bg-neutral-accent border border-neutral-border rounded-lg px-3 py-2.5 text-sm text-white outline-none"
                value={generatedPassword}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedPassword);
                }}
                className="p-2 hover:bg-primary/20 rounded-lg transition-colors text-primary"
                title="Copiar contraseña"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 hover:bg-primary/20 rounded-lg transition-colors text-primary"
                title="Ver/Ocultar"
              >
                <span className="material-symbols-outlined text-sm">{showPassword ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
            <p className="text-xs text-neutral-muted mt-2">El administrador debe cambiarla en su primer acceso.</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg border border-neutral-border text-neutral-muted hover:bg-neutral-accent transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-primary text-background-dark font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear administrador"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangeRoleModal({ user, onClose, onSuccess }) {
  const [selectedRole, setSelectedRole] = useState(user.roles?.[0] ?? "Cliente");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isRootUser = user.roles?.[0] === "Root";

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/users/${user.id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rol: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess("Rol actualizado exitosamente.");
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-dark border border-neutral-border rounded-xl w-full max-w-sm p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">Cambiar rol</h3>
          <button onClick={onClose} className="text-neutral-muted hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <p className="text-neutral-muted text-sm">
          Usuario: <span className="text-white font-semibold">{user.nombre}</span>
        </p>

        {isRootUser && (
          <div className="p-3 bg-yellow-900/30 text-yellow-400 rounded-lg text-sm border border-yellow-600/30 flex items-start gap-2">
            <span className="material-symbols-outlined text-lg flex-shrink-0">info</span>
            <span>No se puede cambiar el rol de un usuario Root. Este rol es protegido del sistema.</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-900/30 text-red-400 rounded-lg text-sm border border-red-600/30">
            {error}
          </div>
        )}

        {!isRootUser && (
          <div className="space-y-2">
            {ROLES.filter(r => r !== "Root").map((rol) => (
              <button
                key={rol}
                onClick={() => setSelectedRole(rol)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  selectedRole === rol
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-neutral-border bg-neutral-accent/30 text-slate-300 hover:border-primary/40"
                }`}
              >
                {rol}
                {selectedRole === rol && <span className="material-symbols-outlined text-sm">check_circle</span>}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg border border-neutral-border text-neutral-muted hover:bg-neutral-accent transition-colors text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || isRootUser}
            className="flex-1 py-2.5 rounded-lg bg-primary text-background-dark font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [rolFilter, setRolFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [changeRoleUser, setChangeRoleUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({ search, rol: rolFilter, page, limit: 10 });
      const res = await fetch(`${API}/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403) {
        navigate("/home");
        return;
      }
      if (!res.ok) throw new Error("Error al cargar usuarios");
      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, [search, rolFilter, page, navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounce búsqueda
  useEffect(() => {
    setPage(1);
  }, [search, rolFilter]);

  const handleToggleEstado = async (user) => {
    const nuevoEstado = user.estado === "activo" ? "suspendido" : "activo";
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/users/${user.id}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data.message);
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSuccess = (msg) => {
    setSuccess(msg);
    fetchUsers();
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div className="bg-background-dark text-slate-100 min-h-screen flex flex-col">

      <Navbar />

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <div
          className="px-6 md:px-20 py-12 border-b border-neutral-border/20"
          style={{ background: "linear-gradient(to bottom, rgba(16,29,34,0.85), rgba(16,29,34,0.95)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuBbG1b3Kwed1viGb7hKEkzSI9Ya9U9be5hu5NQZsUvwatQXmYpZTIMwI2a7qGjkT2X2naUx-_V0BdBTHjQhKQwcSvZmZQPsBLzZO_YY97Rya_4tHHaPxQ2ZAk_q2XF6nQCtGEE3xY0327mCAYErSBV5GxJmPvCbl36RKE9wyXcaC2DCkL3l-HWtRCfmUOYOgwoyF3tNbg5N9KS0WOJDaEgzudhwTIQEhROyGytvAQLNGFOfnye6oKEzWRhtmJJBdcUIS-0We10ybak') center/cover" }}
        >
          <div className="max-w-6xl mx-auto">
            <span className="text-primary text-xs font-bold uppercase tracking-widest">Panel de Control</span>
            <h1 className="text-slate-100 text-4xl font-extrabold leading-tight mt-1 mb-2">Gestionar roles</h1>
            <p className="text-neutral-muted text-lg max-w-2xl">
              Administra permisos y tipos de usuario para mantener la seguridad y el flujo de trabajo de la librería.
            </p>
          </div>
        </div>

        <div className="px-6 md:px-20 py-8 max-w-7xl mx-auto w-full flex-1">

          {/* Mensajes */}
          {success && (
            <div className="mb-6 p-4 bg-green-900/30 text-green-400 rounded-lg border border-green-600/30 flex items-center gap-2">
              <span className="material-symbols-outlined">check_circle</span>
              {success}
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 text-red-400 rounded-lg border border-red-600/30">
              {error}
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative group">
              <input
                className="w-full h-12 bg-neutral-dark border border-neutral-border/50 rounded-xl px-4 pr-12 text-slate-100 placeholder:text-neutral-muted/60 focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all outline-none"
                placeholder="Buscar por nombre o correo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="absolute right-4 top-3 text-neutral-muted">
                <span className="material-symbols-outlined">search</span>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="relative min-w-[180px]">
                <select
                  className="appearance-none w-full h-12 bg-neutral-dark border border-neutral-border/50 rounded-xl px-4 pr-10 text-slate-100 focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all outline-none"
                  value={rolFilter}
                  onChange={(e) => setRolFilter(e.target.value)}
                >
                  <option value="">Todos los roles</option>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-neutral-muted">
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-12 px-6 bg-primary hover:bg-primary/90 text-background-dark font-bold rounded-xl transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-xl">person_add</span>
                <span className="hidden sm:block">Nuevo Admin</span>
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-neutral-dark/40 border border-neutral-border/30 rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-accent/50 text-neutral-muted text-xs uppercase tracking-wider font-semibold border-b border-neutral-border/30">
                    <th className="px-6 py-4">Nombre</th>
                    <th className="px-6 py-4">Correo electrónico</th>
                    <th className="px-6 py-4">Rol actual</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border/10">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 bg-neutral-border/30 rounded w-32" /></td>
                        <td className="px-6 py-4"><div className="h-4 bg-neutral-border/30 rounded w-48" /></td>
                        <td className="px-6 py-4"><div className="h-6 bg-neutral-border/30 rounded w-24" /></td>
                        <td className="px-6 py-4 text-center"><div className="h-3 w-3 bg-neutral-border/30 rounded-full mx-auto" /></td>
                        <td className="px-6 py-4 text-right"><div className="h-8 bg-neutral-border/30 rounded w-24 ml-auto" /></td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-neutral-muted">
                        <span className="material-symbols-outlined text-5xl block mb-2">person_search</span>
                        No se encontraron usuarios
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-neutral-accent/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-100">{user.nombre}</td>
                        <td className="px-6 py-4 text-neutral-muted">{user.email}</td>
                        <td className="px-6 py-4">
                          <RoleBadge rol={user.roles?.[0]} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleEstado(user)}
                            title={user.estado === "activo" ? "Suspender" : "Activar"}
                            className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                          >
                            <StatusDot estado={user.estado} />
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setChangeRoleUser(user)}
                            disabled={user.roles?.[0] === "Root"}
                            title={user.roles?.[0] === "Root" ? "No se puede cambiar el rol de Root" : "Cambiar rol"}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                              user.roles?.[0] === "Root"
                                ? "text-neutral-muted bg-neutral-accent/30 cursor-not-allowed opacity-50"
                                : "text-primary hover:text-white bg-primary/10 hover:bg-primary"
                            }`}
                          >
                            Cambiar rol
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="px-6 py-4 bg-neutral-accent/30 flex items-center justify-between text-sm text-neutral-muted">
              <p>Mostrando {users.length} de {total} usuarios</p>
              <div className="flex gap-2 items-center">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 rounded hover:bg-neutral-accent transition-colors disabled:opacity-30"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={i} className="px-2 text-neutral-muted">...</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`size-8 rounded text-sm font-bold transition-colors ${
                          page === p
                            ? "bg-primary text-background-dark"
                            : "hover:bg-neutral-accent text-slate-300"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 rounded hover:bg-neutral-accent transition-colors disabled:opacity-30"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="px-6 md:px-20 py-6 border-t border-neutral-border/20 bg-background-dark/95">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-muted text-xs">
          <p>© 2026 Entre Líneas S.A. - Sistema de gestión interna</p>
        </div>
      </footer>

      {/* Modales */}
      {showCreateModal && (
        <CreateAdminModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleSuccess}
        />
      )}
      {changeRoleUser && (
        <ChangeRoleModal
          user={changeRoleUser}
          onClose={() => setChangeRoleUser(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

export default RoleManagement;