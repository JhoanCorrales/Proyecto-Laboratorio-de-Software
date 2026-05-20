import { useState, useEffect } from "react";
import { getWalletBalance, addFundsToWallet, getCards, getWalletTransactions } from "../services/walletService";

const formatCOP = (value) =>
  `$${Number(value || 0).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

export default function WalletBalance() {
  const [wallet, setWallet] = useState(null);
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  
  // Estado del formulario
  const [selectedCard, setSelectedCard] = useState("");
  const [monto, setMonto] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [walletData, cardsData, transactionsData] = await Promise.all([
          getWalletBalance(),
          getCards(),
          getWalletTransactions(),
        ]);
        setWallet(walletData);
        setCards(cardsData);
        setTransactions(transactionsData);
        setError("");
      } catch (err) {
        console.error(err);
        setError(err.message || "Error al cargar datos del monedero");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddFunds = async (e) => {
    e.preventDefault();
    if (!selectedCard || !monto || monto <= 0) {
      setError("Por favor completa todos los campos correctamente");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const result = await addFundsToWallet({
        monto: parseFloat(monto),
        tarjetaId: parseInt(selectedCard),
      });
      
      // Actualizar wallet
      setWallet(result.wallet);
      
      // Limpiar formulario
      setSelectedCard("");
      setMonto("");
      setShowModal(false);
      
      // Recargar transacciones
      const updatedTransactions = await getWalletTransactions();
      setTransactions(updatedTransactions);
    } catch (err) {
      setError(err.message || "Error al agregar fondos");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-neutral-muted">Cargando datos del monedero...</div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="p-4 bg-red-900/30 text-red-400 rounded-lg border border-red-600/30">
        Error al cargar el monedero
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-900/30 text-red-400 rounded-lg border border-red-600/30">
          {error}
        </div>
      )}

      {/* Tarjetas de Información */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saldo Disponible */}
        <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-muted mb-2">
                Saldo Disponible
              </p>
              <p className="text-4xl font-bold text-primary">
                {formatCOP(wallet.saldo_disponible)}
              </p>
            </div>
            <span className="material-symbols-outlined text-5xl text-primary/50">
              account_balance_wallet
            </span>
          </div>
          <p className="text-sm text-neutral-muted">
            Dinero disponible para realizar compras
          </p>
        </div>

        {/* Total Agregado */}
        <div className="bg-neutral-dark border border-neutral-border/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-neutral-muted mb-2">
                Total Agregado
              </p>
              <p className="text-4xl font-bold text-slate-100">
                {formatCOP(wallet.saldo_total_agregado)}
              </p>
            </div>
            <span className="material-symbols-outlined text-5xl text-neutral-muted/50">
              add_circle
            </span>
          </div>
          <p className="text-sm text-neutral-muted">
            Suma total de fondos agregados al monedero
          </p>
        </div>
      </div>

      {/* Botón Agregar Fondos */}
      <div className="bg-neutral-dark border border-neutral-border/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">
              Agregar Fondos al Monedero
            </h3>
            <p className="text-sm text-neutral-muted">
              Carga dinero desde tu tarjeta de crédito para usar en compras
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all"
          >
            <span className="material-symbols-outlined">add</span>
            Agregar Fondos
          </button>
        </div>
      </div>

      {/* Modal Agregar Fondos */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-neutral-dark border border-neutral-border/30 rounded-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-100">Agregar Fondos</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-muted hover:text-slate-100"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddFunds} className="space-y-6">
              {/* Seleccionar Tarjeta */}
              <div>
                <label className="block text-sm font-medium text-slate-100 mb-2">
                  Seleccionar Tarjeta *
                </label>
                <select
                  value={selectedCard}
                  onChange={(e) => setSelectedCard(e.target.value)}
                  className="w-full px-4 py-2 bg-neutral-accent border border-neutral-border/30 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Elige una tarjeta</option>
                  {cards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.tipo_tarjeta} - {card.numero_enmascarado} ({card.ultimos_digitos})
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div>
                <label className="block text-sm font-medium text-slate-100 mb-2">
                  Monto a Agregar ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="Ej: 50000"
                  className="w-full px-4 py-2 bg-neutral-accent border border-neutral-border/30 rounded-lg text-slate-100 placeholder-neutral-muted focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {monto && (
                <p className="text-sm text-primary mt-2">
                  Estás agregando: {formatCOP(monto)}
                </p>
              )}
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-neutral-border/30 text-slate-100 rounded-lg hover:bg-neutral-accent/50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Procesando..." : "Confirmar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historial de Transacciones */}
      <div>
        <h3 className="text-xl font-bold text-slate-100 mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">
            receipt_long
          </span>
          Historial de Transacciones
        </h3>
        
        {transactions.length === 0 ? (
          <div className="bg-neutral-dark border border-neutral-border/30 rounded-xl p-8 text-center">
            <p className="text-neutral-muted">No hay transacciones registradas</p>
          </div>
        ) : (
          <div className="bg-neutral-dark border border-neutral-border/30 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-accent/50 border-b border-neutral-border/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-widest text-neutral-muted font-medium">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left text-xs uppercase tracking-widest text-neutral-muted font-medium">
                      Tipo
                    </th>
                    <th className="px-6 py-4 text-right text-xs uppercase tracking-widest text-neutral-muted font-medium">
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-border/20">
                  {transactions.map((transaction) => {
                    const isIngreso = transaction.tipo_transaccion === "ingreso" || transaction.tipo_transaccion === "recarga";
                    const isEgreso = transaction.tipo_transaccion === "egreso" || transaction.tipo_transaccion === "compra";
                    
                    return (
                      <tr key={transaction.id} className="hover:bg-neutral-accent/20 transition-colors">
                        <td className="px-6 py-4 text-slate-100">
                          {new Date(transaction.created_at).toLocaleDateString("es-CO")}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                            isIngreso 
                              ? "bg-green-900/30 text-green-400 border border-green-600/30" 
                              : isEgreso 
                              ? "bg-red-900/30 text-red-400 border border-red-600/30"
                              : "bg-blue-900/30 text-blue-400 border border-blue-600/30"
                          }`}>
                            <span className="material-symbols-outlined text-sm">
                              {isIngreso ? "add_circle" : isEgreso ? "remove_circle" : "swap_horiz"}
                            </span>
                            {transaction.tipo_transaccion === "ingreso" || transaction.tipo_transaccion === "recarga"
                              ? "Ingreso"
                              : transaction.tipo_transaccion === "egreso" || transaction.tipo_transaccion === "compra"
                              ? "Egreso"
                              : "Transferencia"
                            }
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-right font-bold ${
                          isIngreso ? "text-green-400" : isEgreso ? "text-red-400" : "text-slate-100"
                        }`}>
                          {isIngreso ? "+" : isEgreso ? "-" : ""}
                          {formatCOP(transaction.monto)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
