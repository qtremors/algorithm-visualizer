import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAlgorithms } from '../../contexts/AlgorithmContext.tsx';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils.ts';
import Footer from '../../components/core/Footer.tsx';

export default function Layout() {
  const { algorithms, isLoading } = useAlgorithms();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* Navbar */}
      <nav className="bg-gray-900 shadow-md border-b border-gray-800 sticky top-0 z-50 backdrop-blur-md bg-gray-900/80 supports-[backdrop-filter]:bg-gray-900/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <NavLink to="/" className="text-xl font-bold text-white tracking-tight flex items-center gap-2 group">
                 Algo<span className="text-blue-500 group-hover:text-blue-400 transition-colors">Visualizer</span>
              </NavLink>
            </div>
            <div className="flex items-center space-x-3">
              {isLoading ? (
                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
              ) : (
                algorithms &&
                Object.keys(algorithms).map((category) => (
                  <NavLink
                    key={category}
                    to={`/${category}`}
                    className={({ isActive }) =>
                      cn(
                        'px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
                        isActive 
                          ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:bg-blue-500' 
                          : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-600'
                      )
                    }
                  >
                    {capitalize(category)}
                  </NavLink>
                ))
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:px-8">
        <Outlet />
      </main>

      {/* Universal Footer */}
      <Footer />
    </div>
  );
}