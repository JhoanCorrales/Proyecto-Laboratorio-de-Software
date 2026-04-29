import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import AuthRequiredModal from "../components/AuthRequiredModal";
import { addToCart } from "../services/cartService";
import { getCurrentUser } from "../services/authService";

const USD_TO_COP = 4000;

function generateRandomPrice(seed) {
  // Precio determinista basado en el título para que no cambie entre renders
  const hash = seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const base = (hash % 50) + 15;
  return Math.round(base * USD_TO_COP);
}

function StarRating({ rating }) {
  return (
    <div className="flex items-center text-primary">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half = !filled && rating >= star - 0.5;
        return (
          <span
            key={star}
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {filled ? "star" : half ? "star_half" : "star_outline"}
          </span>
        );
      })}
    </div>
  );
}

function RelatedBookCard({ book }) {
  const navigate = useNavigate();
  // cover_i es el campo correcto en search.json
  const img = book.cover_i
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
    : null;
  const title = book.title ?? "Sin título";
  const author = book.author_name?.[0] ?? "Autor desconocido";
  const priceCOP = generateRandomPrice(title);
  const price = `$${priceCOP.toLocaleString("es-CO")}`;

  if (!img) return null;

  return (
    <div
      className="group flex flex-col gap-3 cursor-pointer"
      onClick={() =>
        navigate(`/catalogue/${encodeURIComponent(title)}/details`, {
          state: { bookKey: book.key },
        })
      }
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
  const location = useLocation();

  const [searchDoc, setSearchDoc] = useState(null);
  const [workData, setWorkData] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImg, setSelectedImg] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartToast, setCartToast] = useState({ msg: "", type: "success" });
  const [showAuthModal, setShowAuthModal] = useState(false);

  const showCartToast = (msg, type = "success") => {
    setCartToast({ msg, type });
    setTimeout(() => setCartToast({ msg: "", type: "success" }), 3000);
  };

  // Precio estable — se pasa desde el estado de navegación o se calcula una sola vez
  const priceRef = useRef(location.state?.bookPrice ?? null);

  useEffect(() => {
    if (!bookTitle) return;

    const fetchBook = async () => {
      setLoading(true);
      setError("");
      setWorkData(null);
      setSearchDoc(null);
      // Usa la imagen del estado si está disponible
      setSelectedImg(location.state?.bookImg ?? null);

      try {
        // 1. Buscar por título en search.json
        const searchParams = new URLSearchParams({
          q: `q=${encodeURIComponent(bookTitle)}&limit=1&fields=key,title,author_name,cover_i,isbn,first_publish_year,subject,language,number_of_pages_median,publisher`,
          type: "search"
        });
        const searchRes = await fetch(
          `http://localhost:4003/api/auth/openlibrary?${searchParams}`
        );
        if (!searchRes.ok) throw new Error("Error al buscar el libro");
        const searchData = await searchRes.json();

        if (!searchData.docs?.length) throw new Error("Libro no encontrado");

        const doc = searchData.docs[0];
        setSearchDoc(doc);
        setError(""); // Limpiar error cuando la carga es exitosa

        // Precio fijo: usa el pasado desde el estado, o calcula basado en el título
        if (!priceRef.current) {
          priceRef.current = generateRandomPrice(doc.title ?? bookTitle);
        }

        // Imagen principal — cover_i es el campo correcto
        const mainImg = doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
          : location.state?.bookImg ?? null;
        setSelectedImg(mainImg);

        // 2. Obtener descripción desde /works/{key}.json
        if (doc.key) {
          try {
            const workRes = await fetch(
              `http://localhost:4003/api/auth/openlibrary?q=${encodeURIComponent(doc.key)}&type=work`
            );
            if (workRes.ok) {
              const work = await workRes.json();
              setWorkData(work);
            }
          } catch {
            // Si falla el work, no es crítico — seguimos sin sinopsis
          }
        }

        // 3. Libros relacionados
        const relQuery = doc.author_name?.[0] ?? doc.subject?.[0] ?? bookTitle;
        const relParams = new URLSearchParams({
          q: `q=${encodeURIComponent(relQuery)}&limit=10&fields=key,title,author_name,cover_i`,
          type: "search"
        });
        const relRes = await fetch(
          `http://localhost:4003/api/auth/openlibrary?${relParams}`
        );
        if (relRes.ok) {
          const relData = await relRes.json();
          const filtered = (relData.docs ?? [])
            .filter((b) => b.key !== doc.key && b.cover_i)
            .slice(0, 5);
          setRelated(filtered);
        }
      } catch (err) {
        setError("No se pudo cargar la información del libro.");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [bookTitle]);

  // Sinopsis — puede venir como string o como objeto { value: "..." }
  const getSynopsis = () => {
    if (!workData?.description) return "No hay sinopsis disponible para este libro.";
    if (typeof workData.description === "string") return workData.description;
    if (typeof workData.description === "object") return workData.description.value ?? "No hay sinopsis disponible.";
    return "No hay sinopsis disponible para este libro.";
  };

  const doc = searchDoc ?? {};
  const priceCOP = priceRef.current ?? generateRandomPrice(bookTitle);
  const price = `$${priceCOP.toLocaleString("es-CO")}`;
  const originalPrice = `$${Math.round(priceCOP * 1.2).toLocaleString("es-CO")}`;
  const rating = 4;
  const stock = ((doc.number_of_pages_median ?? 300) % 20) + 5;

  const handleAddToCart = async () => {
    const user = getCurrentUser();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setAddingToCart(true);
    try {
      await addToCart({
        titulo: doc.title ?? bookTitle,
        autor: doc.author_name?.[0] ?? "Desconocido",
        isbn: doc.isbn?.[0] ?? null,
        portada_url: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : null,
        precio_unitario: priceCOP,
        cantidad: 1,
      });
      showCartToast("¡Libro agregado al carrito!");
    } catch (err) {
      showCartToast(err.message || "Error al agregar al carrito.", "error");
    } finally {
      setAddingToCart(false);
    }
  };

  const langMap = { eng: "Inglés", spa: "Español", fre: "Francés", ger: "Alemán", por: "Portugués" };
  const language = doc.language?.[0] ? (langMap[doc.language[0]] ?? doc.language[0]) : "No disponible";

  const thumbnails = doc.cover_i
    ? [
      `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`,
    ]
    : [];

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      <Navbar />
      <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

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
            {loading ? "Cargando..." : doc.title ?? bookTitle}
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

        {!loading && searchDoc && (
          <>
            {/* Título móvil */}
            <h1 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white md:hidden">
              {doc.title}
            </h1>

            {/* Grid principal */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
              {/* Columna izquierda */}
              <div className="md:col-span-5 flex flex-col gap-4">
                <div className="relative">
                  {selectedImg ? (
                    <div
                      className="w-full bg-center bg-no-repeat aspect-[3/4] bg-cover rounded-xl shadow-2xl border border-slate-200 dark:border-neutral-border"
                      style={{ backgroundImage: `url('${selectedImg}')` }}
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] rounded-xl shadow-2xl border border-neutral-border bg-neutral-dark flex flex-col items-center justify-center gap-4">
                      <span className="material-symbols-outlined text-8xl text-neutral-muted">menu_book</span>
                      <p className="text-neutral-muted text-sm">Sin portada disponible</p>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary text-background-dark text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                      {stock > 0 ? "Disponible" : "Agotado"}
                    </span>
                  </div>
                </div>

                {/* Thumbnails — L del mismo cover */}
                {thumbnails.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {thumbnails.map((url, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedImg(url)}
                        className={`aspect-square rounded-lg bg-cover bg-center cursor-pointer transition-opacity
                          ${selectedImg === url
                            ? "border-2 border-primary opacity-100"
                            : "border border-neutral-border opacity-60 hover:opacity-100"
                          }`}
                        style={{ backgroundImage: `url('${url}')` }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Columna derecha */}
              <div className="md:col-span-7 flex flex-col">
                <div className="hidden md:block mb-2">
                  <span className="text-primary font-medium tracking-wide uppercase text-sm">
                    {doc.subject?.[0] ?? "Literatura"}
                  </span>
                  <h1 className="text-4xl lg:text-5xl font-extrabold mt-1 text-slate-900 dark:text-white">
                    {doc.title}
                  </h1>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                  {/* Autor */}
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-muted text-lg">Autor:</span>
                    <span className="text-slate-900 dark:text-slate-100 font-semibold text-lg underline decoration-primary/50">
                      {doc.author_name?.[0] ?? "Desconocido"}
                    </span>
                  </div>

                  {/* Rating y stock */}
                  <div className="flex flex-wrap items-center gap-6 py-2">
                    <div className="flex items-center gap-2">
                      <StarRating rating={rating} />
                      <span className="text-neutral-muted font-medium text-sm">Sin reseñas</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-muted">
                      <span className="material-symbols-outlined text-green-500">inventory_2</span>
                      <span className="font-medium">{stock} unidades en stock</span>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-y-4 py-6 border-y border-slate-200 dark:border-neutral-border">
                    {[
                      ["Editorial", doc.publisher?.[0] ?? "No disponible"],
                      ["Género", doc.subject?.[0] ?? "No disponible"],
                      ["ISBN", doc.isbn?.[0] ?? "No disponible"],
                      ["Idioma", language],
                    ].map(([label, value]) => (
                      <div key={label} className="flex flex-col">
                        <span className="text-neutral-muted text-xs uppercase font-bold tracking-tighter">{label}</span>
                        <span className="text-slate-900 dark:text-slate-100 font-medium truncate">{value}</span>
                      </div>
                    ))}
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
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      className="flex-1 bg-primary hover:bg-primary/90 text-background-dark font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                    >
                      <span className="material-symbols-outlined">
                        {addingToCart ? "hourglass_empty" : "shopping_cart"}
                      </span>
                      {addingToCart ? "Agregando..." : "Agregar al carrito"}
                    </button>
                    <button
                      className="flex-1 bg-neutral-400 text-gray-600 font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
                      disabled
                      title="Módulo en construcción"
                    >
                      <span className="material-symbols-outlined">payments</span>
                      Comprar ahora
                    </button>
                  </div>
                  {/* Toast de carrito */}
                  {cartToast.msg && (
                    <div
                      className={`mt-2 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border ${
                        cartToast.type === "error"
                          ? "bg-red-900/40 border-red-500/40 text-red-300"
                          : "bg-green-900/40 border-green-500/40 text-green-300"
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {cartToast.type === "error" ? "error" : "check_circle"}
                      </span>
                      {cartToast.msg}
                    </div>
                  )}
                  <button 
                    className="w-full border-2 border-gray-400 text-gray-500 font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
                    disabled
                    title="Módulo en construcción"
                  >
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
                  {getSynopsis()}
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
                        ["Número de páginas", doc.number_of_pages_median ? `${doc.number_of_pages_median} páginas` : "No disponible"],
                        ["Idioma", language],
                        ["Año de publicación", doc.first_publish_year ?? "No disponible"],
                        ["Editorial", doc.publisher?.[0] ?? "No disponible"],
                      ].map(([label, value]) => (
                        <tr key={label} className="flex justify-between">
                          <td className="text-neutral-muted py-3">{label}</td>
                          <td className="text-slate-900 dark:text-white font-medium py-3 text-right">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Envío */}
                <div className="flex flex-col justify-center items-center bg-background-light dark:bg-background-dark p-6 rounded-xl border border-gray-300 dark:border-gray-600 opacity-60">
                  <span className="material-symbols-outlined text-gray-400 text-5xl mb-4">local_shipping</span>
                  <h4 className="text-lg font-bold text-gray-500 mb-2">Envío Gratuito</h4>
                  <p className="text-gray-400 text-center text-sm">
                    Módulo en construcción
                  </p>
                  <button className="mt-4 text-gray-400 font-bold text-sm uppercase cursor-not-allowed opacity-50" disabled>
                    Ver métodos de envío
                  </button>
                </div>
              </div>
            </div>

            {/* Relacionados */}
            {related.length > 0 && (
              <section className="mt-20 mb-12">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Libros relacionados</h2>
                    <p className="text-neutral-muted">Basado en tus intereses literarios</p>
                  </div>
                  <Link to="/catalogue" className="text-primary font-semibold hover:underline flex items-center gap-1">
                    Ver todos <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {related.map((b) => (
                    <RelatedBookCard key={b.key} book={b} />
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
              <input
                className="bg-white dark:bg-background-dark border border-neutral-border rounded-lg text-sm flex-1 px-3 py-2 focus:ring-1 focus:ring-primary outline-none"
                placeholder="Email"
                type="email"
              />
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