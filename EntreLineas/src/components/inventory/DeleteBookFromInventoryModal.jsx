import { useState, useEffect } from 'react';
import { booksService } from '../../services/booksService';

export default function DeleteBookFromInventoryModal({
  isOpen,
  onClose,
  storeId,
  book,
  onBookDeleted,
}) {
  const [deleteMode, setDeleteMode] = useState('all'); // 'all' o 'partial'
  const [quantityToDelete, setQuantityToDelete] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && book) {
      setDeleteMode('all');
      setQuantityToDelete('');
      setError('');
    }
  }, [isOpen, book]);

  const handleDeleteAll = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError('');

      await booksService.updateBookInventory(storeId, book.libro_id, {
        cantidadInicial: 0,
      });

      onBookDeleted();
      onClose();
    } catch (err) {
      console.error('Error deleting book:', err);
      setError('Error al eliminar el libro del inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePartial = async () => {
    if (loading) return;

    const quantity = parseInt(quantityToDelete);

    // Validaciones
    if (!quantityToDelete || isNaN(quantity)) {
      setError('Por favor ingresa una cantidad válida');
      return;
    }

    if (quantity <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    if (quantity > book.stock) {
      setError(`No puedes eliminar más de ${book.stock} libros`);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const newStock = book.stock - quantity;

      await booksService.updateBookInventory(storeId, book.libro_id, {
        cantidadInicial: newStock,
      });

      onBookDeleted();
      onClose();
    } catch (err) {
      console.error('Error deleting partial books:', err);
      setError('Error al actualizar el inventario');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !book) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-dark/80 rounded-xl border border-neutral-border/50 shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-border/30">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-400 text-2xl">delete</span>
            <h2 className="text-xl font-bold text-slate-100">Eliminar Libro del Inventario</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-muted hover:text-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="px-6 py-4">
          {/* Información del libro */}
          <div className="bg-neutral-accent/30 rounded-lg p-4 mb-4 border border-neutral-border/30">
            <p className="text-sm text-neutral-muted mb-1">Libro</p>
            <p className="font-bold text-slate-100">{book.titulo}</p>
            <p className="text-sm text-neutral-muted mt-2">Stock actual: <span className="text-primary font-bold">{book.stock} unidades</span></p>
          </div>

          {/* Opciones de eliminación */}
          <div className="space-y-4 mb-6">
            {/* Opción 1: Eliminar todo */}
            <label className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors"
                   style={{
                     borderColor: deleteMode === 'all' ? '#8b5cf6' : 'transparent',
                     backgroundColor: deleteMode === 'all' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(0, 0, 0, 0.2)',
                   }}>
              <input
                type="radio"
                name="deleteMode"
                value="all"
                checked={deleteMode === 'all'}
                onChange={() => {
                  setDeleteMode('all');
                  setError('');
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-semibold text-slate-100">Eliminar todo el stock</p>
                <p className="text-xs text-neutral-muted mt-1">
                  Se eliminarán las {book.stock} unidades del inventario
                </p>
              </div>
            </label>

            {/* Opción 2: Eliminar cantidad específica */}
            <label className="flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors"
                   style={{
                     borderColor: deleteMode === 'partial' ? '#8b5cf6' : 'transparent',
                     backgroundColor: deleteMode === 'partial' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(0, 0, 0, 0.2)',
                   }}>
              <input
                type="radio"
                name="deleteMode"
                value="partial"
                checked={deleteMode === 'partial'}
                onChange={() => {
                  setDeleteMode('partial');
                  setError('');
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="font-semibold text-slate-100">Eliminar cantidad específica</p>
                <div className="mt-2">
                  <input
                    type="number"
                    min="1"
                    max={book.stock}
                    value={quantityToDelete}
                    onChange={(e) => {
                      setQuantityToDelete(e.target.value);
                      setError('');
                    }}
                    disabled={deleteMode !== 'partial'}
                    placeholder={`Máximo: ${book.stock}`}
                    className="w-full px-3 py-2 rounded-lg bg-neutral-accent/50 border border-neutral-border text-slate-100 placeholder:text-neutral-muted disabled:opacity-50 focus:border-primary focus:ring-1 focus:ring-primary/30"
                  />
                  {quantityToDelete && deleteMode === 'partial' && (
                    <p className="text-xs text-neutral-muted mt-2">
                      Quedarán: <span className="text-green-400 font-bold">{Math.max(0, book.stock - parseInt(quantityToDelete))}</span> unidades
                    </p>
                  )}
                </div>
              </div>
            </label>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-600/50 text-red-400 rounded-lg flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          {/* Advertencia */}
          <div className="mb-6 p-3 bg-yellow-900/20 border border-yellow-600/30 text-yellow-400 rounded-lg flex items-start gap-2 text-sm">
            <span className="material-symbols-outlined text-base flex-shrink-0 mt-0.5">warning</span>
            <p>Esta acción reducirá el stock del inventario y no puede ser fácilmente revertida.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-border/30 bg-neutral-accent/10">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-neutral-border text-slate-100 hover:bg-neutral-accent/50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={deleteMode === 'all' ? handleDeleteAll : handleDeletePartial}
            disabled={loading || (deleteMode === 'partial' && !quantityToDelete)}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined animate-spin">hourglass_empty</span>
                Eliminando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">delete</span>
                Eliminar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
