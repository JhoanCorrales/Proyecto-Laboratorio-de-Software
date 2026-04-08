export default function Input({ 
  label, 
  type = "text", 
  placeholder, 
  className = "",
  name,
  value,
  onChange,
  required = false,
  showPassword = false,
  onToggleShowPassword = null,
  isLoading = false,
  ...props
}) {
  const isEmpty = type === "password" && !value?.trim();
  const inputType = isEmpty ? "text" : type;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-medium text-slate-700 dark:text-[#92bbc9]">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-lg border border-slate-300 dark:border-[#325a67] bg-white dark:bg-[#111e22] text-slate-900 dark:text-white focus:ring-primary focus:border-primary h-12 px-4 ${type === "password" && onToggleShowPassword ? "pr-12" : ""}`}
          {...props}
        />
        {type === "password" && onToggleShowPassword && (
          <button
            type="button"
            onClick={onToggleShowPassword}
            disabled={isLoading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-muted hover:text-primary transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? "visibility" : "visibility_off"}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}