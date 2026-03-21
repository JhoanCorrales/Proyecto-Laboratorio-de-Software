function FilterSidebar({ filters, onChange, onApply, onClear }) {
  return (
    <aside className="w-full lg:w-72 flex-shrink-0">
      <div className="bg-neutral-dark border border-neutral-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white text-xl font-bold">Filtros</h3>
          <span className="material-symbols-outlined text-neutral-muted">tune</span>
        </div>

        <div className="space-y-6">
          {/* Búsqueda por título/autor */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Buscar por título o autor
            </label>
            <input
              className="w-full bg-neutral-accent border-none rounded-lg py-3 px-4 text-sm text-white focus:ring-1 focus:ring-primary placeholder:text-neutral-muted outline-none"
              placeholder="Ej: Cien años de soledad"
              type="text"
              value={filters.search}
              onChange={(e) => onChange("search", e.target.value)}
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Categoría
            </label>
            <select
              className="w-full bg-neutral-accent border-none rounded-lg py-3 px-4 text-sm text-white focus:ring-1 focus:ring-primary outline-none appearance-none"
              value={filters.category}
              onChange={(e) => onChange("category", e.target.value)}
            >
              <option value="">Todas las categorías</option>
              <option value="subject:fiction">Ficción</option>
              <option value="subject:nonfiction">No Ficción</option>
              <option value="subject:science_fiction">Ciencia Ficción</option>
              <option value="subject:fantasy">Fantasía</option>
              <option value="subject:mystery">Misterio</option>
              <option value="subject:self-help">Autoayuda</option>
              <option value="subject:children">Infantil</option>
              <option value="subject:history">Historia</option>
            </select>
          </div>

          {/* Rango de precio */}
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Rango de precio (COP)
            </label>
            <div className="flex gap-2">
              <input
                className="w-1/2 bg-neutral-accent border-none rounded-lg py-2 px-3 text-sm text-white placeholder:text-neutral-muted outline-none focus:ring-1 focus:ring-primary"
                placeholder="Min"
                type="number"
                value={filters.priceMin}
                onChange={(e) => onChange("priceMin", e.target.value)}
              />
              <input
                className="w-1/2 bg-neutral-accent border-none rounded-lg py-2 px-3 text-sm text-white placeholder:text-neutral-muted outline-none focus:ring-1 focus:ring-primary"
                placeholder="Max"
                type="number"
                value={filters.priceMax}
                onChange={(e) => onChange("priceMax", e.target.value)}
              />
            </div>
          </div>

          {/* Disponibilidad */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                className="rounded bg-neutral-accent border-none text-primary focus:ring-primary"
                type="checkbox"
                checked={filters.soloDisponibles}
                onChange={(e) => onChange("soloDisponibles", e.target.checked)}
              />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                Solo libros disponibles
              </span>
            </label>
          </div>

          {/* Botones */}
          <div className="pt-4 space-y-3">
            <button
              onClick={onApply}
              className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-3 rounded-lg transition-colors"
            >
              Aplicar filtros
            </button>
            <button
              onClick={onClear}
              className="w-full bg-transparent hover:bg-neutral-accent text-neutral-muted border border-neutral-border font-medium py-3 rounded-lg transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default FilterSidebar;