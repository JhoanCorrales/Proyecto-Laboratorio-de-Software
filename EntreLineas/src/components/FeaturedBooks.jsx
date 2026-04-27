import { useState, useEffect } from "react";
import BookCard from "./BookCard";

const USD_TO_COP = 4000;

function generateRandomPrice(title = "") {
  const hash = title.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
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
    img: `https://covers.openlibrary.org/b/id/${item.cover_i}-M.jpg`,
    agotado: false,
  };
}

function FeaturedBooks({ onAuthRequired }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch(
          "https://openlibrary.org/search.json?q=bestseller&limit=20&fields=key,title,author_name,cover_i"
        );
        const data = await res.json();
        const parsed = (data.docs ?? [])
          .map(parseBook)
          .filter(Boolean)
          .slice(0, 5);
        setBooks(parsed);
      } catch (err) {
        console.error("Error cargando libros destacados:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
      <div className="flex items-end justify-between mb-12">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Libros Destacados
          </h2>
          <p className="text-neutral-muted">
            Las lecturas que están marcando tendencia este mes.
          </p>
        </div>
        <a
          className="text-primary font-semibold flex items-center gap-1 hover:underline"
          href="/catalogue"
        >
          Ver todos{" "}
          <span className="material-symbols-outlined">chevron_right</span>
        </a>
      </div>

      {/* Skeleton mientras carga */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col bg-neutral-dark border border-neutral-border rounded-xl overflow-hidden animate-pulse"
            >
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

      {/* Grid de libros */}
      {!loading && books.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {books.map((book, i) => (
            <BookCard key={`${book.id}-${i}`} {...book} onAuthRequired={onAuthRequired} />
          ))}
        </div>
      )}

      {/* Fallback si no cargó nada */}
      {!loading && books.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-neutral-muted">
          <span className="material-symbols-outlined text-5xl">menu_book</span>
          <p className="text-sm">No se pudieron cargar los libros destacados.</p>
        </div>
      )}
    </section>
  );
}

export default FeaturedBooks;