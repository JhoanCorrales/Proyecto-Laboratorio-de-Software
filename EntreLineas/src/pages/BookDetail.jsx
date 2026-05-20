import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import AuthRequiredModal from "../components/AuthRequiredModal";
import { addToCart } from "../services/cartService";
import { getCurrentUser } from "../services/authService";

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
      return `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`;
    }
    
    if (usePublisher && item.editorial) {
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
  }
  return item.portada_url ? item.portada_url.replace('-M.jpg', '-L.jpg') : "https://covers.openlibrary.org/b/id/default-L.jpg";
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
  const [img, setImg] = useState(book.portada_url || "https://covers.openlibrary.org/b/id/default-M.jpg");

  useEffect(() => {
    getDynamicCover(book).then(url => setImg(url.replace('-L.jpg', '-M.jpg')));
  }, [book]);

  const title = book.titulo ?? "Sin título";
  const author = book.autor ?? "Autor desconocido";
  const price = `$${Number(book.priceRaw || book.precio || 0).toLocaleString("es-CO")}`;

  return (
    <div
      className="group flex flex-col gap-3 cursor-pointer"
      onClick={() => navigate(`/catalogue/book/${book.id}`)}
    >
      <div
        className="aspect-[3/4] bg-cover bg-center rounded-lg shadow-md group-hover:shadow-primary/20 group-hover:scale-[1.02] transition-all border border-neutral-border"
        style={{ backgroundImage: `url('${img}')` }}
      />
      <div>
        <h4 className="text-slate-900 dark:text-white font-bold truncate">{title}</h4>
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
  const { bookId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchDoc, setSearchDoc] = useState(null);
  const [workData, setWorkData] = useState(null);
  const [related, setRelated] = useState([]);
  const [bookStores, setBookStores] = useState([]);
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

  useEffect(() => {
    if (!bookId) return;

    const fetchBook = async () => {
      setLoading(true);
      setError("");
      setWorkData(null);
      setRelated([]);
      setBookStores([]);

      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4003';
        
        // 1. Fetch de la DB local
        const dbRes = await fetch(`${baseUrl}/api/books/${bookId}`);
        if (!dbRes.ok) throw new Error("Error al buscar el libro");
        const dbData = await dbRes.json();
        
        if (!dbData.book) throw new Error("Libro no encontrado en el sistema.");
        
        const localBook = dbData.book;
        setSearchDoc(localBook);

        const mainImg = await getDynamicCover(localBook);
        setSelectedImg(mainImg);

        // 2. Fetch de inventario en tiendas locales - busca por TITULO (todas las tiendas con ese libro)
        try {
           const storesRes = await fetch(`${baseUrl}/api/books/stores-by-title?titulo=${encodeURIComponent(localBook.titulo)}`);
           if (storesRes.ok) {
             const storesData = await storesRes.json();
             setBookStores(storesData.stores || []);
           }
        } catch (e) {}

        // 3. Obtener sinopsis vía base open library con el título
        try {
          const searchParams = new URLSearchParams({
            q: `q=${encodeURIComponent(localBook.titulo)}&limit=1&fields=key`,
            type: "search"
          });
          const searchRes = await fetch(`http://localhost:4003/api/auth/openlibrary?${searchParams}`);
          const searchData = await searchRes.json();
          if (searchData.docs?.length) {
            const olKey = searchData.docs[0].key;
            const workRes = await fetch(`http://localhost:4003/api/auth/openlibrary?q=${encodeURIComponent(olKey)}&type=work`);
            if (workRes.ok) {
               const work = await workRes.json();
               setWorkData(work);
            }
          }
        } catch (err) {}

        // 4. Libros relacionados usando info de DB (autor o genero)
        try {
          const relQuery = encodeURIComponent(localBook.autor || localBook.categoria_nombre || '');
          const relRes = await fetch(`${baseUrl}/api/books/public?q=${relQuery}&limit=10`);
          if (relRes.ok) {
            const relData = await relRes.json();
            const filtered = (relData.docs ?? []).filter((b) => b.id !== localBook.id).slice(0, 5);
            setRelated(filtered);
          }
        } catch (e) {}

      } catch (err) {
        setError(err.message || "No se pudo cargar la información del libro.");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [bookId]);

  const getSynopsis = () => {
    if (!workData?.description) return "No hay sinopsis disponible para este libro.";
    if (typeof workData.description === "string") return workData.description;
    if (typeof workData.description === "object") return workData.description.value ?? "No hay sinopsis disponible.";
    return "No hay sinopsis disponible para este libro.";
  };

  const doc = searchDoc ?? {};
  const priceCOP = Number(doc.priceRaw || doc.precio || 0);
  const price = `$${priceCOP.toLocaleString("es-CO")}`;
  const originalPrice = `$${Math.round(priceCOP * 1.2).toLocaleString("es-CO")}`;
  const rating = 4;
  const stock = Number(doc.stock_general || 0);
  const isOutOfStock = stock === 0;

  const handleAddToCart = async () => {
    const user = getCurrentUser();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setAddingToCart(true);
    try {
      await addToCart({
        titulo: doc.titulo,
        autor: doc.autor ?? "Desconocido",
        isbn: doc.isbn ?? null,
        portada_url: selectedImg,
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

  const language = doc.idioma ? doc.idioma : "No disponible";
  const thumbnails = selectedImg ? [selectedImg] : [];

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
            {loading ? "Cargando..." : doc.titulo}
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
              {doc.titulo}
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
                <div className="hidden md:flex flex-wrap gap-2 mb-2">
                  {(doc.genero || doc.categoria_nombre || "Literatura").split(',').map((cat, idx) => (
                    <span key={idx} className="bg-primary/10 text-primary font-bold tracking-wide uppercase text-xs px-2.5 py-1 rounded-sm">
                      {cat.trim()}
                    </span>
                  ))}
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-extrabold mt-1 text-slate-900 dark:text-white">
                    {doc.titulo ?? doc.title}
                  </h1>
                </div>

                <div className="flex flex-col gap-4 mt-2">
                  {/* Autor */}
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-muted text-lg">Autor:</span>
                    <span className="text-slate-900 dark:text-slate-100 font-semibold text-lg underline decoration-primary/50">
                      {doc.autor ?? "Desconocido"}
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
                      <span className="font-medium">{stock} unidades en stock general</span>
                    </div>
                  </div>

                  {/* Stores breakdown */}
                  <div className="py-2 border-t border-slate-200 dark:border-neutral-border">
                    <h4 className="text-slate-900 dark:text-white font-bold mb-3 flex items-center gap-2">
                       <span className="material-symbols-outlined text-primary">storefront</span>
                       Disponibilidad en Tiendas
                    </h4>
                    {bookStores.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {bookStores.map(st => (
                          <div key={st.id} className="flex justify-between items-center text-sm p-3 bg-slate-50 dark:bg-neutral-dark rounded border border-slate-200 dark:border-neutral-border">
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-200">{st.nombre}</p>
                              <p className="text-neutral-muted text-xs">{st.ciudad}</p>
                            </div>
                            <span className="font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                               {st.stock} disp.
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-red-400 text-sm font-semibold">Producto sin stock local actual</p>
                    )}
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-y-4 py-6 border-y border-slate-200 dark:border-neutral-border">
                    {[
                      ["Editorial", doc.editorial ?? "No disponible"],
                      ["Género", doc.genero || doc.categoria_nombre || "No disponible"],
                      ["ISBN", doc.isbn ?? "No disponible"],
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
                    {isOutOfStock && (
                      <div className="w-full bg-red-900/40 border border-red-500/40 text-red-300 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium">
                        <span className="material-symbols-outlined">info</span>
                        Este libro está agotado
                      </div>
                    )}
                    <button
                      className="flex-1 bg-primary hover:bg-primary/90 text-background-dark font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      onClick={handleAddToCart}
                      disabled={addingToCart || isOutOfStock}
                    >
                      <span className="material-symbols-outlined">
                        {addingToCart ? "hourglass_empty" : "shopping_cart"}
                      </span>
                      {isOutOfStock ? "Agotado" : addingToCart ? "Agregando..." : "Agregar al carrito"}
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
                        ["Número de páginas", doc.paginas ? `${doc.paginas} páginas` : "No disponible"],
                        ["Idioma", language],
                        ["Año de publicación", doc.año ?? doc.fecha_publicacion ?? "No disponible"],
                        ["Editorial", doc.editorial ?? "No disponible"],
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
            <section className="mt-20 mb-12">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Libros relacionados</h2>
                  <p className="text-neutral-muted">Basado en tus intereses literarios compartiendo autor o género</p>
                </div>
                <Link to="/catalogue" className="text-primary font-semibold hover:underline flex items-center gap-1">
                  Ver todos <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
              {related.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {related.map((b) => (
                    <RelatedBookCard key={b.id || b.key} book={b} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-neutral-muted border border-dashed border-neutral-border/50 rounded-xl">
                  <span className="material-symbols-outlined text-4xl">search_off</span>
                  <p className="text-sm font-medium">No hay libros relacionados en las tiendas locales</p>
                </div>
              )}
            </section>
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