import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AuthRequiredModal from "../components/AuthRequiredModal";
import { getCart } from "../services/cartService";
import { getCurrentUser, getUserProfile } from "../services/authService";
import { getWalletBalance } from "../services/walletService";
import { getStores } from "../services/storesService";
import { processPurchase } from "../services/checkoutService";

const IVA = 0.19;

const formatCOP = (value) =>
  `$${Number(value || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

// ─── Dynamic cover loader ────────────────────────────────────────────────────
async function getDynamicCover(titulo, editorial, retries = 3, usePublisher = true) {
  try {
    let url = `https://openlibrary.org/search.json?title=${encodeURIComponent(titulo || '')}&limit=1&fields=cover_i`;
    if (usePublisher && editorial) url += `&publisher=${encodeURIComponent(editorial)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.docs?.length && data.docs[0].cover_i) {
      return `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-M.jpg`;
    }
    if (usePublisher && editorial) return getDynamicCover(titulo, editorial, retries, false);
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return getDynamicCover(titulo, editorial, retries - 1, false);
    }
  } catch {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1500));
      return getDynamicCover(titulo, editorial, retries - 1, usePublisher);
    }
  }
  return null;
}

// ─── Cover component ─────────────────────────────────────────────────────────
function CheckoutItemCover({ titulo, editorial, portada_url }) {
  const [src, setSrc] = useState(portada_url || null);
  const [loaded, setLoaded] = useState(!!portada_url);

  useEffect(() => {
    if (portada_url) {
      setSrc(portada_url);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    getDynamicCover(titulo, editorial).then(url => {
      if (!cancelled && url) {
        setSrc(url);
        setLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, [titulo, editorial, portada_url]);

  if (!src || !loaded) {
    return (
      <div className="w-full h-full flex items-center justify-center animate-pulse bg-neutral-border/20">
        <span className="material-symbols-outlined text-3xl text-neutral-muted">menu_book</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={titulo}
      className="w-full h-full object-cover"
      onError={() => {
        setLoaded(false);
        setSrc(null);
        getDynamicCover(titulo, editorial).then(url => {
          if (url) { setSrc(url); setLoaded(true); }
        });
      }}
    />
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

// ─── Main Checkout component ──────────────────────────────────────────────────
function Checkout() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Form state
  const [deliveryMethod, setDeliveryMethod] = useState("home");
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [selectedStore, setSelectedStore] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);
  const [stores, setStores] = useState([]);

  // User data
  const [userData, setUserData] = useState(null);
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Colombia"
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3000);
  };

  // ── Load cart, user profile, wallet balance and stores ──
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setUserData(user);

    const fetchData = async () => {
      try {
        // Get cart
        const cartData = await getCart();
        if (cartData.items.length === 0) {
          navigate("/cart");
          return;
        }
        setItems(cartData.items);

        // Get user profile (with address)
        const profile = await getUserProfile();
        setShippingAddress({
          name: profile.nombre,
          address: profile.direccion || "",
          city: profile.ciudad || "",
          postalCode: profile.codigo_postal || "",
          country: "Colombia"
        });

        // Get wallet balance
        const wallet = await getWalletBalance();
        setWalletBalance(wallet.saldo_disponible);

        // Get stores
        const storesList = await getStores();

        console.log("storesList RAW:", storesList);

        const tiendas =
          Array.isArray(storesList)
            ? storesList
            : Array.isArray(storesList?.tiendas)
              ? storesList.tiendas
              : Array.isArray(storesList?.data)
                ? storesList.data
                : Array.isArray(storesList?.stores)
                  ? storesList.stores
                  : [];

        // guardar en estado
        setStores(tiendas);

        // seleccionar primera tienda si existe
        if (tiendas.length > 0) {
          setSelectedStore(tiendas[0].id);
        } else {
          setSelectedStore("");
        }
      } catch (err) {
        console.error("Error loading checkout data:", err);
        showToast("Error al cargar los datos del checkout.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // ── Calculations ──
  const subtotal = items.reduce((acc, i) => acc + Number(i.precio_unitario) * i.cantidad, 0);
  const iva = subtotal * IVA;
  const total = subtotal + iva;
  const totalItems = items.reduce((acc, i) => acc + i.cantidad, 0);

  // ── Handle purchase ──
  const handleConfirmPurchase = async () => {
    if (walletBalance < total) {
      showToast("Saldo insuficiente en el monedero.", "error");
      return;
    }

    setProcessing(true);
    try {
      const purchaseData = {
        paymentMethod: "wallet",
        cardId: null,
        deliveryMethod,
        shippingAddress: deliveryMethod === "home" 
          ? shippingAddress 
          : { storeId: selectedStore },
      };

      const result = await processPurchase(purchaseData);
      showToast("¡Compra realizada exitosamente!", "success");

      // Redirect to purchase history after 2 seconds
      setTimeout(() => {
        navigate("/purchases");
      }, 2000);
    } catch (err) {
      console.error("Purchase error:", err);
      showToast(err.message || "Error al procesar la compra.", "error");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background-dark font-display text-slate-100 min-h-screen">
        <Navbar cartCount={totalItems} />
        <main className="max-w-6xl mx-auto px-4 py-8 mt-16 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-neutral-muted">Cargando...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background-dark font-display text-slate-100 min-h-screen">
      <Navbar cartCount={totalItems} />
      <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <main className="max-w-6xl mx-auto px-4 py-8 mt-8">
        {/* Page Title */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/cart")}
            className="flex items-center gap-1 text-primary hover:underline transition-all text-sm font-medium mb-4"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Volver al carrito
          </button>
          <h2 className="text-4xl font-black tracking-tight text-white mb-2">Finalizar compra</h2>
          <p className="text-neutral-muted text-lg">Revisa tu pedido antes de confirmar</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Order Summary */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-neutral-dark border border-neutral-border rounded-xl overflow-hidden">
              <div className="p-6 border-b border-neutral-border">
                <h3 className="text-xl font-bold text-white">Resumen del pedido</h3>
              </div>

              {/* Book Items */}
              <div className="divide-y divide-neutral-border">
                {items.map((item) => (
                  <div key={item.libro_id} className="p-6 flex items-center gap-6">
                    <div className="size-24 shrink-0 bg-background-dark rounded-lg overflow-hidden border border-neutral-border">
                      <CheckoutItemCover
                        titulo={item.titulo}
                        editorial={item.editorial}
                        portada_url={item.portada_url}
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-lg">{item.titulo}</h4>
                      <p className="text-neutral-muted text-sm mb-2">{item.autor}</p>
                      <p className="text-primary font-bold">${Number(item.precio_unitario).toLocaleString("es-CO")}</p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center gap-3 bg-background-dark border border-neutral-border rounded-full px-3 py-1">
                        <span className="text-white font-medium w-4 text-center">{item.cantidad}</span>
                      </div>
                      <p className="text-white font-bold">${(Number(item.precio_unitario) * item.cantidad).toLocaleString("es-CO")}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Summary */}
              <div className="p-6 bg-background-dark/30 border-t border-neutral-border space-y-3">
                <div className="flex justify-between text-neutral-muted">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString("es-CO", { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-neutral-muted">
                  <span>Impuestos (19%)</span>
                  <span>${iva.toLocaleString("es-CO", { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-white text-2xl font-black pt-2 border-t border-neutral-border/50">
                  <span>Total</span>
                  <span>${total.toLocaleString("es-CO", { minimumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Payment & Delivery */}
          <div className="lg:col-span-5 space-y-6">
            {/* Delivery Method */}
            <div className="bg-neutral-dark border border-neutral-border rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Método de entrega</h3>
              <div className="flex p-1 bg-background-dark border border-neutral-border rounded-lg mb-6">
                <button
                  onClick={() => setDeliveryMethod("home")}
                  className={`flex-1 py-2 px-4 rounded-md font-bold transition-all ${
                    deliveryMethod === "home"
                      ? "bg-primary text-background-dark"
                      : "text-neutral-muted hover:text-white"
                  }`}
                >
                  Envío a domicilio
                </button>
                <button
                  onClick={() => setDeliveryMethod("pickup")}
                  className={`flex-1 py-2 px-4 rounded-md font-bold transition-all ${
                    deliveryMethod === "pickup"
                      ? "bg-primary text-background-dark"
                      : "text-neutral-muted hover:text-white"
                  }`}
                >
                  Recogida en tienda
                </button>
              </div>

              {deliveryMethod === "home" && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-neutral-muted">Dirección de envío</label>
                  <div className="p-4 bg-background-dark border border-neutral-border rounded-lg">
                    <p className="text-white font-semibold">{shippingAddress.name}</p>
                    <p className="text-neutral-muted text-sm leading-relaxed">
                      {shippingAddress.address}<br />
                      {shippingAddress.postalCode} {shippingAddress.city}, {shippingAddress.country}
                    </p>
                  </div>
                </div>
              )}

              {deliveryMethod === "pickup" && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-neutral-muted">Seleccionar tienda</label>
                  <select 
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className="w-full bg-background-dark border border-neutral-border rounded-lg text-white py-3 px-4 focus:ring-primary focus:border-primary"
                  >
                    {Array.isArray(stores) &&
                      stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.nombre} - {store.direccion}, {store.ciudad}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-neutral-dark border border-neutral-border rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">Método de pago</h3>

              {/* Wallet info */}
              <div className="space-y-4">
                <div className="p-4 bg-background-dark border border-neutral-border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                    <p className="text-neutral-muted text-sm">Saldo disponible en Monedero</p>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCOP(walletBalance)}
                  </p>
                </div>
                  {walletBalance < total && (
                    <div className="p-3 bg-red-900/40 border border-red-500/40 text-red-300 rounded-lg flex items-center gap-2 text-sm font-medium">
                      <span className="material-symbols-outlined">warning</span>
                      Saldo insuficiente. Necesitas {formatCOP(total - walletBalance)} más
                    </div>
                  )}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <button
                onClick={handleConfirmPurchase}
                disabled={processing || walletBalance < total}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed text-background-dark text-lg font-black py-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-background-dark border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    Confirmar compra
                    <span className="material-symbols-outlined">check_circle</span>
                  </>
                )}
              </button>
              <button
                onClick={() => navigate("/cart")}
                className="w-full text-neutral-muted font-bold py-2 hover:text-white transition-all"
              >
                Volver al carrito
              </button>
            </div>

            {/* Trust Signals */}
            <div className="flex items-center justify-center gap-4 text-neutral-muted/60 text-xs">
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">lock</span>
                <span>Pago Seguro SSL</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                <span>Garantía Entre Líneas</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}

export default Checkout;
