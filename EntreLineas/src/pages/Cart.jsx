import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getCart, updateCartItem, removeCartItem } from "../services/cartService";
import { getCurrentUser } from "../services/authService";

const IVA = 0.19;

// ─── Skeleton loading ─────────────────────────────────────────────────────────
function SkeletonItem() {
  return (
    <div className="py-6 flex gap-6 animate-pulse">
      <div className="w-24 h-36 flex-shrink-0 bg-neutral-border/30 rounded-lg" />
      <div className="flex-grow flex flex-col justify-between gap-3">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-5 w-48 bg-neutral-border/30 rounded" />
            <div className="h-4 w-32 bg-neutral-border/30 rounded" />
          </div>
          <div className="h-7 w-20 bg-neutral-border/30 rounded" />
        </div>
        <div className="flex justify-between items-end">
          <div className="h-9 w-28 bg-neutral-border/30 rounded-lg" />
          <div className="h-5 w-16 bg-neutral-border/30 rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyCart({ onGoBack }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
      <div className="w-24 h-24 rounded-full bg-neutral-dark border border-neutral-border flex items-center justify-center">
        <span className="material-symbols-outlined text-5xl text-neutral-muted">
          shopping_cart
        </span>
      </div>
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Tu carrito está vacío</h2>
        <p className="text-neutral-muted max-w-xs">
          Explora nuestro catálogo y agrega los libros que te gusten.
        </p>
      </div>
      <button
        onClick={onGoBack}
        className="flex items-center gap-2 bg-primary text-background-dark font-bold px-6 py-3 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all"
      >
        <span className="material-symbols-outlined">import_contacts</span>
        Explorar catálogo
      </button>
    </div>
  );
}

// ─── Toast notification ───────────────────────────────────────────────────────
function Toast({ message, type }) {
  if (!message) return null;
  const colors =
    type === "error"
      ? "bg-red-900/80 border-red-500/50 text-red-200"
      : "bg-green-900/80 border-green-500/50 text-green-200";
  return (
    <div
      className={`fixed bottom-28 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-md transition-all ${colors}`}
    >
      <span className="material-symbols-outlined text-lg">
        {type === "error" ? "error" : "check_circle"}
      </span>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null); // libro_id en proceso
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [coupon, setCoupon] = useState("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3000);
  };

  // ── Cargar carrito al montar ──
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate("/");
      return;
    }

    const fetchCart = async () => {
      try {
        const data = await getCart();
        setItems(data.items);
      } catch {
        showToast("No se pudo cargar el carrito.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [navigate]);

  // ── Cambiar cantidad ──
  const handleQuantityChange = async (libroId, newQty) => {
    setUpdatingId(libroId);
    try {
      const data = await updateCartItem(libroId, newQty);
      setItems(data.items);
    } catch {
      showToast("Error al actualizar la cantidad.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Eliminar item ──
  const handleRemove = async (libroId) => {
    setUpdatingId(libroId);
    try {
      const data = await removeCartItem(libroId);
      setItems(data.items);
      showToast("Libro eliminado del carrito.");
    } catch {
      showToast("Error al eliminar el libro.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Cálculos ──
  const subtotal = items.reduce((acc, i) => acc + Number(i.precio_unitario) * i.cantidad, 0);
  const iva = subtotal * IVA;
  const total = subtotal + iva;
  const totalItems = items.reduce((acc, i) => acc + i.cantidad, 0);

  return (
    <div className="bg-background-dark font-display text-slate-100 min-h-screen">
      <Navbar cartCount={totalItems} />

      <main className="max-w-7xl mx-auto px-4 md:px-10 pt-24 pb-28 md:pb-12">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-primary hover:underline transition-all text-sm font-medium"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            Volver
          </button>
          <h1 className="text-3xl font-bold text-white">Mi Carrito</h1>
          {!loading && items.length > 0 && (
            <span className="text-neutral-muted text-sm">
              ({totalItems} {totalItems === 1 ? "producto" : "productos"})
            </span>
          )}
        </div>

        {loading ? (
          /* Skeleton */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 bg-neutral-dark border border-neutral-border rounded-2xl p-6 shadow-xl divide-y divide-neutral-border/50">
              {[1, 2, 3].map((k) => (
                <SkeletonItem key={k} />
              ))}
            </div>
            <div className="h-96 bg-neutral-dark border border-neutral-border rounded-2xl animate-pulse" />
          </div>
        ) : items.length === 0 ? (
          <EmptyCart onGoBack={() => navigate("/catalogue")} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* ── Lista de productos ── */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-neutral-dark border border-neutral-border rounded-2xl p-6 shadow-xl">
                <div className="divide-y divide-neutral-border/50">
                  {items.map((item) => {
                    const isBusy = updatingId === item.libro_id;
                    const precio = Number(item.precio_unitario);
                    return (
                      <div
                        key={item.libro_id}
                        className={`py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-5 transition-opacity ${isBusy ? "opacity-60 pointer-events-none" : ""}`}
                      >
                        {/* Portada */}
                        <div className="w-24 h-36 flex-shrink-0 bg-background-dark rounded-lg overflow-hidden border border-neutral-border shadow-md">
                          {item.portada_url ? (
                            <img
                              src={item.portada_url}
                              alt={item.titulo}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-4xl text-neutral-muted">
                                menu_book
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Detalles */}
                        <div className="flex-grow flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-bold text-white leading-tight mb-1">
                                {item.titulo}
                              </h3>
                              <p className="text-neutral-muted text-sm">{item.autor}</p>
                            </div>
                            <span className="text-xl font-bold text-primary ml-4 whitespace-nowrap">
                              ${(precio * item.cantidad).toLocaleString("es-CO")}
                            </span>
                          </div>

                          <div className="flex justify-between items-end mt-4">
                            {/* Selector de cantidad */}
                            <div className="flex items-center bg-background-dark border border-neutral-border rounded-lg overflow-hidden">
                              <button
                                onClick={() =>
                                  handleQuantityChange(item.libro_id, item.cantidad - 1)
                                }
                                className="px-3 py-2 hover:bg-neutral-border text-primary transition-colors"
                                aria-label="Reducir cantidad"
                              >
                                <span className="material-symbols-outlined text-lg leading-none">
                                  remove
                                </span>
                              </button>
                              <span className="px-5 py-2 text-white text-sm font-bold min-w-[2.5rem] text-center">
                                {item.cantidad}
                              </span>
                              <button
                                onClick={() =>
                                  handleQuantityChange(item.libro_id, item.cantidad + 1)
                                }
                                className="px-3 py-2 hover:bg-neutral-border text-primary transition-colors"
                                aria-label="Aumentar cantidad"
                              >
                                <span className="material-symbols-outlined text-lg leading-none">
                                  add
                                </span>
                              </button>
                            </div>

                            {/* Eliminar */}
                            <button
                              onClick={() => handleRemove(item.libro_id)}
                              className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
                              aria-label="Eliminar libro"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Frase literaria */}
              <div className="bg-neutral-dark/50 border border-neutral-border border-dashed rounded-xl p-5 text-center">
                <p className="text-neutral-muted italic font-display text-sm">
                  "Un libro es un sueño que tienes en tus manos." — Neil Gaiman
                </p>
              </div>
            </div>

            {/* ── Resumen de compra ── */}
            <aside className="sticky top-24">
              <div className="bg-neutral-dark border border-neutral-border rounded-2xl p-8 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-6">Resumen de compra</h2>

                {/* Desglose */}
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-neutral-muted text-sm">
                    <span>
                      Subtotal ({totalItems} {totalItems === 1 ? "producto" : "productos"})
                    </span>
                    <span className="text-white font-medium">
                      ${subtotal.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-muted text-sm">
                    <span>Gastos de envío</span>
                    <span className="text-green-400 font-medium">Gratis</span>
                  </div>
                  <div className="flex justify-between text-neutral-muted text-sm">
                    <span>Impuestos (IVA 19%)</span>
                    <span className="text-white font-medium">
                      ${iva.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="pt-4 border-t border-neutral-border flex justify-between items-center">
                    <span className="text-lg font-bold text-white">Total</span>
                    <span className="text-3xl font-bold text-primary">
                      ${total.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>

                {/* Cupón */}
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      className="w-full bg-background-dark border border-neutral-border rounded-lg px-4 py-3 text-sm text-white placeholder-neutral-muted focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all pr-20"
                      placeholder="Código de descuento"
                      type="text"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                    />
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-neutral-border text-neutral-muted text-xs font-bold rounded hover:bg-neutral-border/80 transition-all"
                      onClick={() => showToast("Código no válido o no disponible.", "error")}
                    >
                      Aplicar
                    </button>
                  </div>

                  {/* CTA */}
                  <button
                    className="w-full bg-primary text-background-dark font-bold py-4 rounded-xl shadow-[0_4px_20px_rgba(43,189,238,0.25)] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                    onClick={() => showToast("Próximamente: módulo de pago.", "success")}
                  >
                    Continuar con el pago
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>

                  {/* Métodos de pago */}
                  <div className="mt-6 flex items-center justify-center gap-5 opacity-40">
                    <span
                      className="material-symbols-outlined text-3xl text-neutral-muted"
                      title="Tarjeta de crédito"
                    >
                      credit_card
                    </span>
                    <span
                      className="material-symbols-outlined text-3xl text-neutral-muted"
                      title="Billetera digital"
                    >
                      account_balance_wallet
                    </span>
                    <span
                      className="material-symbols-outlined text-3xl text-neutral-muted"
                      title="Pago sin contacto"
                    >
                      contactless
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}

export default Cart;
