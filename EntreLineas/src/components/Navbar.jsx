import { useNavigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { getCurrentUser, logout } from "../services/authService";
import { getCart } from "../services/cartService";

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

function Navbar({ cartCount: cartCountProp }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isRoot, setIsRoot] = useState(false);
  const [user, setUser] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const panelRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get("q") ?? "";
    setQuery(q);
  }, [location.search]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setIsRoot(payload.roles?.includes("Root"));
      } catch {
        setIsRoot(false);
      }
    }
    // Obtener el usuario actual
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    if (cartCountProp != null) {
      setCartCount(cartCountProp);
      return;
    }
    const user = getCurrentUser();
    if (!user) return;
    getCart().then(data => {
      const total = data.items.reduce((acc, i) => acc + i.cantidad, 0);
      setCartCount(total);
    }).catch(() => {});
  }, [cartCountProp]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setPanelOpen(false);
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setProfileMenuOpen(false);
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

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val === "") navigate("/catalogue");
  };

  const handleClear = () => {
    setQuery("");
    navigate("/catalogue");
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

  const handleLogout = () => {
    logout();
    setUser(null);
    setProfileMenuOpen(false);
    navigate("/");
    // Recarga la página para limpiar el contexto completamente
    setTimeout(() => {
      window.location.reload();
    }, 100);
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
        
        {/* Logo y Enlaces */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 text-primary" onClick={() => navigate(isRoot ? "/role-management" : "/home")}>
            <span className="material-symbols-outlined text-3xl shrink-0">menu_book</span>
            <h1 className="text-xl font-bold tracking-tight text-white">Entre Líneas</h1>
          </div>
          {!isRoot && (
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
              <button onClick={() => navigate("/home")} className="hover:text-primary transition-colors">Inicio</button>
              <button onClick={() => navigate("/catalogue")} className="hover:text-primary transition-colors">Catálogo</button>
            </div>
          )}
        </div>

        {/* Buscador y Filtros */}
        {!isRoot && (
          <div className="flex-1 max-w-xl hidden lg:flex items-stretch relative" ref={panelRef}>
            <form onSubmit={handleSearch} className="flex w-full">
              {/* Botón TUNE (Filtros) */}
              <button
                type="button"
                onClick={() => setPanelOpen(!panelOpen)}
                className={`flex items-center px-3 border border-neutral-border border-r-0 rounded-l-lg transition-colors ${panelOpen ? "bg-primary/20 text-primary" : "bg-neutral-dark text-neutral-muted hover:text-white"}`}
              >
                <span className="material-symbols-outlined text-xl">tune</span>
                {activeFiltersCount > 0 && (
                  <span className="ml-1 bg-primary text-background-dark text-[10px] font-bold px-1.5 rounded-full">{activeFiltersCount}</span>
                )}
              </button>

              <div className="relative flex-1">
                <input
                  className="w-full h-full pl-4 pr-20 py-2 bg-neutral-dark border border-neutral-border border-l-0 rounded-r-lg text-sm text-white placeholder-neutral-muted focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Buscar libros, autores..."
                  value={query}
                  onChange={handleQueryChange}
                />
                
                {/* LUPA Y EQUIS (Restauradas) */}
                <div className="absolute right-0 top-0 h-full flex items-center pr-2 gap-1">
                  {query && (
                    <button type="button" onClick={handleClear} className="p-1 text-neutral-muted hover:text-white transition-colors">
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                  <button type="submit" className="p-1 text-neutral-muted hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">search</span>
                  </button>
                </div>
              </div>
            </form>

            {/* PANEL DE FILTROS (RESTAURADO) */}
            {panelOpen && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-neutral-dark border border-neutral-border rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-5 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-muted uppercase tracking-wider">Género</label>
                    <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.query}
                          onClick={() => setSelectedCategory(cat)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory.query === cat.query ? "bg-primary text-background-dark font-bold" : "text-slate-300 hover:bg-neutral-accent"}`}
                        >
                          <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-muted uppercase tracking-wider">Precio ($)</label>
                    <div className="flex gap-3">
                      <input type="number" placeholder="Min" className="w-full bg-neutral-accent border border-neutral-border rounded-lg px-3 py-2 text-sm text-white" value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
                      <input type="number" placeholder="Max" className="w-full bg-neutral-accent border border-neutral-border rounded-lg px-3 py-2 text-sm text-white" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="hidden" checked={soloDisponibles} onChange={(e) => setSoloDisponibles(e.target.checked)} />
                    <div className={`size-5 rounded border flex items-center justify-center transition-colors ${soloDisponibles ? "bg-primary border-primary" : "border-neutral-border group-hover:border-primary/50"}`}>
                      {soloDisponibles && <span className="material-symbols-outlined text-background-dark text-sm font-bold">check</span>}
                    </div>
                    <span className="text-sm text-slate-300">Solo libros disponibles</span>
                  </label>

                  <div className="flex gap-2 pt-2 border-t border-neutral-border/50">
                    <button onClick={handleApply} className="flex-1 bg-primary hover:bg-primary/90 text-background-dark font-bold py-2.5 rounded-lg text-sm">Aplicar</button>
                    <button onClick={handleClearFilters} className="flex-1 bg-neutral-accent hover:bg-neutral-border/30 text-white py-2.5 rounded-lg text-sm">Limpiar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Iconos Derecha */}
        <div className="flex items-center gap-6">
          {isRoot && (
            <button onClick={() => navigate("/role-management")} className="p-2 hover:bg-primary/10 rounded-full transition-colors text-primary" title="Gestión de roles">
              <span className="material-symbols-outlined">admin_panel_settings</span>
            </button>
          )}
          {!isRoot && (
            <button onClick={() => navigate("/cart")} className="p-2 hover:bg-primary/10 rounded-full transition-colors relative text-slate-300">
              <span className="material-symbols-outlined">shopping_cart</span>
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-primary text-background-dark text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
          )}
          
          {/* Menú de Perfil/Login */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="p-2 hover:bg-primary/10 rounded-full transition-colors text-slate-300"
              title={user ? `${user.nombre}` : "Perfil"}
            >
              <span className="material-symbols-outlined">account_circle</span>
            </button>
            
            {/* Dropdown Menu */}
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-neutral-dark border border-neutral-border rounded-xl shadow-2xl z-50 overflow-hidden">
                {user ? (
                  <>
                    {/* Usuario Autenticado */}
                    <div className="px-5 py-4 border-b border-neutral-border/50 bg-neutral-accent/30">
                      <p className="text-sm font-bold text-primary">{user.nombre}</p>
                      <p className="text-xs text-neutral-muted">{user.email}</p>
                    </div>
                    <div className="p-3 space-y-2">
                      <button
                        onClick={() => {
                          navigate("/profile/edit");
                          setProfileMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-neutral-border/50 hover:text-primary rounded-lg transition-colors text-sm"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Editar perfil
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm font-medium"
                      >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Usuario No Autenticado */}
                    <div className="p-3 space-y-2">
                      <button
                        onClick={() => {
                          navigate("/login");
                          setProfileMenuOpen(false);
                        }}
                        className="w-full bg-primary text-background-dark font-bold py-2.5 rounded-lg hover:brightness-110 transition-all text-sm flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">login</span>
                        Iniciar sesión
                      </button>
                      <button
                        onClick={() => {
                          navigate("/register");
                          setProfileMenuOpen(false);
                        }}
                        className="w-full border border-primary text-primary font-bold py-2.5 rounded-lg hover:bg-primary/10 transition-all text-sm flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-lg">person_add</span>
                        Registrarse
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;