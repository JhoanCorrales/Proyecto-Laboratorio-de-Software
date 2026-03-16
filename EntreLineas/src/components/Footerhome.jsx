const NAV_LINKS = ["Catálogo Completo", "Libros Electrónicos", "Audio Libros", "Membresías"];
const SUPPORT_LINKS = ["Centro de Ayuda", "Preguntas Frecuentes", "Envíos y Devoluciones", "Contacto"];
const LEGAL_LINKS = ["Términos de Servicio", "Privacidad", "Cookies"];
const SOCIAL_ICONS = ["share", "camera", "mail"];

function Footerhome() {
  return (
    <footer className="bg-background-dark border-t border-primary/10 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-20 grid md:grid-cols-4 gap-12 mb-16">
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-primary">
            <span className="material-symbols-outlined text-3xl shrink-0">menu_book</span>
            <h2 className="text-xl font-bold tracking-tight text-white">Entre Líneas</h2>
          </div>
          <p className="text-neutral-muted text-sm leading-relaxed">
            Conectando lectores con mundos infinitos desde 2024. Tu biblioteca digital de confianza para la era moderna.
          </p>
          <div className="flex gap-4">
            {SOCIAL_ICONS.map((icon) => (
              <a key={icon} className="w-10 h-10 rounded-full bg-neutral-dark flex items-center justify-center hover:bg-primary/20 transition-colors text-white" href="#">
                <span className="material-symbols-outlined text-xl">{icon}</span>
              </a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Navegación</h4>
          <ul className="space-y-4 text-sm text-neutral-muted">
            {NAV_LINKS.map((item) => (
              <li key={item}><a className="hover:text-primary transition-colors" href="#">{item}</a></li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">Soporte</h4>
          <ul className="space-y-4 text-sm text-neutral-muted">
            {SUPPORT_LINKS.map((item) => (
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
        <p className="text-xs text-neutral-muted/60">© 2026 Entre Líneas. Todos los derechos reservados.</p>
        <div className="flex gap-8 text-xs text-neutral-muted/60">
          {LEGAL_LINKS.map((item) => (
            <a key={item} className="hover:text-primary" href="#">{item}</a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default Footerhome;