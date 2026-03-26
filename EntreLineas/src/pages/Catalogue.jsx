import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import BookCard from "../components/BookCard";

const PAGE_SIZE = 20;
const USD_TO_COP = 4000;

function generateRandomPrice(title = "") {
  const hash = (title).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const base = (hash % 50) + 15;
  return Math.round(base * USD_TO_COP);
}

function parseBook(item) {
  if (!item.cover_i) return null;
  return {
    id: item.key ?? item.title,
    title: item.title ?? "Sin título",
    author: item.author_name?.[0] ?? "Autor desconocido",
    price: `$${generateRandomPrice(item.title).toLocaleString("es-CO")}`,
    priceRaw: generateRandomPrice(item.title),
    img: `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`,
    agotado: false,
  };
}

function Catalogue() {
  const [searchParams] = useSearchParams();
  const debounceRef = useRef(null);

  // ← Inicializar desde URL directamente para evitar doble render al volver de BookDetail
  const initialQ = searchParams.get("q") ?? "";
  const initialCat = searchParams.get("cat");
  const initialPriceMin = searchParams.get("priceMin") ? Number(searchParams.get("priceMin")) : null;
  const initialPriceMax = searchParams.get("priceMax") ? Number(searchParams.get("priceMax")) : null;
  const initialDisponibles = searchParams.get("disponibles") === "1";

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(initialQ);
  const [inputValue, setInputValue] = useState(initialQ);
  const [activeCategory, setActiveCategory] = useState(
    initialCat
      ? { label: "Filtro", query: initialCat }
      : { label: "Todos", query: "fiction" }
  );
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [priceMin, setPriceMin] = useState(initialPriceMin);
  const [priceMax, setPriceMax] = useState(initialPriceMax);
  const [soloDisponibles, setSoloDisponibles] = useState(initialDisponibles);

  const buildUrl = useCallback(
    (pageNum) => {
      const q = search.trim() || activeCategory.query || "fiction";
      const olParams = `q=${encodeURIComponent(q)}&limit=${PAGE_SIZE}&page=${pageNum}&fields=key,title,author_name,cover_i,isbn,first_publish_year`;
      return `http://localhost:4003/api/auth/openlibrary?q=${encodeURIComponent(olParams)}&type=search`;
    },
    [search, activeCategory]
  );

  // Solo maneja cambios posteriores de URL (cuando el usuario aplica filtros desde Navbar)
  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    const cat = searchParams.get("cat");
    const min = searchParams.get("priceMin");
    const max = searchParams.get("priceMax");
    const disponibles = searchParams.get("disponibles");

    setInputValue(q);
    setSearch(q);

    if (cat) {
      setActiveCategory({ label: "Filtro", query: cat });
    } else if (!q) {
      setActiveCategory({ label: "Todos", query: "fiction" });
    }

    setPriceMin(min ? Number(min) : null);
    setPriceMax(max ? Number(max) : null);
    setSoloDisponibles(disponibles === "1");
  }, [searchParams]);

  // Carga inicial / cuando cambia búsqueda o categoría
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError("");
      setPage(1);
      setHasMore(true);

      try {
        const res = await fetch(buildUrl(1));
        if (!res.ok) throw new Error("Error al obtener libros");
        const data = await res.json();

        const parsed = (data.docs ?? [])
          .map(parseBook)
          .filter(Boolean)
          .slice(0, PAGE_SIZE);

        setBooks(parsed);
        setTotalResults(parsed.length);
        setHasMore((data.docs ?? []).length >= PAGE_SIZE);
      } catch (err) {
        console.error("Error al cargar libros:", err);
        setError("No se pudieron cargar los libros. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [search, activeCategory, buildUrl]);

  // Cargar más
  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    setError("");

    try {
      const res = await fetch(buildUrl(nextPage));
      if (!res.ok) throw new Error("Error al cargar más libros");
      const data = await res.json();

      const parsed = (data.docs ?? [])
        .map(parseBook)
        .filter(Boolean)
        .slice(0, PAGE_SIZE);

      setBooks((prev) => [...prev, ...parsed]);
      setPage(nextPage);
      setHasMore((data.docs ?? []).length >= PAGE_SIZE);
    } catch (err) {
      setError("Error al cargar más libros. Intenta de nuevo.");
    } finally {
      setLoadingMore(false);
    }
  };

  // Búsqueda dinámica con debounce
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setActiveCategory({ label: "Todos", query: "fiction" });
    }, 500);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearch(inputValue);
    setActiveCategory({ label: "Todos", query: "fiction" });
  };

  // Filtros locales de precio y disponibilidad
  const displayBooks = books.filter((book) => {
    if (priceMin !== null && book.priceRaw < priceMin) return false;
    if (priceMax !== null && book.priceRaw > priceMax) return false;
    if (soloDisponibles && book.agotado) return false;
    return true;
  });

  const hayFiltrosLocales = priceMin !== null || priceMax !== null || soloDisponibles;

  return (
    <div className="bg-background-dark font-display text-slate-100 min-h-screen relative">
      <div
        className="fixed inset-0 z-0 opacity-10 pointer-events-none bg-cover bg-center"
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBbG1b3Kwed1viGb7hKEkzSI9Ya9U9be5hu5NQZsUvwatQXmYpZTIMwI2a7qGjkT2X2naUx-_V0BdBTHjQhKQwcSvZmZQPsBLzZO_YY97Rya_4tHHaPxQ2ZAk_q2XF6nQCtGEE3xY0327mCAYErSBV5GxJmPvCbl36RKE9wyXcaC2DCkL3l-HWtRCfmUOYOgwoyF3tNbg5N9KS0WOJDaEgzudhwTIQEhROyGytvAQLNGFOfnye6oKEzWRhtmJJBdcUIS-0We10ybak')" }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        {/* Búsqueda móvil */}
        <div className="md:hidden px-6 py-4 bg-background-dark/60">
          <form onSubmit={handleSearch} className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              className="w-full bg-neutral-dark border border-neutral-border rounded-lg py-2 pl-10 pr-4 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="Buscar libros..."
              value={inputValue}
              onChange={handleInputChange}
            />
          </form>
        </div>

        <main className="px-6 md:px-20 py-6 flex-1">
          <div className="mb-6">
            <p className="text-neutral-muted text-sm font-medium uppercase tracking-widest">
              {search
                ? `Mostrando resultados para "${search}"`
                : `Categoría: ${activeCategory.label}`}
            </p>
            <h3 className="text-slate-100 text-2xl font-bold mt-1">
              {loading
                ? "Buscando libros, esto puede tardar unos momentos..."
                : `${displayBooks.length.toLocaleString()} libros encontrados`}
            </h3>
          </div>

          {error && (
            <div className="p-4 bg-red-900/30 text-red-400 rounded-lg border border-red-600/30 mb-6">
              {error}
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="flex flex-col bg-neutral-dark border border-neutral-border rounded-xl overflow-hidden animate-pulse">
                  <div className="aspect-[3/4] bg-neutral-border/40" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-neutral-border/40 rounded w-3/4" />
                    <div className="h-3 bg-neutral-border/40 rounded w-1/2" />
                    <div className="h-6 bg-neutral-border/40 rounded w-1/3 mt-2" />
                    <div className="h-9 bg-neutral-border/40 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && displayBooks.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {displayBooks.map((book, i) => (
                <BookCard key={`${book.id}-${i}`} {...book} />
              ))}
            </div>
          )}

          {!loading && displayBooks.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-neutral-muted">
              <span className="material-symbols-outlined text-6xl">search_off</span>
              <p className="text-lg font-semibold">No se encontraron libros</p>
              <p className="text-sm">
                {hayFiltrosLocales
                  ? "Ningún libro coincide con los filtros aplicados"
                  : "Intenta con otro término o categoría"}
              </p>
            </div>
          )}

          {!loading && hasMore && displayBooks.length > 0 && !hayFiltrosLocales && (
            <div className="flex justify-center mt-12 mb-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 text-neutral-muted hover:text-primary transition-colors font-medium disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    Cargar más libros
                    <span className="material-symbols-outlined">expand_more</span>
                  </>
                )}
              </button>
            </div>
          )}
        </main>

        <footer className="border-t border-neutral-border bg-background-dark/95 py-8 px-6 md:px-20">
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

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default Catalogue;