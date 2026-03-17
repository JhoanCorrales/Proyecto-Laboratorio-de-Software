import ProfileAvatar from "./ProfileAvatar";
import FormField from "./FormField";

const AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCyuttLtyJ3ZiAGQe3YsMQEfrQamkactX_VFNZDSGheYVy-NvI9whj5QTDSRwzh0GpXOlhyfM9clzdJHoMnN4sPKZH4vNWKEx9bB8haydlyRPOme71SuqhR9pdXXQApuuf7Un_aVthTvmaXtGq4IQohhljptdGKVqKNxy5qksudDLlrq_PnkLOX_v0zOdv6ap3InYZBF2uYvt5sexdTDvXZEIzV51oPUxPO3oo1WTt1tBM_wFZeh33NptXva3wkgiHiUbWLOkJrEdk";

function PersonalInfoSection({ data, onChange }) {
  return (
    <div className="flex-1 p-8 border-r border-neutral-border/30">
      <h3 className="text-slate-100 text-lg font-bold mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">person</span>
        Información Personal
      </h3>
      <ProfileAvatar src={AVATAR_URL} />
      <div className="grid grid-cols-1 gap-5">
        <FormField
          label="Nombre completo"
          placeholder="Tu nombre"
          value={data.nombre}
          onChange={(e) => onChange("nombre", e.target.value)}
        />
        <FormField
          label="Correo electrónico"
          type="email"
          placeholder="ejemplo@correo.com"
          value={data.email}
          onChange={(e) => onChange("email", e.target.value)}
        />
        <FormField
          label="Número de teléfono"
          type="tel"
          placeholder="+XX XXX XXX XXX"
          value={data.telefono}
          onChange={(e) => onChange("telefono", e.target.value)}
        />
        <div className="opacity-70">
          <FormField
            label="Documento de identidad (Solo lectura)"
            value={data.documento}
            readOnly
          />
        </div>
      </div>
    </div>
  );
}

export default PersonalInfoSection; 