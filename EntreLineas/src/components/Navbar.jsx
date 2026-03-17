function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-primary/10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 lg:px-20 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-primary">
            <span className="material-symbols-outlined text-3xl shrink-0">menu_book</span>
            <a className="text-xl font-bold tracking-tight text-slate-900 dark:text-white" href="/home">Entre Líneas</a>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Catálogo</a>
            <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Noticias</a>
            <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Exploración 3D</a>
          </div>
        </div>
        <div className="flex-1 max-w-md hidden lg:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-muted">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input
              className="block w-full pl-10 pr-3 py-2 border-none bg-slate-200/50 dark:bg-neutral-dark rounded-lg focus:ring-2 focus:ring-primary text-sm placeholder-neutral-muted"
              placeholder="Buscar libros, autores o géneros..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-primary/10 rounded-full transition-colors relative">
            <span className="material-symbols-outlined">shopping_cart</span>
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-background-dark">3</span>
          </button>
          <button className="p-2 hover:bg-primary/10 rounded-full transition-colors">
            <a className="material-symbols-outlined" href="/profile/edit">account_circle</a>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;