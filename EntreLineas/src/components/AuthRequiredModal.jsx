import { useNavigate } from "react-router-dom";

const messages = [
  "Cada página leída es un viaje a nuevos mundos. ¿Listo para comenzar el tuyo?",
  "Los libros esperan a quienes se atreven a explorar sus historias. Únete a nosotros.",
  "Entre líneas se esconden las mejores aventuras. Inicia sesión para descubrirlas.",
  "Tu biblioteca personal te espera. Crea tu cuenta y comienza tu colección hoy.",
  "Cada reseña, cada favorito, cada compra... construye tu historia literaria.",
];

function AuthRequiredModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  if (!isOpen) return null;

  const handleLogin = () => {
    navigate("/login");
    onClose();
  };

  const handleRegister = () => {
    navigate("/register");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background-dark border border-primary/30 rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-muted hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        {/* Icono */}
        <div className="flex justify-center mb-6">
          <span className="material-symbols-outlined text-6xl text-primary">menu_book</span>
        </div>

        {/* Título */}
        <h2 className="text-2xl font-bold text-center text-white mb-4">
          ¡Ups! Deberías tener una cuenta
        </h2>

        {/* Subtítulo */}
        <p className="text-center text-neutral-muted text-sm mb-2 font-semibold">
          Inicia sesión para continuar
        </p>

        {/* Mensaje interesante */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <p className="text-center text-slate-100 text-sm leading-relaxed italic">
            "{randomMessage}"
          </p>
        </div>

        {/* Descripción */}
        <p className="text-center text-neutral-muted text-xs mb-6">
          Accede a tu carrito, guarda favoritos y descubre recomendaciones personalizadas.
        </p>

        {/* Botones */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleLogin}
            className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">login</span>
            Iniciar sesión
          </button>
          <button
            onClick={handleRegister}
            className="w-full border-2 border-primary text-primary hover:bg-primary/10 font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">person_add</span>
            Registrarse
          </button>
        </div>

        {/* Línea divisora con texto */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-neutral-border"></div>
          <span className="text-neutral-muted text-xs">o</span>
          <div className="flex-1 h-px bg-neutral-border"></div>
        </div>

        {/* Botón cerrar modal */}
        <button
          onClick={onClose}
          className="w-full text-neutral-muted hover:text-primary text-sm font-medium transition-colors"
        >
          Continuar navegando
        </button>
      </div>
    </div>
  );
}

export default AuthRequiredModal;
