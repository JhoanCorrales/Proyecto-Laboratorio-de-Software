import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FeaturedBooks from "./components/FeaturedBooks";
import ServicesSection from "./components/ServicesSection";
import CategoriesSection from "./components/CategoriesSection";
import Footerhome from "./components/Footerhome";

function Home() {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
      <Navbar />
      <Hero />
      <FeaturedBooks />
      <ServicesSection />
      <CategoriesSection />
      <Footerhome />
    </div>
  );
}

export default Home;