import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

// Mapeo de nombre de categoría a query de Open Library
const QUERY_MAP = {
  "Ficción": "subject:fiction",
  "No Ficción": "subject:nonfiction",
  "Ciencia Ficción": "subject:science_fiction",
  "Fantasía": "subject:fantasy",
  "Misterio": "subject:mystery",
  "Thriller": "subject:thriller",
  "Romance": "subject:romance",
  "Terror": "subject:horror",
  "Biografías": "subject:biography",
  "Historia": "subject:history",
  "Ciencia": "subject:science",
  "Filosofía": "subject:philosophy",
  "Psicología": "subject:psychology",
  "Autoayuda": "subject:self-help",
  "Infantil": "subject:children",
  "Juvenil": "subject:young_adult",
  "Poesía": "subject:poetry",
  "Drama": "subject:drama",
  "Cómics": "subject:comics",
  "Cocina": "subject:cooking",
  "Viajes": "subject:travel",
  "Arte": "subject:art",
  "Tecnología": "subject:technology",
  "Negocios": "subject:business",
  "Técnico": "subject:technology",
};

// Mapeo de nombre a icono Material Symbols
const ICON_MAP = {
  "Ficción": "auto_stories",
  "No Ficción": "history_edu",
  "Ciencia Ficción": "rocket",
  "Fantasía": "nights_stay",
  "Misterio": "mystery",
  "Thriller": "local_fire_department",
  "Romance": "favorite",
  "Terror": "skull",
  "Biografías": "person_book",
  "Historia": "history",
  "Ciencia": "science",
  "Filosofía": "psychology",
  "Psicología": "neurology",
  "Autoayuda": "self_improvement",
  "Infantil": "child_care",
  "Juvenil": "school",
  "Poesía": "stylus_note",
  "Drama": "theater_comedy",
  "Cómics": "collections_bookmark",
  "Cocina": "restaurant",
  "Viajes": "travel_explore",
  "Arte": "palette",
  "Tecnología": "computer",
  "Negocios": "business_center",
  "Técnico": "code",
};

// Colores por categoría
const COLOR_MAP = {
  "Ficción": "bg-primary/40 hover:bg-primary/60",
  "No Ficción": "bg-blue-500/40 hover:bg-blue-500/60",
  "Ciencia Ficción": "bg-indigo-500/40 hover:bg-indigo-500/60",
  "Fantasía": "bg-violet-500/40 hover:bg-violet-500/60",
  "Misterio": "bg-orange-500/40 hover:bg-orange-500/60",
  "Thriller": "bg-red-700/40 hover:bg-red-700/60",
  "Romance": "bg-pink-500/40 hover:bg-pink-500/60",
  "Terror": "bg-gray-700/40 hover:bg-gray-700/60",
  "Biografías": "bg-yellow-600/40 hover:bg-yellow-600/60",
  "Historia": "bg-purple-500/40 hover:bg-purple-500/60",
  "Ciencia": "bg-emerald-500/40 hover:bg-emerald-500/60",
  "Filosofía": "bg-teal-500/40 hover:bg-teal-500/60",
  "Psicología": "bg-cyan-500/40 hover:bg-cyan-500/60",
  "Autoayuda": "bg-lime-500/40 hover:bg-lime-500/60",
  "Infantil": "bg-amber-400/40 hover:bg-amber-400/60",
  "Juvenil": "bg-sky-500/40 hover:bg-sky-500/60",
  "Poesía": "bg-rose-400/40 hover:bg-rose-400/60",
  "Drama": "bg-fuchsia-500/40 hover:bg-fuchsia-500/60",
  "Cómics": "bg-yellow-400/40 hover:bg-yellow-400/60",
  "Cocina": "bg-orange-400/40 hover:bg-orange-400/60",
  "Viajes": "bg-green-500/40 hover:bg-green-500/60",
  "Arte": "bg-pink-400/40 hover:bg-pink-400/60",
  "Tecnología": "bg-blue-600/40 hover:bg-blue-600/60",
  "Negocios": "bg-slate-500/40 hover:bg-slate-500/60",
  "Técnico": "bg-neutral-500/40 hover:bg-neutral-500/60",
};

function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:4003/api/auth/categories", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Error al cargar categorías");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        setError("No se pudieron cargar las categorías.");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryClick = (nombre) => {
    const query = QUERY_MAP[nombre] ?? `subject:${nombre.toLowerCase()}`;
    navigate(`/catalogue?cat=${encodeURIComponent(query)}`);
  };

  return (
    <div className="bg-background-dark font-display text-slate-100 min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 lg:px-20 py-12">
        <div className="mb-10">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-1 text-neutral-muted hover:text-primary transition-colors text-sm mb-6"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver al inicio
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Todas las Categorías</h1>
          <p className="text-neutral-muted">Explora nuestra colección completa por género</p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-900/30 text-red-400 rounded-lg border border-red-600/30 mb-6">
            {error}
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-neutral-dark animate-pulse" />
            ))}
          </div>
        )}

        {/* Grid de categorías */}
        {!loading && categories.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.nombre)}
                className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${COLOR_MAP[cat.nombre] ?? "bg-slate-600/40 hover:bg-slate-600/60"}`}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 gap-2">
                  <span className="material-symbols-outlined text-4xl text-white">
                    {ICON_MAP[cat.nombre] ?? "menu_book"}
                  </span>
                  <span className="font-bold text-white text-center text-sm leading-tight">
                    {cat.nombre}
                  </span>
                  {cat.descripcion && (
                    <span className="text-white/70 text-xs text-center leading-tight hidden group-hover:block">
                      {cat.descripcion}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-neutral-border bg-background-dark/95 py-8 px-6 md:px-20 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-neutral-muted">
            <span className="material-symbols-outlined">menu_book</span>
            <span className="font-bold">Entre Líneas</span>
            <span className="mx-2">|</span>
            <span className="text-xs">© 2026 Todos los derechos reservados.</span>
          </div>
          <div className="flex gap-6">
            <a className="text-neutral-muted hover:text-primary transition-colors text-sm" href="#">Privacidad</a>
            <a className="text-neutral-muted hover:text-primary transition-colors text-sm" href="#">Términos</a>
            <a className="text-neutral-muted hover:text-primary transition-colors text-sm" href="#">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Categories;