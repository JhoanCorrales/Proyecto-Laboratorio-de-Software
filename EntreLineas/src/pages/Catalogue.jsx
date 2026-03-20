import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import BookCard from "../components/BookCard";

const PAGE_SIZE = 20;

const CATEGORIES = [
  { label: "Todos", query: "libros" },
  { label: "Ficción", query: "subject:fiction" },
  { label: "No Ficción", query: "subject:nonfiction" },
  { label: "Ciencia Ficción", query: "subject:science+fiction" },
  { label: "Fantasía", query: "subject:fantasy" },
  { label: "Misterio", query: "subject:mystery" },
  { label: "Autoayuda", query: "subject:self-help" },
  { label: "Infantil", query: "subject:juvenile" },
  { label: "Historia", query: "subject:history" },
];

function parseBook(item) {
  const info = item.volumeInfo ?? {};
  return {
    id: item.id,
    title: info.title ?? "Sin título",
    author: info.authors?.[0] ?? "Autor desconocido",
    price: `$${((info.pageCount ?? 200) % 50 + 10).toFixed(2)}`,
    img: info.imageLinks?.thumbnail?.replace("http://", "https://") ?? null,
    agotado: false,
  };
}

function Catalogue() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);

  const [searchParams] = useSearchParams();

  const buildUrl = useCallback(
    (pageNum) => {
      const base = "https://www.googleapis.com/books/v1/volumes";
      const q = search.trim() || activeCategory.query;
      const params = new URLSearchParams({
        q,
        maxResults: PAGE_SIZE,
        startIndex: (pageNum - 1) * PAGE_SIZE,
        printType: "books",
        langRestrict: "es",
      });
      return `${base}?${params}`;
    },
    [search, activeCategory]
  );

  // Leer query de la URL al montar
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setInputValue(q);
      setSearch(q);
    }
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

        const parsed = (data.items ?? [])
          .filter((d) => d.volumeInfo?.imageLinks?.thumbnail)
          .map(parseBook);

        setBooks(parsed);
        setTotalResults(data.totalItems ?? 0);
        setHasMore(parsed.length === PAGE_SIZE);
      } catch (err) {
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

      const parsed = (data.items ?? [])
        .filter((d) => d.volumeInfo?.imageLinks?.thumbnail)
        .map(parseBook);

      setBooks((prev) => [...prev, ...parsed]);
      setPage(nextPage);
      setHasMore(parsed.length === PAGE_SIZE);
    } catch (err) {
      setError("Error al cargar más libros. Intenta de nuevo.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(inputValue);
    setActiveCategory(CATEGORIES[0]);
  };

  const handleCategory = (cat) => {
    setActiveCategory(cat);
    setSearch("");
    setInputValue("");
  };

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
              onChange={(e) => setInputValue(e.target.value)}
            />
          </form>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 px-6 md:px-20 py-4 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.label}
              onClick={() => handleCategory(cat)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors
                ${activeCategory.label === cat.label && !search
                  ? "bg-primary text-background-dark"
                  : "bg-neutral-dark border border-neutral-border text-slate-300 hover:text-white"
                }`}
            >
              {cat.label === "Todos" && (
                <span className="material-symbols-outlined text-sm">filter_list</span>
              )}
              {cat.label}
            </button>
          ))}
        </div>

        <main className="px-6 md:px-20 py-6 flex-1">
          {/* Encabezado */}
          <div className="mb-6">
            <p className="text-neutral-muted text-sm font-medium uppercase tracking-widest">
              {search
                ? `Mostrando resultados para "${search}"`
                : `Categoría: ${activeCategory.label}`}
            </p>
            <h3 className="text-slate-100 text-2xl font-bold mt-1">
              {loading
                ? "Buscando libros..."
                : `${totalResults.toLocaleString()} libros encontrados`}
            </h3>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-900/30 text-red-400 rounded-lg border border-red-600/30 mb-6">
              {error}
            </div>
          )}

          {/* Skeleton */}
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

          {/* Grid */}
          {!loading && books.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {books.map((book, i) => (
                <BookCard key={`${book.id}-${i}`} {...book} />
              ))}
            </div>
          )}

          {/* Sin resultados */}
          {!loading && books.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-neutral-muted">
              <span className="material-symbols-outlined text-6xl">search_off</span>
              <p className="text-lg font-semibold">No se encontraron libros</p>
              <p className="text-sm">Intenta con otro término o categoría</p>
            </div>
          )}

          {/* Cargar más */}
          {!loading && hasMore && books.length > 0 && (
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
              <span className="material-symbols-outlined">auto_stories</span>
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