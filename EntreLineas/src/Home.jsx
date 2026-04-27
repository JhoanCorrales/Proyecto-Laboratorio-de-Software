import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import FeaturedBooks from "./components/FeaturedBooks";
import ServicesSection from "./components/ServicesSection";
import CategoriesSection from "./components/CategoriesSection";
import Footerhome from "./components/Footerhome";
import AuthRequiredModal from "./components/AuthRequiredModal";

function Home() {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    // Si el usuario es Root, redirigir a role-management
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.roles && payload.roles.includes("Root")) {
          navigate("/role-management", { replace: true });
        }
      } catch {
        // Token inválido, permitir que se muestre la página
      }
    }
  }, [navigate]);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
      <Navbar />
      <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <Hero />
      <FeaturedBooks onAuthRequired={() => setShowAuthModal(true)} />
      <ServicesSection />
      <CategoriesSection />
      <Footerhome />
    </div>
  );
}

export default Home;