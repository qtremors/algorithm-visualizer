import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Github, HelpCircle, Heart } from 'lucide-react';
import GuideModal from './GuideModal';
import AboutModal from './AboutModal';

export default function Footer() {
  const location = useLocation();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const getPageCategory = () => {
    const path = location.pathname;
    if (path.includes('sorting')) return 'sorting';
    if (path.includes('pathfinding')) return 'pathfinding';
    return 'home';
  };

  const category = getPageCategory();

  return (
    <>
      <footer className="w-full bg-gray-900 border-t border-gray-800 mt-auto">
        <div className="container relative mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Left: Copyright / Branding */}
          <div className="text-gray-500 text-sm flex items-center gap-1">
            <span>© 2025 AlgoVisualizer. Made with</span>
            <Heart size={12} className="text-red-500 fill-current" />
            <span>by</span>
              <a href="https://github.com/qtremors" target="_blank" rel="noopener noreferrer"
                className="text-white font-medium hover:text-blue-400 transition-colors hover:text-shadow-md hover:text-shadow-blue-500/50">
              Tremors</a>
          </div>

          {/* Center: Dynamic Action Button */}
          <button 
            onClick={() => setIsGuideOpen(true)}
            className="group flex items-center gap-2 px-4 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full transition-all shadow-sm hover:shadow-md hover:border-gray-600 md:absolute md:left-1/2 md:-translate-x-1/2"
          >
            <HelpCircle size={16} className="text-blue-400 group-hover:text-blue-300" />
            <span className="text-sm font-medium text-gray-300 group-hover:text-white">
              {category === 'home' ? 'How it works' : `Guide: ${category.charAt(0).toUpperCase() + category.slice(1)}`}
            </span>
          </button>

          {/* Right: Links */}
          <div className="flex items-center gap-6">
            <a href="https://github.com/qtremors/algorithm-visualizer" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors flex items-center gap-2 text-sm">
              <Github size={16} />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <button 
                onClick={() => setIsAboutOpen(true)}
                className="text-gray-500 hover:text-white transition-colors text-sm"
            >
              About
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <GuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
        category={category} 
      />
      <AboutModal 
        isOpen={isAboutOpen} 
        onClose={() => setIsAboutOpen(false)} 
      />
    </>
  );
}