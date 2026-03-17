import FormField from "./FormField";
import { useState } from "react";

function SecuritySection() {
  const [passwords, setPasswords] = useState({ nueva: "", confirmar: "" });

  return (
    <div className="space-y-5">
      <h3 className="text-slate-100 text-lg font-bold flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">lock</span>
        Seguridad
      </h3>
      <div className="grid grid-cols-1 gap-4">
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
        <button className="w-fit px-6 py-2 rounded-lg bg-neutral-accent border border-neutral-border text-slate-100 text-sm font-bold hover:bg-neutral-border transition-colors">
          Actualizar contraseña
        </button>
      </div>
    </div>
  );
}

export default SecuritySection;