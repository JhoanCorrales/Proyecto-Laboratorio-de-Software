import { useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

const CATEGORIES = [
  { label: "Todos los géneros", query: "fiction", icon: "filter_list" },
  { label: "Ficción", query: "subject:fiction", icon: "auto_stories" },
  { label: "No Ficción", query: "subject:nonfiction", icon: "history_edu" },
  { label: "Ciencia Ficción", query: "subject:science_fiction", icon: "rocket" },
  { label: "Fantasía", query: "subject:fantasy", icon: "nights_stay" },
  { label: "Misterio", query: "subject:mystery", icon: "mystery" },
  { label: "Thriller", query: "subject:thriller", icon: "local_fire_department" },
  { label: "Romance", query: "subject:romance", icon: "favorite" },
  { label: "Terror", query: "subject:horror", icon: "skull" },
  { label: "Biografías", query: "subject:biography", icon: "person_book" },
  { label: "Historia", query: "subject:history", icon: "history" },
  { label: "Ciencia", query: "subject:science", icon: "science" },
  { label: "Filosofía", query: "subject:philosophy", icon: "psychology" },
  { label: "Psicología", query: "subject:psychology", icon: "neurology" },
  { label: "Autoayuda", query: "subject:self-help", icon: "self_improvement" },
  { label: "Infantil", query: "subject:children", icon: "child_care" },
  { label: "Juvenil", query: "subject:young_adult", icon: "school" },
  { label: "Poesía", query: "subject:poetry", icon: "stylus_note" },
  { label: "Drama", query: "subject:drama", icon: "theater_comedy" },
  { label: "Cómics", query: "subject:comics", icon: "collections_bookmark" },
  { label: "Cocina", query: "subject:cooking", icon: "restaurant" },
  { label: "Viajes", query: "subject:travel", icon: "travel_explore" },
  { label: "Arte", query: "subject:art", icon: "palette" },
  { label: "Tecnología", query: "subject:technology", icon: "computer" },
  { label: "Negocios", query: "subject:business", icon: "business_center" },
];

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const panelRef = useRef(null);

  // Sincronizar el texto del buscador con la URL al navegar
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") ?? "";
    setQuery(q);
  }, [location.search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const buildParams = () => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    else params.set("cat", selectedCategory.query);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    if (soloDisponibles) params.set("disponibles", "1");
    return params.toString();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/catalogue?${buildParams()}`);
    setPanelOpen(false);
  };

  // Al cambiar el input — si se borra todo, vuelve al catálogo limpio
  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val === "") {
      navigate("/catalogue");
    }
  };

  // Botón X — borra texto y vuelve al catálogo limpio
  const handleClear = () => {
    setQuery("");
    navigate("/catalogue");
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
  };

  const handleApply = () => {
    navigate(`/catalogue?${buildParams()}`);
    setPanelOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedCategory(CATEGORIES[0]);
    setPriceMin("");
    setPriceMax("");
    setSoloDisponibles(false);
    setQuery("");
    setPanelOpen(false);
    navigate("/catalogue");
  };

  const activeFiltersCount = [
    selectedCategory.query !== "fiction",
    priceMin,
    priceMax,
    soloDisponibles,
  ].filter(Boolean).length;

  return (
    <nav className="sticky top-0 z-50 border-b border-primary/10 bg-background-dark/80 backdrop-blur-md px-6 lg:px-20 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">

        {/* Logo */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-primary">
            <span className="material-symbols-outlined text-3xl shrink-0">menu_book</span>
            <h1 className="text-xl font-bold tracking-tight text-white">Entre Líneas</h1>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a className="text-sm font-medium text-slate-300 hover:text-primary transition-colors" href="/home">Inicio</a>
            <a className="text-sm font-medium text-slate-300 hover:text-primary transition-colors" href="/catalogue">Catálogo</a>
          </div>
        </div>

        {/* Buscador — solo desktop */}
        <div className="flex-1 max-w-xl hidden lg:flex items-stretch relative" ref={panelRef}>
          <form onSubmit={handleSearch} className="flex w-full">

            {/* Botón filtro */}
            <button
              type="button"
              onClick={() => setPanelOpen((v) => !v)}
              className={`relative flex items-center justify-center px-3 border border-neutral-border border-r-0 rounded-l-lg transition-colors
                ${panelOpen ? "bg-primary/20 text-primary" : "bg-neutral-dark text-neutral-muted hover:text-white"}`}
            >
              <span className="material-symbols-outlined text-xl">tune</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-background-dark text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Input con X y lupa a la derecha */}
            <div className="relative flex-1">
              <input
                className="w-full h-full pl-4 pr-20 py-2 bg-neutral-dark border border-neutral-border border-l-0 rounded-r-lg text-sm text-white placeholder-neutral-muted focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder="Buscar libros, autores..."
                value={query}
                onChange={handleQueryChange}
              />

              {/* Iconos derecha del input */}
              <div className="absolute right-0 top-0 h-full flex items-center pr-2 gap-1">
                {/* X — solo si hay texto */}
                {query && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 text-neutral-muted hover:text-white transition-colors rounded"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                )}
                {/* Lupa — siempre visible, hace submit */}
                <button
                  type="submit"
                  className="p-1 text-neutral-muted hover:text-primary transition-colors rounded"
                >
                  <span className="material-symbols-outlined text-lg">search</span>
                </button>
              </div>
            </div>
          </form>

          {/* Panel desplegable */}
          {panelOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-neutral-dark border border-neutral-border rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-5 space-y-5">

                <div className="flex items-center justify-between">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">tune</span>
                    Filtros
                  </h3>
                  <button
                    type="button"
                    onClick={() => setPanelOpen(false)}
                    className="text-neutral-muted hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>

                {/* Categorías */}
                <div>
                  <p className="text-neutral-muted text-xs font-bold uppercase tracking-wider mb-2">
                    Categoría
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.query}
                        type="button"
                        onClick={() => handleCategorySelect(cat)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left
                          ${selectedCategory.query === cat.query
                            ? "bg-primary/20 text-primary"
                            : "text-slate-300 hover:bg-neutral-accent hover:text-white"
                          }`}
                      >
                        <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rango de precio */}
                <div>
                  <p className="text-neutral-muted text-xs font-bold uppercase tracking-wider mb-2">
                    Rango de precio (COP)
                  </p>
                  <div className="flex gap-2">
                    <input
                      className="w-1/2 bg-neutral-accent border-none rounded-lg py-2 px-3 text-sm text-white placeholder:text-neutral-muted outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Mín"
                      type="number"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                    />
                    <input
                      className="w-1/2 bg-neutral-accent border-none rounded-lg py-2 px-3 text-sm text-white placeholder:text-neutral-muted outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Máx"
                      type="number"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                    />
                  </div>
                </div>

                {/* Disponibilidad */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    className="rounded bg-neutral-accent border-none text-primary focus:ring-primary"
                    type="checkbox"
                    checked={soloDisponibles}
                    onChange={(e) => setSoloDisponibles(e.target.checked)}
                  />
                  <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                    Solo libros disponibles
                  </span>
                </label>

                {/* Botones */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleApply}
                    className="flex-1 bg-primary hover:bg-primary/90 text-background-dark font-bold py-2.5 rounded-lg text-sm transition-colors"
                  >
                    Aplicar
                  </button>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="flex-1 bg-transparent hover:bg-neutral-accent text-neutral-muted border border-neutral-border font-medium py-2.5 rounded-lg text-sm transition-colors"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Iconos derecha */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-primary/10 rounded-full transition-colors relative">
            <span className="material-symbols-outlined">shopping_cart</span>
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-background-dark">3</span>
          </button>
          <button
            onClick={() => navigate("/profile/edit")}
            className="p-2 hover:bg-primary/10 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;