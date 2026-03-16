function Hero() {
  return (
    <header className="relative min-h-[600px] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-background-dark via-background-dark/80 to-transparent z-10"></div>
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBbG1b3Kwed1viGb7hKEkzSI9Ya9U9be5hu5NQZsUvwatQXmYpZTIMwI2a7qGjkT2X2naUx-_V0BdBTHjQhKQwcSvZmZQPsBLzZO_YY97Rya_4tHHaPxQ2ZAk_q2XF6nQCtGEE3xY0327mCAYErSBV5GxJmPvCbl36RKE9wyXcaC2DCkL3l-HWtRCfmUOYOgwoyF3tNbg5N9KS0WOJDaEgzudhwTIQEhROyGytvAQLNGFOfnye6oKEzWRhtmJJBdcUIS-0We10ybak')" }}
        ></div>
      </div>
      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-20 py-20 w-full">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Nueva Colección Digital
          </div>
          <h1 className="text-5xl lg:text-7xl font-black leading-tight text-white">
            Bienvenido a tu próxima <span className="text-primary">gran historia</span>
          </h1>
          <p className="text-lg text-neutral-muted leading-relaxed">
            Explora miles de títulos desde clásicos atemporales hasta los últimos lanzamientos tecnológicos. Nuestra biblioteca inteligente te ofrece una experiencia de lectura única.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button className="px-8 py-4 bg-primary text-background-dark font-bold rounded-lg hover:brightness-110 transition-all flex items-center gap-2">
              Explorar Catálogo
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <button className="px-8 py-4 bg-neutral-dark text-white border border-primary/30 font-bold rounded-lg hover:bg-neutral-dark/80 transition-all">
              Ver Novedades
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Hero;