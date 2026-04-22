import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Wallet() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("cards");
  const [cards, setCards] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [monthlySpending, setMonthlySpending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData(token);
  }, [navigate]);

  const fetchData = async (token) => {
    try {
      setLoading(true);
      setError("");

      // Obtener tarjetas
      const cardsRes = await fetch("http://localhost:4003/api/payment/cards", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (cardsRes.ok) {
        const cardsData = await cardsRes.json();
        setCards(cardsData.cards || []);
      }

      // Obtener gasto mensual
      const spendingRes = await fetch("http://localhost:4003/api/payment/monthly-spending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (spendingRes.ok) {
        const spendingData = await spendingRes.json();
        setMonthlySpending(spendingData.monthlySpending);
      }

      // Obtener historial de compras
      const purchasesRes = await fetch("http://localhost:4003/api/payment/purchases", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (purchasesRes.ok) {
        const purchasesData = await purchasesRes.json();
        setPurchases(purchasesData.purchases || []);
      }
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = () => {
    navigate("/payment/add");
  };

  const handleDeleteCard = (cardId) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta tarjeta?")) {
      deleteCard(cardId);
    }
  };

  const deleteCard = async (cardId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:4003/api/payment/cards/${cardId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setCards((prev) => prev.filter((card) => card.id !== cardId));
        alert("Tarjeta eliminada correctamente");
      } else {
        const error = await response.json();
        alert(error.error || "Error al eliminar la tarjeta");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión");
    }
  };

  const handleSetDefault = (cardId) => {
    setCardDefault(cardId);
  };

  const setCardDefault = async (cardId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:4003/api/payment/cards/${cardId}/default`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setCards((prev) =>
          prev.map((card) => ({
            ...card,
            es_principal: card.id === cardId,
          }))
        );
        alert("Tarjeta establecida como predeterminada");
      } else {
        alert("Error al actualizar tarjeta");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión");
    }
  };

  return (
    <div className="dark min-h-screen bg-background-dark text-slate-100">
      <Navbar />

      <div className="pt-20 lg:pt-24 pb-12">
        <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto px-4 lg:px-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-neutral-dark rounded-xl border border-neutral-border/30 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-primary mb-2">
                Mi Cartera
              </h2>
              <p className="text-xs uppercase tracking-widest text-neutral-muted mb-6">
                Gestiona tus pagos
              </p>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveSection("summary")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeSection === "summary"
                      ? "bg-primary/10 text-primary border-r-4 border-primary"
                      : "text-neutral-muted hover:bg-neutral-accent/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    analytics
                  </span>
                  <span className="text-sm font-medium">Resumen</span>
                </button>

                <button
                  onClick={() => setActiveSection("cards")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeSection === "cards"
                      ? "bg-primary/10 text-primary border-r-4 border-primary"
                      : "text-neutral-muted hover:bg-neutral-accent/50"
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    credit_card
                  </span>
                  <span className="text-sm font-medium">Tarjetas</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-3xl font-bold text-slate-100 mb-2">
                Mi Cartera
              </h1>
              <p className="text-neutral-muted">
                Gestiona tus métodos de pago y revisa tus transacciones.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <p className="text-neutral-muted">Cargando datos...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                {/* Financial Summary */}
                {activeSection === "summary" && (
                  <section className="space-y-8">
                    <div>
                      <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">
                          analytics
                        </span>
                        Resumen Financiero
                      </h3>
                      <div className="bg-neutral-dark rounded-xl border border-neutral-border/30 p-8">
                        <div className="mb-6">
                          <p className="text-xs uppercase tracking-widest text-neutral-muted mb-2">
                            Gasto Mensual
                          </p>
                          <p className="text-4xl font-bold text-primary">
                            ${monthlySpending.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">
                          shopping_bag
                        </span>
                        Últimas Compras
                      </h3>
                      {purchases.length === 0 ? (
                        <div className="text-center py-12 bg-neutral-dark rounded-xl border border-neutral-border/30">
                          <p className="text-neutral-muted">No hay compras registradas</p>
                        </div>
                      ) : (
                        <div className="bg-neutral-dark rounded-xl border border-neutral-border/30 overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-neutral-accent/30 border-b border-neutral-border/30">
                                <th className="px-6 py-4 text-left text-xs uppercase tracking-widest text-neutral-muted font-semibold">
                                  Fecha
                                </th>
                                <th className="px-6 py-4 text-left text-xs uppercase tracking-widest text-neutral-muted font-semibold">
                                  Libro / Servicio
                                </th>
                                <th className="px-6 py-4 text-right text-xs uppercase tracking-widest text-neutral-muted font-semibold">
                                  Monto
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-border/30">
                              {purchases.map((purchase) => (
                                <tr
                                  key={purchase.id}
                                  className="hover:bg-primary/5 transition-colors"
                                >
                                  <td className="px-6 py-4 text-sm text-neutral-muted">
                                    {new Date(purchase.fecha).toLocaleDateString("es-CO")}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      {purchase.items[0]?.portada_url && (
                                        <div className="w-8 h-10 bg-neutral-accent rounded flex-shrink-0 overflow-hidden">
                                          <img
                                            src={purchase.items[0].portada_url}
                                            alt={purchase.items[0].titulo}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      )}
                                      <span className="text-slate-100 font-medium">
                                        {purchase.items[0]?.titulo || "Compra sin detalles"}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-right font-bold text-primary">
                                    ${purchase.total?.toLocaleString("es-CO", {
                                      minimumFractionDigits: 0,
                                    })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="p-4 text-center border-t border-neutral-border/30">
                            <button className="text-neutral-muted hover:text-primary transition-colors text-sm font-bold uppercase tracking-wider">
                              Ver historial completo
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* My Cards Section */}
                {activeSection === "cards" && (
                  <section>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">
                          payments
                        </span>
                        Mis Tarjetas
                      </h3>
                      <button
                        onClick={handleAddCard}
                        className="flex items-center gap-1 text-primary hover:text-primary/80 font-bold text-sm active:scale-95 transition-transform"
                      >
                        <span className="material-symbols-outlined text-xl">
                          add_circle
                        </span>
                        Agregar tarjeta
                      </button>
                    </div>

                    {cards.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-neutral-muted mb-4">
                          No tienes tarjetas registradas
                        </p>
                        <button
                          onClick={handleAddCard}
                          className="bg-primary text-background-dark font-bold px-6 py-2 rounded-lg hover:bg-primary/90"
                        >
                          Agregar tu primera tarjeta
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cards.map((card) => (
                          <div
                            key={card.id}
                            className="bg-neutral-dark rounded-xl border border-neutral-border/30 p-6 relative overflow-hidden group hover:border-primary/50 transition-all"
                          >
                            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                              <span className="material-symbols-outlined text-4xl">
                                credit_card
                              </span>
                            </div>

                            <div className="relative z-10">
                              <p className="text-lg font-bold text-white mb-1">
                                {card.tipo_tarjeta}
                              </p>
                              <p className="text-neutral-muted font-mono">
                                {card.numero_enmascarado}
                              </p>

                              <div className="mt-8 flex justify-between items-center">
                                <span
                                  className={`text-xs font-bold px-3 py-1 rounded ${
                                    card.es_principal
                                      ? "bg-primary/20 text-primary"
                                      : "bg-neutral-accent/30 text-neutral-muted"
                                  }`}
                                >
                                  {card.es_principal ? "PREFERIDA" : "SECUNDARIA"}
                                </span>
                                <div className="flex items-center gap-2">
                                  {!card.es_principal && (
                                    <button
                                      onClick={() => handleSetDefault(card.id)}
                                      className="text-primary hover:text-primary/80 p-2 rounded-lg transition-colors active:scale-95"
                                      title="Establecer como predeterminada"
                                    >
                                      <span className="material-symbols-outlined text-xl">
                                        check_circle
                                      </span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteCard(card.id)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded-lg transition-colors active:scale-95"
                                  >
                                    <span className="material-symbols-outlined text-xl">
                                      delete
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </div>

              {/* Right Sidebar */}
              <aside className="space-y-6">
                {/* Security Info */}
                <div className="bg-neutral-dark rounded-xl border border-neutral-border/30 p-6">
                  <h5 className="text-xs uppercase tracking-widest text-neutral-muted mb-4 font-semibold">
                    Seguridad de Cuenta
                  </h5>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary mt-0.5 flex-shrink-0">
                        verified_user
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-100">
                          Datos Encriptados
                        </p>
                        <p className="text-xs text-neutral-muted">
                          Tus transacciones están protegidas con seguridad
                          bancaria de nivel militar.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary mt-0.5 flex-shrink-0">
                        receipt_long
                      </span>
                      <div>
                        <p className="text-sm font-bold text-slate-100">
                          Recibos Digitales
                        </p>
                        <p className="text-xs text-neutral-muted">
                          Todas tus compras generan un comprobante fiscal
                          disponible en tu correo.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
            )}
          </main>
        </div>
      </div>


    </div>
  );
}
