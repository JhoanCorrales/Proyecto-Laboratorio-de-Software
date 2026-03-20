import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function StarRating({ rating }) {
  return (
    <div className="flex items-center text-primary">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half = !filled && rating >= star - 0.5;
        return (
          <span key={star} className="material-symbols-outlined fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>
            {filled ? "star" : half ? "star_half" : "star_outline"}
          </span>
        );
      })}
    </div>
  );
}

function RelatedBookCard({ book }) {
  const navigate = useNavigate();
  const img = book.volumeInfo?.imageLinks?.thumbnail?.replace("http://", "https://");
  const title = book.volumeInfo?.title ?? "Sin título";
  const author = book.volumeInfo?.authors?.[0] ?? "Autor desconocido";
  const price = `$${((book.volumeInfo?.pageCount ?? 200) % 50 + 10).toFixed(2)}`;

  if (!img) return null;

  return (
    <div
      className="group flex flex-col gap-3 cursor-pointer"
      onClick={() => navigate(`/catalogue/${encodeURIComponent(title)}/details`, { state: { bookId: book.id } })}
    >
      <div
        className="aspect-[3/4] bg-cover bg-center rounded-lg shadow-md group-hover:shadow-primary/20 group-hover:scale-[1.02] transition-all border border-neutral-border"
        style={{ backgroundImage: `url('${img}')` }}
      />
      <div>
        <h4 className="text-white font-bold truncate">{title}</h4>
        <p className="text-neutral-muted text-sm">{author}</p>
        <p className="text-primary font-bold mt-1">{price}</p>
      </div>
    </div>
  );
}

function SkeletonDetail() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
        <div className="md:col-span-5">
          <div className="aspect-[3/4] bg-neutral-border/40 rounded-xl" />
        </div>
        <div className="md:col-span-7 flex flex-col gap-4">
          <div className="h-6 bg-neutral-border/40 rounded w-1/4" />
          <div className="h-10 bg-neutral-border/40 rounded w-3/4" />
          <div className="h-5 bg-neutral-border/40 rounded w-1/2" />
          <div className="h-4 bg-neutral-border/40 rounded w-1/3" />
          <div className="h-20 bg-neutral-border/40 rounded w-full mt-4" />
          <div className="h-14 bg-neutral-border/40 rounded w-full mt-4" />
        </div>
      </div>
    </div>
  );
}

function BookDetail() {
  const { bookTitle } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImg, setSelectedImg] = useState(null);

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      setError("");

      try {
        // Buscar el libro por título en Google Books
        const res = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(bookTitle)}&maxResults=1&printType=books`
        );
        if (!res.ok) throw new Error("Error al obtener el libro");
        const data = await res.json();

        if (!data.items?.length) throw new Error("Libro no encontrado");

        const item = data.items[0];
        setBook(item);

        const info = item.volumeInfo;
        const mainImg =
          info.imageLinks?.extraLarge ||
          info.imageLinks?.large ||
          info.imageLinks?.medium ||
          info.imageLinks?.thumbnail;
        setSelectedImg(mainImg?.replace("http://", "https://") ?? null);

        // Libros relacionados por autor o categoría
        const relatedQuery = info.authors?.[0] ?? info.categories?.[0] ?? bookTitle;
        const relRes = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(relatedQuery)}&maxResults=8&printType=books`
        );
        const relData = await relRes.json();
        const filtered = (relData.items ?? [])
          .filter((b) => b.id !== item.id && b.volumeInfo?.imageLinks?.thumbnail)
          .slice(0, 5);
        setRelated(filtered);
      } catch (err) {
        setError("No se pudo cargar la información del libro.");
      } finally {
        setLoading(false);
      }
    };

    if (bookTitle) fetchBook();
  }, [bookTitle]);

  const info = book?.volumeInfo ?? {};
  const price = `$${((info.pageCount ?? 200) % 50 + 10).toFixed(2)}`;
  const originalPrice = `$${((info.pageCount ?? 200) % 50 + 10 + 7).toFixed(2)}`;
  const rating = info.averageRating ?? 4;
  const ratingsCount = info.ratingsCount ?? 0;
  const stock = Math.floor((info.pageCount ?? 300) % 20) + 5;

  const thumbnails = [
    info.imageLinks?.thumbnail,
    info.imageLinks?.small,
    info.imageLinks?.medium,
    info.imageLinks?.large,
  ]
    .filter(Boolean)
    .map((u) => u.replace("http://", "https://"));

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      <Navbar />

      <main className="max-w-[1200px] mx-auto w-full px-4 md:px-10 py-6">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap gap-2 py-4 mb-4 items-center">
          <Link className="text-neutral-muted hover:text-primary text-sm font-medium transition-colors" to="/home">
            Inicio
          </Link>
          <span className="text-neutral-muted material-symbols-outlined text-[14px]">chevron_right</span>
          <Link className="text-neutral-muted hover:text-primary text-sm font-medium transition-colors" to="/catalogue">
            Catálogo
          </Link>
          <span className="text-neutral-muted material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-slate-900 dark:text-white text-sm font-semibold truncate max-w-[200px]">
            {loading ? "Cargando..." : info.title ?? bookTitle}
          </span>
        </nav>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-900/30 text-red-400 rounded-lg border border-red-600/30 mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            {error}
            <button
              onClick={() => navigate("/catalogue")}
              className="ml-auto text-sm underline hover:text-red-300"
            >
              Volver al catálogo
            </button>
          </div>
        )}

        {loading && <SkeletonDetail />}

        {!loading && book && (
          <>
            {/* Título móvil */}
            <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white md:hidden">
              {info.title}
            </h1>

            {/* Grid principal */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
              {/* Columna izquierda — imagen */}
              <div className="md:col-span-5 flex flex-col gap-4">
                <div className="relative group">
                  <div
                    className="w-full bg-center bg-no-repeat aspect-[3/4] bg-cover rounded-xl shadow-2xl border border-slate-200 dark:border-neutral-border"
                    style={{ backgroundImage: selectedImg ? `url('${selectedImg}')` : "none" }}
                  >
                    {!selectedImg && (
                      <div className="w-full h-full flex items-center justify-center bg-neutral-dark rounded-xl">
                        <span className="material-symbols-outlined text-6xl text-neutral-muted">menu_book</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary text-background-dark text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                      {stock > 0 ? "Disponible" : "Agotado"}
                    </span>
                  </div>
                </div>

                {/* Thumbnails */}
                {thumbnails.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {thumbnails.map((url, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedImg(url)}
                        className={`aspect-square rounded-lg bg-cover bg-center cursor-pointer transition-opacity
                          ${selectedImg === url
                            ? "border-2 border-primary"
                            : "border border-neutral-border opacity-70 hover:opacity-100"
                          }`}
                        style={{ backgroundImage: `url('${url}')` }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Columna derecha — info */}
              <div className="md:col-span-7 flex flex-col">
                <div className="hidden md:block mb-2">
                  <span className="text-primary font-medium tracking-wide uppercase text-sm">
                    {info.categories?.[0] ?? "Literatura"}
                  </span>
                  <h1 className="text-4xl lg:text-5xl font-extrabold mt-1 text-slate-900 dark:text-white">
                    {info.title}
                  </h1>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                  {/* Autor */}
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-muted text-lg">Autor:</span>
                    <span className="text-slate-900 dark:text-slate-100 font-semibold text-lg underline decoration-primary/50">
                      {info.authors?.[0] ?? "Desconocido"}
                    </span>
                  </div>

                  {/* Rating y stock */}
                  <div className="flex items-center gap-6 py-2">
                    <div className="flex items-center gap-2">
                      <StarRating rating={rating} />
                      <span className="text-neutral-muted font-medium">
                        ({ratingsCount > 0 ? `${ratingsCount} reseñas` : "Sin reseñas"})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-muted">
                      <span className="material-symbols-outlined text-green-500">inventory_2</span>
                      <span className="font-medium">{stock} unidades en stock</span>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-y-4 py-6 border-y border-slate-200 dark:border-neutral-border">
                    <div className="flex flex-col">
                      <span className="text-neutral-muted text-xs uppercase font-bold tracking-tighter">Editorial</span>
                      <span className="text-slate-900 dark:text-slate-100 font-medium">
                        {info.publisher ?? "No disponible"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-neutral-muted text-xs uppercase font-bold tracking-tighter">Género</span>
                      <span className="text-slate-900 dark:text-slate-100 font-medium">
                        {info.categories?.[0] ?? "No disponible"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-neutral-muted text-xs uppercase font-bold tracking-tighter">ISBN</span>
                      <span className="text-slate-900 dark:text-slate-100 font-medium">
                        {info.industryIdentifiers?.[0]?.identifier ?? "No disponible"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-neutral-muted text-xs uppercase font-bold tracking-tighter">Idioma</span>
                      <span className="text-slate-900 dark:text-slate-100 font-medium">
                        {info.language === "es" ? "Español" : info.language === "en" ? "Inglés" : info.language ?? "No disponible"}
                      </span>
                    </div>
                  </div>

                  {/* Precio */}
                  <div className="py-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-primary">{price}</span>
                      <span className="text-neutral-muted line-through text-xl">{originalPrice}</span>
                    </div>
                    <p className="text-green-500 text-sm font-semibold mt-1">¡Precio especial hoy!</p>
                  </div>

                  {/* Botones */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button className="flex-1 bg-primary hover:bg-primary/90 text-background-dark font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined">shopping_cart</span>
                      Agregar al carrito
                    </button>
                    <button className="flex-1 bg-primary hover:bg-primary/90 text-background-dark font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined">payments</span>
                      Comprar ahora
                    </button>
                  </div>
                  <button className="w-full border-2 border-primary text-primary hover:bg-primary/10 font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined">bookmark</span>
                    Reservar libro
                  </button>
                </div>
              </div>
            </div>

            {/* Sección inferior */}
            <div className="mt-16 bg-slate-100 dark:bg-neutral-dark rounded-xl p-8 border border-slate-200 dark:border-neutral-border/50">
              {/* Sinopsis */}
              <div className="mb-10">
                <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">description</span>
                  Sinopsis del libro
                </h3>
                <p className="text-slate-700 dark:text-neutral-muted leading-relaxed text-lg max-w-4xl">
                  {info.description
                    ? info.description.replace(/<[^>]*>/g, "") // quita HTML tags que a veces viene de la API
                    : "No hay sinopsis disponible para este libro."}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-12">
                {/* Especificaciones */}
                <div>
                  <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">fact_check</span>
                    Especificaciones Técnicas
                  </h3>
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-200 dark:divide-neutral-border">
                      {[
                        ["Número de páginas", info.pageCount ? `${info.pageCount} páginas` : "No disponible"],
                        ["Idioma", info.language === "es" ? "Español" : info.language === "en" ? "Inglés" : info.language ?? "No disponible"],
                        ["Fecha de publicación", info.publishedDate ?? "No disponible"],
                        ["Editorial", info.publisher ?? "No disponible"],
                      ].map(([label, value]) => (
                        <tr key={label} className="flex justify-between">
                          <td className="text-neutral-muted py-3">{label}</td>
                          <td className="text-slate-900 dark:text-white font-medium py-3 text-right">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Banner envío */}
                <div className="flex flex-col justify-center items-center bg-background-light dark:bg-background-dark p-6 rounded-xl border border-primary/20">
                  <span className="material-symbols-outlined text-primary text-5xl mb-4">local_shipping</span>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Envío Gratuito</h4>
                  <p className="text-neutral-muted text-center text-sm">
                    Este libro califica para envío express gratuito a todo el país. Recíbelo en 24-48 horas hábiles.
                  </p>
                  <button className="mt-4 text-primary font-bold hover:underline text-sm uppercase">
                    Ver métodos de envío
                  </button>
                </div>
              </div>
            </div>

            {/* Libros relacionados */}
            {related.length > 0 && (
              <section className="mt-20 mb-12">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Libros relacionados</h2>
                    <p className="text-neutral-muted">Basado en tus intereses literarios</p>
                  </div>
                  <Link
                    to="/catalogue"
                    className="text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    Ver todos <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {related.map((b) => (
                    <RelatedBookCard key={b.id} book={b} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 dark:bg-neutral-dark border-t border-slate-200 dark:border-neutral-border/50 py-12 px-10">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 text-primary mb-6">
              <span className="material-symbols-outlined text-2xl">menu_book</span>
              <h2 className="text-slate-900 dark:text-white text-lg font-bold">Entre Líneas</h2>
            </div>
            <p className="text-neutral-muted text-sm leading-relaxed">
              Tu destino literario favorito. Explora miles de mundos a través de nuestras páginas.
            </p>
          </div>
          {[
            { title: "Explorar", links: ["Novedades", "Más vendidos", "Promociones", "Editoriales"] },
            { title: "Ayuda", links: ["Preguntas frecuentes", "Métodos de envío", "Seguimiento de pedido", "Contacto"] },
          ].map(({ title, links }) => (
            <div key={title}>
              <h4 className="text-slate-900 dark:text-white font-bold mb-6">{title}</h4>
              <ul className="flex flex-col gap-3 text-neutral-muted text-sm">
                {links.map((l) => (
                  <li key={l}><a className="hover:text-primary transition-colors" href="#">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-6">Newsletter</h4>
            <p className="text-neutral-muted text-sm mb-4">Suscríbete para recibir recomendaciones y ofertas exclusivas.</p>
            <div className="flex gap-2">
              <input className="bg-white dark:bg-background-dark border border-neutral-border rounded-lg text-sm flex-1 px-3 focus:ring-1 focus:ring-primary outline-none" placeholder="Email" type="email" />
              <button className="bg-primary text-background-dark px-4 py-2 rounded-lg font-bold text-sm">Unirse</button>
            </div>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto mt-12 pt-8 border-t border-slate-200 dark:border-background-dark text-center text-neutral-muted text-xs">
          © 2026 Entre Líneas Librería. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}

export default BookDetail;