export default function Select({ 
  label, 
  options = [], 
  className = "" 
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-medium text-slate-700 dark:text-[#92bbc9]">
        {label}
      </label>

      <select className="w-full rounded-lg border-slate-300 dark:border-[#325a67] bg-white dark:bg-[#111e22] text-slate-900 dark:text-white focus:ring-primary focus:border-primary h-12 px-4">
        <option value="">Seleccione una opción</option>

        {options.map((opt, index) => (
          <option key={index}>{opt}</option>
        ))}
      </select>
    </div>
  )
}