import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import AuthRequiredModal from "../components/AuthRequiredModal";
import { getCurrentUser } from "../services/authService";
import { getPurchaseHistory, getPurchaseDetail, cancelPurchase } from "../services/checkoutService";

const formatCOP = (value) =>
  `$${Number(value || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

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

// ─── Purchase Detail Modal ────────────────────────────────────────────────────
function PurchaseDetailModal({ purchaseId, isOpen, onClose, onCancel }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!isOpen || !purchaseId) return;

    const fetchDetail = async () => {
      try {
        const data = await getPurchaseDetail(purchaseId);
        setDetail(data.compra);
      } catch (err) {
        console.error("Error fetching purchase detail:", err);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchDetail();
  }, [isOpen, purchaseId]);

  const handleCancel = async () => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar esta compra?")) return;

    setCancelling(true);
    try {
      await cancelPurchase(purchaseId);
      onCancel();
      onClose();
    } catch (err) {
      console.error("Error cancelling purchase:", err);
    } finally {
      setCancelling(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="bg-neutral-dark border border-neutral-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-neutral-border flex items-center justify-between sticky top-0 bg-neutral-dark">
          <h3 className="text-xl font-bold text-white">Detalles de la compra</h3>
          <button
            onClick={onClose}
            className="text-neutral-muted hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-pulse">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-neutral-muted">Cargando...</p>
            </div>
          </div>
        ) : detail ? (
          <div className="p-6 space-y-6">
            {/* Order info */}
            <div className="bg-background-dark/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-muted">Número de compra:</span>
                <span className="text-white font-semibold">#{detail.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-muted">Fecha:</span>
                <span className="text-white font-semibold">
                  {new Date(detail.created_at).toLocaleDateString("es-CO")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-muted">Estado:</span>
                <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                  detail.estado_compra === "confirmada"
                    ? "bg-green-900/40 text-green-300"
                    : detail.estado_compra === "cancelada"
                    ? "bg-red-900/40 text-red-300"
                    : "bg-blue-900/40 text-blue-300"
                }`}>
                  {detail.estado_compra}
                </span>
              </div>
            </div>

            {/* Detalles de entrega */}
            {detail.tipo_entrega && (
              <div className="bg-background-dark/30 rounded-lg p-4 space-y-2 border border-neutral-border/20 text-sm">
                <p className="text-white font-bold text-base mb-1">Información de entrega</p>
                {detail.tipo_entrega === "recogida" ? (
                  <div className="space-y-1 text-neutral-muted">
                    <p>Método: <span className="text-white font-semibold">Recogida en tienda</span></p>
                    <p>Tienda: <span className="text-white font-semibold">{detail.tienda_nombre || `Tienda #${detail.tienda_id}`}</span></p>
                    {detail.tienda_direccion && (
                      <p>Dirección: <span className="text-white font-semibold">{detail.tienda_direccion}</span></p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1 text-neutral-muted">
                    <p>Método: <span className="text-white font-semibold">Envío a domicilio</span></p>
                    <p>Dirección: <span className="text-white font-semibold">{detail.direccion_envio || "Dirección no especificada"}</span></p>
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            <div className="space-y-3">
              <h4 className="text-white font-bold">Artículos</h4>
              <div className="divide-y divide-neutral-border">
                {detail.items?.map((item) => (
                  <div key={item.id} className="py-3 flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-white font-semibold">{item.titulo}</p>
                      <p className="text-neutral-muted text-sm">{item.autor}</p>
                      <p className="text-neutral-muted text-xs mt-1">Cantidad: {item.cantidad}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary font-bold">
                        {formatCOP(item.subtotal)}
                      </p>
                      <p className="text-neutral-muted text-xs mt-1">
                        {formatCOP(item.precio_unitario)} c/u
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-neutral-border pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-white">Total:</span>
                <span className="text-2xl font-black text-primary">
                    {formatCOP(detail.total)}
                </span>
              </div>
            </div>

            {/* Actions */}
            {detail.estado_compra === "confirmada" && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full py-3 border-2 border-red-500/40 text-red-300 rounded-lg font-bold hover:bg-red-900/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {cancelling ? "Cancelando..." : "Cancelar compra"}
              </button>
            )}
          </div>
        ) : (
          <div className="p-6 text-center text-neutral-muted">
            Error al cargar los detalles
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main PurchaseHistory component ───────────────────────────────────────────
function PurchaseHistory() {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: "", type: "success" }), 3000);
  };

  // ── Load purchases ──
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const fetchPurchases = async () => {
      try {
        const data = await getPurchaseHistory();
        setPurchases(data.compras);
      } catch (err) {
        console.error("Error loading purchases:", err);
        showToast("Error al cargar el historial de compras.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  const getStatusColor = (estado) => {
    switch (estado) {
      case "confirmada":
        return "bg-green-900/40 text-green-300";
      case "cancelada":
        return "bg-red-900/40 text-red-300";
      case "entregada":
        return "bg-blue-900/40 text-blue-300";
      case "enviada":
        return "bg-yellow-900/40 text-yellow-300";
      default:
        return "bg-neutral-600/40 text-neutral-300";
    }
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case "confirmada":
        return "check_circle";
      case "cancelada":
        return "cancel";
      case "entregada":
        return "done_all";
      case "enviada":
        return "local_shipping";
      default:
        return "info";
    }
  };

  return (
    <div className="bg-background-dark font-display text-slate-100 min-h-screen">
      <Navbar />
      <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      <main className="max-w-6xl mx-auto px-4 py-8 mt-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-primary hover:underline transition-all text-sm font-medium mb-4"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Volver
          </button>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">Mis compras</h1>
          <p className="text-neutral-muted text-lg">Historial y detalles de tus pedidos</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-pulse text-center">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
              <p className="text-neutral-muted">Cargando...</p>
            </div>
          </div>
        ) : purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <div className="w-24 h-24 rounded-full bg-neutral-dark border border-neutral-border flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-neutral-muted">
                shopping_bag
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">No tienes compras</h2>
              <p className="text-neutral-muted max-w-xs">
                Comienza a explorar nuestro catálogo y realiza tu primera compra.
              </p>
            </div>
            <button
              onClick={() => navigate("/catalogue")}
              className="flex items-center gap-2 bg-primary text-background-dark font-bold px-6 py-3 rounded-xl hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined">import_contacts</span>
              Explorar catálogo
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="bg-neutral-dark border border-neutral-border rounded-xl p-6 hover:border-neutral-border/80 transition-all cursor-pointer"
                onClick={() => {
                  setSelectedPurchaseId(purchase.id);
                  setDetailModalOpen(true);
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Order number and date */}
                  <div>
                    <p className="text-neutral-muted text-sm mb-1">Número de compra</p>
                    <p className="text-xl font-bold text-white">#{purchase.id}</p>
                    <p className="text-neutral-muted text-xs mt-2">
                      {new Date(purchase.created_at).toLocaleDateString("es-CO")}
                    </p>
                  </div>

                  {/* Items count */}
                  <div>
                    <p className="text-neutral-muted text-sm mb-1">Artículos</p>
                    <p className="text-xl font-bold text-white">{purchase.cantidad_items}</p>
                    <p className="text-neutral-muted text-xs mt-2">
                      {purchase.cantidad_items === 1 ? "producto" : "productos"}
                    </p>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-neutral-muted text-sm mb-1">Estado</p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(purchase.estado_compra)}`}>
                      <span className="material-symbols-outlined text-sm">
                        {getStatusIcon(purchase.estado_compra)}
                      </span>
                      {purchase.estado_compra}
                    </span>
                  </div>

                  {/* Total */}
                  <div className="text-right">
                    <p className="text-text-muted text-sm mb-1">Total</p>
                    <p className="text-2xl font-black text-primary">
                       {formatCOP(purchase.total)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Purchase Detail Modal */}
      <PurchaseDetailModal
        purchaseId={selectedPurchaseId}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onCancel={() => {
          showToast("Compra cancelada exitosamente", "success");
          // Reload purchases
          const fetchPurchases = async () => {
            try {
              const data = await getPurchaseHistory();
              setPurchases(data.compras);
            } catch (err) {
              console.error("Error reloading purchases:", err);
            }
          };
          fetchPurchases();
        }}
      />

      <Toast message={toast.message} type={toast.type} />
    </div>
  );
}

export default PurchaseHistory;
