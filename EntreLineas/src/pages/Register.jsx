import Input from "../components/Input"
import Select from "../components/Select"

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 relative overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">

      {/* Background Image */}
      <div
        className="fixed inset-0 z-0 bg-center bg-cover bg-no-repeat opacity-40"
        style={{
          backgroundImage:
            'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA08qmVusJV3vHNSzWiklfnXIGs8YrVV5dpis2ntdCCRMYkFboPcL14pAQLhRS_SPpIHiNBPQQq2wW7qC-uT6AZKoIITiSJnAhOrQyGz-CuFkKqKSLWMzyFXH24gNtVkYiETXH6iqihsRnZmmECj4mMPce0nTMhY65R_dxTWakExUk5dw0glmrWCkVzQRcqAOTJ6MYEOEN4LecgpAjlkejPVlptlaHhxyBFpXyVPl9lIPygbVOlOje6zYQqP8q7fkuOFi7D8HtP1_g")',
        }}
      />

      <div className="relative z-10 w-full max-w-[800px] bg-background-light dark:bg-[#192d33] shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-6 sm:p-10 border-b border-slate-200 dark:border-[#325a67] flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-4xl">
              auto_stories
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Entre Líneas
          </h1>

          <p className="text-slate-600 dark:text-[#92bbc9] mt-2">
            Crea tu cuenta para acceder a nuestra biblioteca digital
          </p>
        </div>

        {/* Form Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">

          <form className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* DNI */}
            <Input label="DNI" placeholder="Ingrese su DNI" />

            {/* Fecha */}
            <Input label="Fecha de nacimiento" type="date" />

            {/* Nombres */}
            <Input label="Nombres" placeholder="Sus nombres" />

            {/* Apellidos */}
            <Input label="Apellidos" placeholder="Sus apellidos" />

            {/* Lugar */}
            <Input label="Lugar de nacimiento" placeholder="Ciudad, País" />

            {/* Género */}
            <Select
              label="Género"
              options={[
                "Femenino",
                "Masculino",
                "Otro",
                "Prefiero no decirlo",
              ]}
            />

            {/* Dirección */}
            <Input
              label="Dirección de correspondencia"
              placeholder="Calle, número, ciudad y código postal"
              className="md:col-span-2"
            />

            {/* Email */}
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="ejemplo@correo.com"
              className="md:col-span-2"
            />

            {/* Usuario */}
            <Input label="Usuario" placeholder="Nombre de usuario" />

            {/* Contraseña */}
            <Input
              label="Contraseña"
              type="password"
              placeholder="Mínimo 8 caracteres"
            />

            {/* Tema */}
            <Select
              label="Temas literarios de preferencia"
              className="md:col-span-2"
              options={[
                "Ficción",
                "Misterio",
                "Fantasía",
                "Historia",
                "Ciencia Ficción",
                "Poesía",
              ]}
            />

            {/* Checkbox */}
            <div className="md:col-span-2 flex items-start gap-3 mt-2">
              <input
                id="data-treatment"
                type="checkbox"
                className="w-5 h-5 rounded border-slate-300 dark:border-[#325a67] text-primary cursor-pointer"
              />
              <label
                htmlFor="data-treatment"
                className="text-sm text-slate-700 dark:text-[#92bbc9] cursor-pointer"
              >
                Acepto el tratamiento de datos personales
              </label>
            </div>

            {/* Botón */}
            <div className="md:col-span-2 mt-4">
              <button
                type="submit"
                className="w-full bg-primary hover:opacity-90 text-background-dark font-bold py-4 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <span>Registrarse</span>
                <span className="material-symbols-outlined">
                  person_add
                </span>
              </button>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-[#111e22] border-t border-slate-200 dark:border-[#325a67] text-center">
          <p className="text-slate-600 dark:text-[#92bbc9] text-sm">
            ¿Ya tienes una cuenta?
            <a href="/" className="text-primary font-semibold hover:underline ml-1 cursor-pointer">
              Iniciar sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}