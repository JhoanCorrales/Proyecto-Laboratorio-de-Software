import { useNavigate } from "react-router-dom";

function CategoryCard({ label, icon, color, img }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (label === "Ver Más") {
      navigate("/categories");
      return;
    }

    const queryMap = {
      "Ficción": "subject:fiction",
      "Historia": "subject:history",
      "Ciencia": "subject:science",
      "Misterio": "subject:mystery",
      "Romance": "subject:romance",
      "No Ficción": "subject:nonfiction",
      "Ciencia Ficción": "subject:science_fiction",
      "Fantasía": "subject:fantasy",
      "Autoayuda": "subject:self-help",
      "Infantil": "subject:children",
      "Thriller": "subject:thriller",
      "Terror": "subject:horror",
      "Biografías": "subject:biography",
      "Filosofía": "subject:philosophy",
      "Psicología": "subject:psychology",
      "Juvenil": "subject:young_adult",
      "Poesía": "subject:poetry",
      "Drama": "subject:drama",
      "Cómics": "subject:comics",
      "Cocina": "subject:cooking",
      "Viajes": "subject:travel",
      "Arte": "subject:art",
      "Tecnología": "subject:technology",
      "Negocios": "subject:business",
    };

    const query = queryMap[label] ?? `subject:${label.toLowerCase()}`;
    navigate(`/catalogue?cat=${encodeURIComponent(query)}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer"
    >
      <div className={`absolute inset-0 ${color} transition-colors z-10`} />
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4">
        <span className="material-symbols-outlined text-3xl mb-2 text-white">{icon}</span>
        <span className="font-bold text-white text-center text-sm">{label}</span>
      </div>
      <div
        className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
        style={{ backgroundImage: `url('${img}')` }}
      />
    </div>
  );
}

export default CategoryCard;