import FormField from "./FormField";

function ShippingSection({ data, onChange }) {
  return (
    <div className="space-y-5">
      <h3 className="text-slate-100 text-lg font-bold flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">local_shipping</span>
        Información de Envío
      </h3>
      <div className="grid grid-cols-1 gap-4">
        <FormField
          label="Dirección"
          placeholder="Dirección completa"
          value={data.direccion}
          onChange={(e) => onChange("direccion", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Ciudad"
            value={data.ciudad}
            onChange={(e) => onChange("ciudad", e.target.value)}
          />
          <FormField
            label="Departamento"
            value={data.departamento}
            onChange={(e) => onChange("departamento", e.target.value)}
          />
        </div>
        <FormField
          label="Código postal"
          value={data.codigoPostal}
          onChange={(e) => onChange("codigoPostal", e.target.value)}
        />
      </div>
    </div>
  );
}

export default ShippingSection;