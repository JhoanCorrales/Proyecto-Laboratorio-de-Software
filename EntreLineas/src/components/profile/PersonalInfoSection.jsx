
import FormField from "./FormField";

const AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCyuttLtyJ3ZiAGQe3YsMQEfrQamkactX_VFNZDSGheYVy-NvI9whj5QTDSRwzh0GpXOlhyfM9clzdJHoMnN4sPKZH4vNWKEx9bB8haydlyRPOme71SuqhR9pdXXQApuuf7Un_aVthTvmaXtGq4IQohhljptdGKVqKNxy5qksudDLlrq_PnkLOX_v0zOdv6ap3InYZBF2uYvt5sexdTDvXZEIzV51oPUxPO3oo1WTt1tBM_wFZeh33NptXva3wkgiHiUbWLOkJrEdk";

function PersonalInfoSection({ data, onChange, onLogout }) {
  return (
    <div className="flex-1 p-8 border-r border-neutral-border/30">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-slate-100 text-lg font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">person</span>
          Información Personal
        </h3>
        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-lg bg-neutral-accent/50 border border-neutral-border text-slate-100 text-sm font-bold hover:bg-neutral-accent transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
      <div className="grid grid-cols-1 gap-5">
        <FormField
          label="Nombre completo"
          placeholder="Tu nombre"
          value={data.nombre || ""}
          onChange={(e) => onChange("nombre", e.target.value)}
        />
        <FormField
          label="Correo electrónico"
          type="email"
          placeholder="ejemplo@correo.com"
          value={data.email || ""}
          readOnly
        />
        <FormField
          label="Número de teléfono"
          type="tel"
          placeholder="+XX XXX XXX XXX"
          value={data.telefono || ""}
          onChange={(e) => onChange("telefono", e.target.value)}
        />
        <FormField
          label="Dirección"
          placeholder="Tu dirección"
          value={data.direccion || ""}
          onChange={(e) => onChange("direccion", e.target.value)}
        />
        <FormField
          label="Ciudad"
          placeholder="Tu ciudad"
          value={data.ciudad || ""}
          onChange={(e) => onChange("ciudad", e.target.value)}
        />
        <FormField
          label="Departamento"
          placeholder="Tu departamento"
          value={data.departamento || ""}
          onChange={(e) => onChange("departamento", e.target.value)}
        />
        <FormField
          label="Código Postal"
          placeholder="Tu código postal"
          value={data.codigo_postal || ""}
          onChange={(e) => onChange("codigo_postal", e.target.value)}
        />
      </div>
    </div>
  );
}

export default PersonalInfoSection; 