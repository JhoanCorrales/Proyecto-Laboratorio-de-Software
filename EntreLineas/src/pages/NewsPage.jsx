import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { getNews } from '../services/newsService';

export default function NewsPage() {
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await getNews();
        // Cargar portadas dinámicamente si no existen (similar a Catalogue)
        // Por eficiencia en la lista, podemos depender de las portadas cacheadas o dejar que 
        // un componente hijo las cargue. Para mantenerlo simple, usaremos un componente.
        setNews(data.noticias || []);
      } catch (err) {
        console.error('Error fetching news:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <div className="bg-background-dark font-display text-slate-100 min-h-screen">
      <Navbar />
      <div 
        className="fixed inset-0 z-0 opacity-10 bg-center bg-cover" 
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCsO1KjwnvU9fRI3E_vm9vhLEG9xjWGfqEfmjAZ7jobjHdjH8G7fJdDqMXwLNKfDe5vTiiFyLE-E3SL-k90sua1b-aEHHJPnGdNoLvaX1MVtxJ46hQQG5qO9JakJaPkfeTlP8BTvPEsCbjysAaBMXGAjak1CSeBFyznnBFVSryNmFzcbnkLqbkgSbN_hIrb0p0WYU80dWM5WfaIO3B3AliMfDaaJ0N_rnc5Yfx16ZkZAF7H8LvUDwSe-7y6sWOH89BRszEHcXuUW6U')" }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-background-dark to-background-dark/95" />

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">Noticias y Novedades</h1>
          <p className="text-neutral-muted text-lg max-w-2xl mx-auto">Descubre los últimos lanzamientos, eventos y libros destacados en nuestras tiendas.</p>
        </header>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <span className="material-symbols-outlined text-primary text-5xl animate-spin">autorenew</span>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-20 bg-neutral-dark/40 border border-neutral-border rounded-2xl">
            <span className="material-symbols-outlined text-6xl text-neutral-muted mb-4">newspaper</span>
            <h2 className="text-2xl font-bold text-white mb-2">Aún no hay noticias</h2>
            <p className="text-neutral-muted">Vuelve más tarde para enterarte de nuestras novedades.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {news.map((item) => (
              <NewsCard key={item.id} noticia={item} onNavigate={navigate} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Reusing dynamic cover logic
async function getDynamicCover(titulo, editorial, retries = 3, usePublisher = true) {
  if (!titulo) return null;
  try {
    let url = `https://openlibrary.org/search.json?title=${encodeURIComponent(titulo)}&limit=1&fields=cover_i`;
    if (usePublisher && editorial) url += `&publisher=${encodeURIComponent(editorial)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.docs?.length && data.docs[0].cover_i) {
      return `https://covers.openlibrary.org/b/id/${data.docs[0].cover_i}-L.jpg`;
    }
    if (usePublisher && editorial) return getDynamicCover(titulo, editorial, retries, false);
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return getDynamicCover(titulo, editorial, retries - 1, false);
    }
  } catch {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1500));
      return getDynamicCover(titulo, editorial, retries - 1, usePublisher);
    }
  }
  return null;
}

function NewsCard({ noticia, onNavigate }) {
  const [coverUrl, setCoverUrl] = useState(noticia.portada_url || null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Si no hay URL de portada pero sí hay un libro asociado, la buscamos dinámicamente
    if (!noticia.portada_url && noticia.libro_titulo) {
      let cancelled = false;
      getDynamicCover(noticia.libro_titulo, noticia.libro_editorial).then(url => {
        if (!cancelled && url) {
          setCoverUrl(url);
        }
      });
      return () => { cancelled = true; };
    }
  }, [noticia]);

  const handleImageError = () => {
    // Si la URL guardada en la BD está rota, intentamos buscar una dinámica
    if (noticia.libro_titulo) {
      setCoverUrl(null);
      getDynamicCover(noticia.libro_titulo, noticia.libro_editorial).then(url => {
        if (url) setCoverUrl(url);
      });
    }
  };

  return (
    <article className="bg-neutral-dark/80 border border-neutral-border rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:border-primary/30 transition-all duration-300 flex flex-col md:flex-row group">
      
      {/* Cover Side */}
      <div className="md:w-1/3 relative bg-slate-900 min-h-[250px] flex items-center justify-center overflow-hidden">
        {coverUrl ? (
           <>
             <img src={coverUrl} onError={handleImageError} className="absolute inset-0 w-full h-full object-cover blur-sm opacity-40 scale-110 group-hover:scale-100 transition-transform duration-700" alt="Fondo" />
             <img src={coverUrl} onError={handleImageError} className="relative z-10 w-32 md:w-40 h-auto rounded shadow-2xl group-hover:-translate-y-2 transition-transform duration-500" alt="Libro" />
           </>
        ) : (
          <div className="flex flex-col items-center justify-center text-neutral-muted">
            <span className="material-symbols-outlined text-5xl mb-2">menu_book</span>
            <span className="text-sm font-medium">Libro relacionado</span>
          </div>
        )}
      </div>

      {/* Content Side */}
      <div className="md:w-2/3 p-6 md:p-8 flex flex-col justify-between bg-gradient-to-r from-transparent to-neutral-dark/30">
        <div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">campaign</span>
              Novedad
            </span>
            <span className="text-neutral-muted text-sm font-medium bg-neutral-accent px-3 py-1 rounded-full">
              {new Date(noticia.fecha_publicacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
            {noticia.titulo}
          </h2>
          
          {noticia.resumen && (
            <p className="text-slate-300 text-lg mb-4 italic border-l-2 border-primary/50 pl-4">
              {noticia.resumen}
            </p>
          )}
          
          <p className={`text-neutral-muted leading-relaxed whitespace-pre-wrap ${!isExpanded ? 'line-clamp-4' : ''}`}>
            {noticia.contenido}
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-sm">person</span>
            </div>
            <div>
              <p className="text-xs text-neutral-muted">Publicado por</p>
              <p className="text-sm font-bold text-slate-200">{noticia.autor_noticia || 'Administrador'}</p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full sm:w-auto bg-neutral-accent hover:bg-primary hover:text-background-dark text-white font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isExpanded ? 'Ocultar' : 'Leer completo'}
            <span className="material-symbols-outlined text-sm">
              {isExpanded ? 'expand_less' : 'arrow_forward'}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}
