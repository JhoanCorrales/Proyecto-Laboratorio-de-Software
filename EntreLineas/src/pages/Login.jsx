export default function Login() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-dark font-display text-slate-100">
      
      <div
        className="flex flex-1 justify-center items-center bg-cover bg-center bg-fixed"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16, 29, 34, 0.7), rgba(16, 29, 34, 0.7)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuBbG1b3Kwed1viGb7hKEkzSI9Ya9U9be5hu5NQZsUvwatQXmYpZTIMwI2a7qGjkT2X2naUx-_V0BdBTHjQhKQwcSvZmZQPsBLzZO_YY97Rya_4tHHaPxQ2ZAk_q2XF6nQCtGEE3xY0327mCAYErSBV5GxJmPvCbl36RKE9wyXcaC2DCkL3l-HWtRCfmUOYOgwoyF3tNbg5N9KS0WOJDaEgzudhwTIQEhROyGytvAQLNGFOfnye6oKEzWRhtmJJBdcUIS-0We10ybak')",
        }}
      >
        <div className="max-w-[480px] w-full p-4">

          {/* Header */}
          <header className="flex items-center justify-between border-b border-neutral-accent px-4 py-3 mb-6">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary text-3xl">
                auto_stories
              </span>
              <h2 className="text-lg font-bold">Entre Líneas</h2>
            </div>
            <button className="flex items-center justify-center rounded-lg h-10 bg-neutral-accent px-3">
              <span className="material-symbols-outlined text-[20px]">
                book
              </span>
            </button>
          </header>

          {/* Card */}
          <div className="border border-neutral-border/20 rounded-xl p-6 md:p-8 shadow-2xl bg-neutral-dark">

            <div className="mb-6">
              <h1 className="text-3xl font-black">
                Bienvenido de nuevo
              </h1>
              <p className="text-neutral-muted">
                Inicia sesión para continuar tu viaje de lectura
              </p>
            </div>

            <div className="flex flex-col gap-5 mb-6">

              <div>
                <label className="text-sm font-medium pb-2 block">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  placeholder="Ingresa tu correo electrónico"
                  className="w-full rounded-lg border border-neutral-border bg-neutral-dark h-12 px-4 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium pb-2 block">
                  Contraseña
                </label>
                <input
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  className="w-full rounded-lg border border-neutral-border bg-neutral-dark h-12 px-4 focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <div className="flex justify-end pt-2">
                  <a href="#" className="text-sm text-neutral-muted hover:text-primary underline">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </div>

            </div>

            <button className="w-full h-12 bg-primary text-background-dark font-bold rounded-lg hover:opacity-90 transition-opacity">
              Iniciar Sesión
            </button>

            <div className="text-center mt-6">
              <p className="text-sm text-neutral-muted">
                ¿No tienes una cuenta?{" "}
                <a href="/register" className="text-primary font-bold hover:underline">
                  Regístrate gratis
                </a>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}