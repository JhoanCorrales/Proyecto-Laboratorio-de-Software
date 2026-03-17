function ProfileAvatar({ src, name }) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-4 bg-neutral-accent/30 rounded-lg">
      <div className="relative">
        <div className="size-24 rounded-full bg-neutral-accent border-2 border-neutral-border overflow-hidden">
          <img alt="Profile" className="w-full h-full object-cover" src={src} />
        </div>
        <button className="absolute -bottom-1 -right-1 bg-primary text-background-dark rounded-full p-1 border-2 border-neutral-dark">
          <span className="material-symbols-outlined text-sm">photo_camera</span>
        </button>
      </div>
      <div className="flex flex-col gap-2 flex-1 text-center sm:text-left">
        <p className="text-slate-100 font-bold">Imagen de perfil</p>
        <p className="text-neutral-muted text-xs">Formatos JPG o PNG. Máximo 2MB.</p>
        <button className="mt-2 inline-flex items-center justify-center h-9 px-4 rounded-lg bg-neutral-accent border border-neutral-border text-slate-100 text-sm font-semibold hover:bg-neutral-border transition-colors">
          Cambiar foto
        </button>
      </div>
    </div>
  );
}

export default ProfileAvatar;