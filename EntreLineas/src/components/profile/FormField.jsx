function FormField({ label, type = "text", placeholder, value, onChange, readOnly = false }) {
  return (
    <div className="space-y-2">
      <label className="text-neutral-muted text-sm font-medium">{label}</label>
      {readOnly ? (
        <div className="w-full bg-neutral-accent/50 border border-neutral-border/50 rounded-lg px-4 py-3 text-slate-400 cursor-not-allowed">
          {value}
        </div>
      ) : (
        <input
          className="w-full bg-neutral-accent border border-neutral-border rounded-lg px-4 py-3 text-slate-100 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
        />
      )}
    </div>
  );
}

export default FormField;