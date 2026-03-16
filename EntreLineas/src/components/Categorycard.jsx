function CategoryCard({ label, icon, color, img }) {
  return (
    <a className="group relative aspect-square rounded-2xl overflow-hidden" href="#">
      <div className={`absolute inset-0 ${color} transition-colors z-10`}></div>
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4">
        <span className="material-symbols-outlined text-3xl mb-2 text-white">{icon}</span>
        <span className="font-bold text-white">{label}</span>
      </div>
      <div
        className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
        style={{ backgroundImage: `url('${img}')` }}
      ></div>
    </a>
  );
}

export default CategoryCard;