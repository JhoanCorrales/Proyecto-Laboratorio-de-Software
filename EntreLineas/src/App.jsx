function App() {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">

      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-primary/10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-6 lg:px-20 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-primary">
              <span className="material-symbols-outlined text-3xl shrink-0">menu_book</span>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Entre Líneas</h1>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Catálogo</a>
              <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Noticias</a>
              <a className="text-sm font-medium hover:text-primary transition-colors" href="#">Exploración 3D</a>
            </div>
          </div>
          <div className="flex-1 max-w-md hidden lg:block">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-muted">
                <span className="material-symbols-outlined text-xl">search</span>
              </div>
              <input
                className="block w-full pl-10 pr-3 py-2 border-none bg-slate-200/50 dark:bg-neutral-dark rounded-lg focus:ring-2 focus:ring-primary text-sm placeholder-neutral-muted"
                placeholder="Buscar libros, autores o géneros..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-primary/10 rounded-full transition-colors relative">
              <span className="material-symbols-outlined">shopping_cart</span>
              {/*<span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-background-dark">3</span>*/}
            </button>
            <button className="p-2 hover:bg-primary/10 rounded-full transition-colors">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative min-h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-background-dark via-background-dark/80 to-transparent z-10"></div>
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBbG1b3Kwed1viGb7hKEkzSI9Ya9U9be5hu5NQZsUvwatQXmYpZTIMwI2a7qGjkT2X2naUx-_V0BdBTHjQhKQwcSvZmZQPsBLzZO_YY97Rya_4tHHaPxQ2ZAk_q2XF6nQCtGEE3xY0327mCAYErSBV5GxJmPvCbl36RKE9wyXcaC2DCkL3l-HWtRCfmUOYOgwoyF3tNbg5N9KS0WOJDaEgzudhwTIQEhROyGytvAQLNGFOfnye6oKEzWRhtmJJBdcUIS-0We10ybak')" }}
          ></div>
        </div>
        <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-20 py-20 w-full">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Nueva Colección Digital
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-tight text-white">
              Bienvenido a tu próxima <span className="text-primary">gran historia</span>
            </h1>
            <p className="text-lg text-neutral-muted leading-relaxed">
              Explora miles de títulos desde clásicos atemporales hasta los últimos lanzamientos tecnológicos. Nuestra biblioteca inteligente te ofrece una experiencia de lectura única.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button className="px-8 py-4 bg-primary text-background-dark font-bold rounded-lg hover:brightness-110 transition-all flex items-center gap-2">
                Explorar Catálogo
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button className="px-8 py-4 bg-neutral-dark text-white border border-primary/30 font-bold rounded-lg hover:bg-neutral-dark/80 transition-all">
                Ver Novedades
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Books */}
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
          {[
            { title: "La Sombra del Viento", author: "Carlos Ruiz Zafón", price: "$18.99", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAAe2B9xQRXEWdR6W0PdQLgpZhbTgk9rwh8eDf4S-av2LKkjM7Jb8wpnVXUNP1rZ-c9eXNzrSuhp6RHqIZb3glwBWYngcHM0sCdAVxDbwRacd80CJk25uIEvotZ6nJli93G9MxwX9k9NVFmDoZsEuZAlrixE0De_UYSR_6m41S5GCnJ8OvEQ642fNLOtBGfiYCV6gVXO5dnMWv0ZV7Z5-B8nD-u36uN2zJrT6biODWdQA9CXvw1fLIwKlJz-cvDD4q30mfwuHrCQS8" },
            { title: "Cien Años de Soledad", author: "G. García Márquez", price: "$22.50", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuADqVgK871wlUNSdhx5NXgk8kIJEq6V6uEOZuQ0OyopwtfoKTnGH724aZa14aCZENUQat41TbH_v6qUqvhgUoUfgxObptsB1sWirj6PJ2Y6FfRUGTrxh-L4-cxGeaRD5QYd1FnWcUdx_BtjtDR-JAOCtNkfQ3_tit1KEbXQoRCRyhpbO6cG0aWqtLs1J0Ys-kneeckfqNpOOvIHFmHHFIPT9PpgqUOQY3rmRXtzTmWjyp5p2FgrDIWoHoVUhPVr2PoTiZn768HiRv8" },
            { title: "El Psicoanalista", author: "John Katzenbach", price: "$15.00", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBkT8-nP22HJ4jzbNMffwMrg6Z1TwznXZkbfOlJCHzVzyvvIKa7-2llltZEyiiTEZ5fZRITLp10kz3qEgG6zWjE9I9w86g7rGuUL5EvWtD-mtMuLa4qfUg9BpKV510XzJQ6dgv4UI6xp10WcTM23QGI2g6cW5nHD9kUamro88Owya6PMTVAYwFX-Mz7duZQnTcrE4xwI0xEQrf2nasNKIuzbmcIHRSDmF-QKDNKQBIH5T4RgbP-gNqyQA-5cSLx_3cNLFOPr-YXo8s" },
            { title: "Elantris", author: "Brandon Sanderson", price: "$24.99", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCu8ngKu-d1RDKBtyEaMmjcsx9pxQMtFrU9nhUALwkp_ca0m5Df2SrfxoSAnKtrtMokTskf7NVCdV0F3kkhgEbCV8gu14-lUe8B9JpyNrb2OrJhjbUdR5DEK2IecvdQPCgbHZoSvn9WN-u8-67RdMm53iMG__Ijnb38HXmy3-NnwoZb4XtKn_0eccgultIzApOQ14E1XpQEcJz917WgZW_HIXwr8qFFjQFnKZrlVaQ1ZzndFlPfwJJEMhlgJVBl9t1lRmRvOFi-RdE" },
            { title: "Dune", author: "Frank Herbert", price: "$19.95", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCERH_-MZuPf7L6x0meStWman69jSJZqEOtkrAwvA7NDkcF_5hQnwOGLC3LX5sAk6ciIazWO-izae6339OcktnxpgcbTuCtgPU47wp1Nl4vAD7kHwupfH2FGqkIKFCiL1qsHx5eh7G30VZ1FJCT1Lg1wo4MrYXKqV250XZx8Ddym2__6DEUs9Q6mzDRWTNKAwP8fi8oWSZqXf74L4yeqvku92FjaSdwWZ9MIrwsitU-xjHSBdCaugNzORXvzWmpNADMu40vefcFW5E" },
          ].map((book, i) => (
            <div key={i} className="group space-y-4">
              <div className="aspect-[3/4] rounded-xl overflow-hidden bg-neutral-dark relative shadow-xl transform group-hover:-translate-y-2 transition-transform duration-300">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <button className="w-full py-2 bg-primary text-background-dark rounded font-bold text-sm">Añadir al Carrito</button>
                </div>
                <img alt={book.title} className="w-full h-full object-cover" src={book.img} />
              </div>
              <div>
                <h3 className="font-bold text-white group-hover:text-primary transition-colors truncate">{book.title}</h3>
                <p className="text-sm text-neutral-muted">{book.author}</p>
                <p className="mt-1 text-primary font-bold">{book.price}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Services */}
      <section className="bg-neutral-dark/30 py-24 border-y border-primary/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-20">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-neutral-dark p-10 rounded-2xl border border-primary/10 flex items-start gap-6 hover:border-primary/40 transition-colors">
              <div className="p-4 bg-primary/20 rounded-xl text-primary">
                <span className="material-symbols-outlined text-4xl">smart_toy</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">Asistente Virtual</h3>
                <p className="text-neutral-muted mb-6">¿No sabes qué leer? Nuestro sistema de IA analiza tus gustos y te recomienda tu próxima obsesión literaria.</p>
                <button className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all">
                  Consultar a la IA <span className="material-symbols-outlined">arrow_right_alt</span>
                </button>
              </div>
            </div>
            <div className="bg-neutral-dark p-10 rounded-2xl border border-primary/10 flex items-start gap-6 hover:border-primary/40 transition-colors">
              <div className="p-4 bg-primary/20 rounded-xl text-primary">
                <span className="material-symbols-outlined text-4xl">view_in_ar</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-3">Exploración 3D</h3>
                <p className="text-neutral-muted mb-6">Recorre nuestra tienda insignia de forma virtual. Camina entre estanterías y descubre libros en un entorno inmersivo.</p>
                <button className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all">
                  Iniciar Tour Virtual <span className="material-symbols-outlined">arrow_right_alt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-6 lg:px-20 py-24">
        <h2 className="text-3xl font-bold text-white mb-12 text-center">Explora por Categorías</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {[
            { label: "Ficción", icon: "auto_stories", color: "bg-primary/40 group-hover:bg-primary/20", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAj92CapJ71H32g3PqPo4UpdFGT16MKVHk_5irXvuuMte0fcAvrBEM6YfBbQL02MtpUpGGu7yTZgqDX80Ly1F2anuMgG1obniaofo1ZXECzws6hSGMjsO4YyKgosOCs8NClFWI_bqiCbjVqumsWgUIk3_R50k46p8f6f37yDrfLKAkFN89pfd_-D6alk4QM9lUCYcVvmsAe1un_If6H0WEzHQu2mlPe81NWsroy0EalKn0LZ8suTosOkDEcStGGuAOxigAmmcoHOa4" },
            { label: "Historia", icon: "history_edu", color: "bg-purple-500/40 group-hover:bg-purple-500/20", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3gfAc6vHx4pZLusm5aSDvhMtTA6PW_Ckgrqr4QckuarhsHciYD6cEQoNqJtlrC0gI3vQ3JfbJC_PRyy9s1ohJzSjPk5uob3p1yf8GmJcloKzt1jn7QlhueGa33C5qeAdWiShBdrf_0jSg8lsyNCiFI_MD_46XIO2BH417WoST327GvfyPANzwtTqwMft2R3EOilx-gAmsZgkfoTQvfxdT0-_Sq6NGb_vKQ_77ODQU0NUwjvRQ0UqgoCSZur8M7Z4w0f0_5-tStPc" },
            { label: "Ciencia", icon: "science", color: "bg-emerald-500/40 group-hover:bg-emerald-500/20", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuB_Q0QbGWsCEYGrifim-n2YkOFtfIkSK15Uau5-tlcFFymTMDLMyUqSxatS8z0t3FyeTHQLDg3l2ieNVm1nDnhizd6ImtNtqs1myPqdAjcEWXxINP3v-XKR1yKCKTBZWfkszUeLiYy8-huD1FlyOKqj9taM3TLfVXwgyKo67m2WJTahQ2HMKBcxTRKytbCh73O7O4g2LnUUOI_gXFk6OgrVuz0YriM3iyDiq9YWNFNpEPXr_3vja84VU9ihyTK6_chU58eus2IT3WE" },
            { label: "Misterio", icon: "psychology", color: "bg-orange-500/40 group-hover:bg-orange-500/20", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCMbAC2gGqglYh05xZgz0wkZKimew54sAXsMNKJWk2JaBXGlO4fb8w5PPdC94hZ8yhLszgOHJKFQLfgznv7r_GLVNggvaspBYEKMrbmAELuyrPArSpoIK6NeSJHe-3QxYeEr8ErRPyLW0gChGYmlBSbQih0BrN0aZrXTOWDapKswqRgHcIYY84WdW7Io0lzisiYHSWVomWdfvo96y7qhlSnKdUWlU4j4jQ6PeJXaIJF_zbBxTC2kW3aRagXkOW3pVGs5J7i5zyovQE" },
            { label: "Romance", icon: "favorite", color: "bg-pink-500/40 group-hover:bg-pink-500/20", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBYtIRnkOQ4pBzCuAALLyHAnoexOUmBFuUmgOguHMof-T_hO8_jf4cLzODGS8IAHD-bTTLMR6GV-7AyIer5e9qhdAlwOz1xkYWVfnQQbzmQiyG5aM4zSaXRJoFlxelpwWfY51FDtvwO8EB2Pvks3793yMZ4cLA7gTDCpmZII5ToxWHgQcuTKoMKfyub_Bvhia7h_T8Gm6pOPMgmja1XIaBnzW0tFJSWfiX4MUBBhNj_asUSwf1zB_zQOJsgZKZwyh7Y3xsnMbuH_g" },
            { label: "Ver Más", icon: "grid_view", color: "bg-slate-500/40 group-hover:bg-slate-500/20", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC2LdW0UPI9mIYs2Hjx5xqN2m9t64xACvkq3lnNg45B6_fVuyKoMpwUSU_t7Bsloc9sVGYJw7ioX5L-b4cS_UhcVkN6vj5R2PiXiB5bsKfEO8TAksWcwjJh-ixiXs9iLfCmwSoAdpsf9n_xMvk91N9CcAGp6qmVEE6UxVk0rgVIKuKx2_5Khe-p3YC7LLa00vO57_xr0ZHEC0jfp4gLdj0CDdavYxklcdxgZdujCB_w8WTRWJ_GBcPLKxMOXzbhOAyGaniZ8sJxmA0" },
          ].map((cat, i) => (
            <a key={i} className="group relative aspect-square rounded-2xl overflow-hidden" href="#">
              <div className={`absolute inset-0 ${cat.color} transition-colors z-10`}></div>
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4">
                <span className="material-symbols-outlined text-3xl mb-2 text-white">{cat.icon}</span>
                <span className="font-bold text-white">{cat.label}</span>
              </div>
              <div
                className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                style={{ backgroundImage: `url('${cat.img}')` }}
              ></div>
            </a>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background-dark border-t border-primary/10 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-20 grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 space-y-6">
            <div className="flex items-center gap-3 text-primary">
              <span className="material-symbols-outlined text-3xl shrink-0">menu_book</span>
              <h2 className="text-xl font-bold tracking-tight text-white">Entre Líneas</h2>
            </div>
            <p className="text-neutral-muted text-sm leading-relaxed">
              Conectando lectores con mundos infinitos. Tu biblioteca digital de confianza para la era moderna.
            </p>
            <div className="flex gap-4">
              {["share", "camera", "mail"].map((icon) => (
                <a key={icon} className="w-10 h-10 rounded-full bg-neutral-dark flex items-center justify-center hover:bg-primary/20 transition-colors text-white" href="#">
                  <span className="material-symbols-outlined text-xl">{icon}</span>
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Navegación</h4>
            <ul className="space-y-4 text-sm text-neutral-muted">
              {["Catálogo Completo", "Libros Electrónicos", "Audio Libros", "Membresías"].map((item) => (
                <li key={item}><a className="hover:text-primary transition-colors" href="#">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Soporte</h4>
            <ul className="space-y-4 text-sm text-neutral-muted">
              {["Centro de Ayuda", "Preguntas Frecuentes", "Envíos y Devoluciones", "Contacto"].map((item) => (
                <li key={item}><a className="hover:text-primary transition-colors" href="#">{item}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Newsletter</h4>
            <p className="text-sm text-neutral-muted mb-4">Suscríbete para recibir recomendaciones personalizadas y ofertas exclusivas.</p>
            <div className="space-y-3">
              <input className="w-full bg-neutral-dark border-none rounded-lg text-sm p-3 text-white focus:ring-1 focus:ring-primary" placeholder="Tu correo electrónico" type="email" />
              <button className="w-full py-3 bg-primary text-background-dark font-bold rounded-lg text-sm hover:brightness-110">Suscribirse</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-20 pt-10 border-t border-primary/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-neutral-muted/60">© 2024 Entre Líneas. Todos los derechos reservados.</p>
          <div className="flex gap-8 text-xs text-neutral-muted/60">
            {["Términos de Servicio", "Privacidad", "Cookies"].map((item) => (
              <a key={item} className="hover:text-primary" href="#">{item}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;