import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAlgorithms } from '../../contexts/AlgorithmContext.tsx';
import { Loader2, MonitorSmartphone, XCircle, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils.ts';
import Footer from '../../components/core/Footer.tsx';

export default function Layout() {
  const { algorithms, isLoading } = useAlgorithms();
  const { pathname } = useLocation();
  const [isMobileWarningDismissed, setIsMobileWarningDismissed] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <>
      {/* ────────────────────────────────────────────────────────────────
          MOBILE WARNING OVERLAY
          Visible on screens smaller than 'lg'.
          Can be dismissed to show the app (at user's own risk).
         ──────────────────────────────────────────────────────────────── */}
      {!isMobileWarningDismissed && (
        <div className="fixed inset-0 z-[9999] bg-gray-950 flex flex-col items-center justify-center p-8 text-center lg:hidden animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl max-w-sm flex flex-col items-center gap-6">
             <div className="relative">
                <MonitorSmartphone className="w-16 h-16 text-gray-600" />
                <div className="absolute -bottom-1 -right-1 bg-gray-900 rounded-full p-1">
                   <XCircle className="w-8 h-8 text-red-500 fill-gray-900" />
                </div>
             </div>
             
             <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Desktop Optimized</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  AlgoVisualizer features complex interactive grids and graphs that require a mouse and a larger screen for the best experience.
                </p>
             </div>

             <div className="w-full h-px bg-gray-800"></div>

             <div className="space-y-3 w-full">
                <p className="text-xs text-gray-500 font-mono">
                 Please switch to a desktop device.
                </p>
                <button 
                  onClick={() => setIsMobileWarningDismissed(true)}
                  className="w-full py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 border border-gray-700"
                >
                  Continue Anyway <ChevronRight size={12} />
                </button>
             </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────
          MAIN APPLICATION
          - Default: Hidden on mobile (hidden), Visible on desktop (lg:flex)
          - Dismissed: Visible on all (flex)
         ──────────────────────────────────────────────────────────────── */}
      <div 
        className={cn(
          "min-h-screen flex-col bg-gray-950",
          isMobileWarningDismissed ? "flex" : "hidden lg:flex"
        )}
      >
        {/* Navbar */}
        <nav className="bg-gray-900 shadow-md border-b border-gray-800 sticky top-0 z-50 backdrop-blur-md bg-gray-900/80 supports-[backdrop-filter]:bg-gray-900/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex-shrink-0 flex items-center">
                <NavLink to="/" className="text-xl font-bold text-white tracking-tight flex items-center gap-2 group">
                   Algo<span className="text-blue-500 group-hover:text-blue-400 transition-colors">Visualizer</span>
                </NavLink>
              </div>
              <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar">
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
                          'px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border whitespace-nowrap',
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
    </>
  );
}