export default function Input({ 
  label, 
  type = "text", 
  placeholder, 
  className = "" 
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-medium text-slate-700 dark:text-[#92bbc9]">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        className="w-full rounded-lg border-slate-300 dark:border-[#325a67] bg-white dark:bg-[#111e22] text-slate-900 dark:text-white focus:ring-primary focus:border-primary h-12 px-4"
      />
    </div>
  )
}