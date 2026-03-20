import { useNavigate } from "react-router-dom";

function BookCard({ title, author, price, img, agotado = false }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/catalogue/${encodeURIComponent(title)}/details`);
  };
  return (
    <div onClick={handleClick} className={`group flex flex-col bg-neutral-dark border border-neutral-border rounded-xl overflow-hidden shadow-xl transition-all duration-300
      ${agotado ? "opacity-80 grayscale-[0.5]" : "hover:shadow-primary/5 hover:-translate-y-1"}`}
    >
      {/* Imagen */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          alt={title}
          className={`w-full h-full object-cover transition-transform duration-500 ${!agotado ? "group-hover:scale-110" : ""}`}
          src={img}
        />
        {agotado ? (
          <div className="absolute inset-0 bg-background-dark/40 flex items-center justify-center">
            <span className="bg-red-500/90 text-white font-bold py-1 px-4 rounded-full text-xs tracking-widest uppercase">
              Agotado
            </span>
          </div>
        ) : (
          <button className="absolute top-2 right-2 bg-background-dark/60 backdrop-blur-sm rounded-full p-1.5 text-slate-100 cursor-pointer hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-xl">favorite</span>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h4 className={`font-bold text-lg leading-tight mb-1 text-slate-100 ${!agotado ? "group-hover:text-primary transition-colors" : ""}`}>
          {title}
        </h4>
        <p className="text-slate-400 text-sm mb-3">{author}</p>
        <div className="mt-auto flex flex-col gap-4">
          <span className={`font-bold text-xl ${agotado ? "text-slate-400" : "text-primary"}`}>
            {price}
          </span>
          {agotado ? (
            <button
              disabled
              className="w-full bg-neutral-border text-slate-500 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">block</span>
              <span>No disponible</span>
            </button>
          ) : (
            <button className="w-full bg-primary hover:bg-primary/80 text-background-dark font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
              <span>Agregar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookCard;