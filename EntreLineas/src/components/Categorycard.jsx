import { useNavigate } from "react-router-dom";

function CategoryCard({ label, icon, color, img }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (label === "Ver Más") {
      navigate("/categories");
      return;
    }

    navigate(`/catalogue?cat=${encodeURIComponent(label)}`);
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