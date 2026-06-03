import { useNavigate } from 'react-router-dom';
import Chatbot from '../components/Chatbot';

function AIRecommendationsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Back Button - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-background-dark to-transparent p-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded font-semibold transition-colors shadow-lg"
        >
          <span>←</span>
          Volver
        </button>
      </div>

      {/* Chatbot Component */}
      <div className="pt-20">
        <Chatbot />
      </div>
    </div>
  );
}

export default AIRecommendationsPage;
