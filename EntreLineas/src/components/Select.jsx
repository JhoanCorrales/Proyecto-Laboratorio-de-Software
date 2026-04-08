export default function Select({ 
  label, 
  options = [], 
  className = "",
  name,
  value,
  onChange,
  placeholder = "Seleccione una opción",
  disabled = false,
  required = false,
  ...props
}) {
  // Permitir opciones como strings o como objetos {value, label}
  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-medium text-slate-700 dark:text-[#92bbc9]">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <select 
        name={name}
        value={value || ""}
        onChange={(e) => onChange && onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={`w-full rounded-lg border border-slate-300 dark:border-[#325a67] bg-white dark:bg-[#111e22] text-slate-900 dark:text-white focus:ring-primary focus:border-primary h-12 px-4 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        {...props}
      >
        <option value="">{placeholder}</option>

        {normalizedOptions.map((opt, index) => (
          <option key={index} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}