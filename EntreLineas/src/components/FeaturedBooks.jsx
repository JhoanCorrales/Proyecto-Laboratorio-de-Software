import BookCard from "./BookCard";

const BOOKS = [
  { title: "La Sombra del Viento", author: "Carlos Ruiz Zafón", price: "$18.99", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAAe2B9xQRXEWdR6W0PdQLgpZhbTgk9rwh8eDf4S-av2LKkjM7Jb8wpnVXUNP1rZ-c9eXNzrSuhp6RHqIZb3glwBWYngcHM0sCdAVxDbwRacd80CJk25uIEvotZ6nJli93G9MxwX9k9NVFmDoZsEuZAlrixE0De_UYSR_6m41S5GCnJ8OvEQ642fNLOtBGfiYCV6gVXO5dnMWv0ZV7Z5-B8nD-u36uN2zJrT6biODWdQA9CXvw1fLIwKlJz-cvDD4q30mfwuHrCQS8" },
  { title: "Cien Años de Soledad", author: "G. García Márquez", price: "$22.50", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuADqVgK871wlUNSdhx5NXgk8kIJEq6V6uEOZuQ0OyopwtfoKTnGH724aZa14aCZENUQat41TbH_v6qUqvhgUoUfgxObptsB1sWirj6PJ2Y6FfRUGTrxh-L4-cxGeaRD5QYd1FnWcUdx_BtjtDR-JAOCtNkfQ3_tit1KEbXQoRCRyhpbO6cG0aWqtLs1J0Ys-kneeckfqNpOOvIHFmHHFIPT9PpgqUOQY3rmRXtzTmWjyp5p2FgrDIWoHoVUhPVr2PoTiZn768HiRv8" },
  { title: "El Psicoanalista", author: "John Katzenbach", price: "$15.00", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBkT8-nP22HJ4jzbNMffwMrg6Z1TwznXZkbfOlJCHzVzyvvIKa7-2llltZEyiiTEZ5fZRITLp10kz3qEgG6zWjE9I9w86g7rGuUL5EvWtD-mtMuLa4qfUg9BpKV510XzJQ6dgv4UI6xp10WcTM23QGI2g6cW5nHD9kUamro88Owya6PMTVAYwFX-Mz7duZQnTcrE4xwI0xEQrf2nasNKIuzbmcIHRSDmF-QKDNKQBIH5T4RgbP-gNqyQA-5cSLx_3cNLFOPr-YXo8s" },
  { title: "Elantris", author: "Brandon Sanderson", price: "$24.99", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCu8ngKu-d1RDKBtyEaMmjcsx9pxQMtFrU9nhUALwkp_ca0m5Df2SrfxoSAnKtrtMokTskf7NVCdV0F3kkhgEbCV8gu14-lUe8B9JpyNrb2OrJhjbUdR5DEK2IecvdQPCgbHZoSvn9WN-u8-67RdMm53iMG__Ijnb38HXmy3-NnwoZb4XtKn_0eccgultIzApOQ14E1XpQEcJz917WgZW_HIXwr8qFFjQFnKZrlVaQ1ZzndFlPfwJJEMhlgJVBl9t1lRmRvOFi-RdE" },
  { title: "Dune", author: "Frank Herbert", price: "$19.95", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCERH_-MZuPf7L6x0meStWman69jSJZqEOtkrAwvA7NDkcF_5hQnwOGLC3LX5sAk6ciIazWO-izae6339OcktnxpgcbTuCtgPU47wp1Nl4vAD7kHwupfH2FGqkIKFCiL1qsHx5eh7G30VZ1FJCT1Lg1wo4MrYXKqV250XZx8Ddym2__6DEUs9Q6mzDRWTNKAwP8fi8oWSZqXf74L4yeqvku92FjaSdwWZ9MIrwsitU-xjHSBdCaugNzORXvzWmpNADMu40vefcFW5E" },
];

function FeaturedBooks() {
  return (
    <section className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
      <div className="flex items-end justify-between mb-12">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Libros Destacados</h2>
          <p className="text-neutral-muted">Las lecturas que están marcando tendencia este mes.</p>
        </div>
        <a className="text-primary font-semibold flex items-center gap-1 hover:underline" href="#">
          Ver todos <span className="material-symbols-outlined">chevron_right</span>
        </a>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
        {BOOKS.map((book, i) => (
          <BookCard key={i} {...book} />
        ))}
      </div>
    </section>
  );
}

export default FeaturedBooks;