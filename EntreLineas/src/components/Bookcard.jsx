function BookCard({ title, author, price, img }) {
  return (
    <div className="group space-y-4">
      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-neutral-dark relative shadow-xl transform group-hover:-translate-y-2 transition-transform duration-300">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 z-10">
          <button className="w-full py-2 bg-primary text-background-dark rounded font-bold text-sm">
            Añadir al Carrito
          </button>
        </div>
        <img alt={title} className="w-full h-full object-cover" src={img} />
      </div>
      <div>
        <h3 className="font-bold text-white group-hover:text-primary transition-colors truncate">{title}</h3>
        <p className="text-sm text-neutral-muted">{author}</p>
        <p className="mt-1 text-primary font-bold">{price}</p>
      </div>
    </div>
  );
}

export default BookCard;