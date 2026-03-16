import ServiceCard from "./Servicecard";

const SERVICES = [
  {
    icon: "smart_toy",
    title: "Asistente Virtual",
    description: "¿No sabes qué leer? Nuestro sistema de IA analiza tus gustos y te recomienda tu próxima obsesión literaria.",
    cta: "Consultar a la IA",
  },
  {
    icon: "view_in_ar",
    title: "Exploración 3D",
    description: "Recorre nuestra tienda insignia de forma virtual. Camina entre estanterías y descubre libros en un entorno inmersivo.",
    cta: "Iniciar Tour Virtual",
  },
];

function ServicesSection() {
  return (
    <section className="bg-neutral-dark/30 py-24 border-y border-primary/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-20">
        <div className="grid md:grid-cols-2 gap-12">
          {SERVICES.map((service, i) => (
            <ServiceCard key={i} {...service} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;