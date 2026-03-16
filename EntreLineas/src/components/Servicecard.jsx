function ServiceCard({ icon, title, description, cta }) {
  return (
    <div className="bg-neutral-dark p-10 rounded-2xl border border-primary/10 flex items-start gap-6 hover:border-primary/40 transition-colors">
      <div className="p-4 bg-primary/20 rounded-xl text-primary shrink-0">
        <span className="material-symbols-outlined text-4xl">{icon}</span>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-neutral-muted mb-6">{description}</p>
        <button className="text-primary font-bold flex items-center gap-2 hover:gap-3 transition-all">
          {cta} <span className="material-symbols-outlined">arrow_right_alt</span>
        </button>
      </div>
    </div>
  );
}

export default ServiceCard;