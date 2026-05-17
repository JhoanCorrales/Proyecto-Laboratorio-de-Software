import { useState, useEffect } from "react";
import BookCard from "./BookCard";

const USD_TO_COP = 4000;

async function getDynamicCover(item, retries = 3, usePublisher = true) {
  try {
    const titleQuery = encodeURIComponent(item.titulo || '');
    let url = `https://openlibrary.org/search.json?title=${titleQuery}&limit=1&fields=cover_i`;
    
    if (usePublisher && item.editorial) {
      url += `&publisher=${encodeURIComponent(item.editorial)}`;
    }
    
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.docs && data.docs.length > 0 && data.docs[0].cover_i) {
      return `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-M.jpg`;
    }
    
    if (usePublisher && item.editorial) {
      // Reintentar sin editorial si no encuentra portadas o resultados
      return getDynamicCover(item, retries, false);
    }
    
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return getDynamicCover(item, retries - 1, false);
    }
    
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1500));
      return getDynamicCover(item, retries - 1, usePublisher);
    }
    console.warn("No se pudo cargar la portada dinámicamente", err);
  }
  return item.portada_url || "https://covers.openlibrary.org/b/id/default-M.jpg";
}

async function parseBook(item) {
  const priceRaw = Number(item.priceRaw || 0);
  const imgUrl = await getDynamicCover(item);
  return {
    id: item.id,
    title: item.titulo ?? "Sin título",
    author: item.autor ?? "Autor desconocido",
    price: `$${priceRaw.toLocaleString("es-CO")}`,
    priceRaw: priceRaw,
    img: imgUrl,
    agotado: item.estado === 'agotado' || Number(item.stock_general) === 0,
  };
}

function FeaturedBooks({ onAuthRequired }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async (retryCount = 0, maxRetries = 5) => {
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4003';
        const res = await fetch(`${baseUrl}/api/books/public?limit=5`);
        
        // Verificar si la respuesta fue exitosa
        if (!res.ok) {
          throw new Error(`Error HTTP: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        
        const parsedBooks = await Promise.all((data.docs ?? []).map(parseBook));
        const parsed = parsedBooks.filter(Boolean);
        
        setBooks(parsed);
        setLoading(false);
      } catch (err) {
        console.error(`Error cargando libros destacados (intento ${retryCount + 1}/${maxRetries + 1}):`, err);
        
        if (retryCount < maxRetries) {
          // Backoff exponencial: esperar antes de reintentar
          const delayMs = Math.min(1000 * Math.pow(2, retryCount), 16000);
          console.log(`Reintentando en ${delayMs}ms...`);
          setTimeout(() => fetchBooks(retryCount + 1, maxRetries), delayMs);
        } else {
          // Si se agotan los reintentos, mostrar error
          console.error("No se pudo cargar los libros después de múltiples intentos");
          setLoading(false);
        }
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