import { NavLink, Outlet } from 'react-router-dom';
import { useAlgorithms } from '../../contexts/AlgorithmContext.tsx';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils.ts';

export default function Layout() {
  const { algorithms, isLoading } = useAlgorithms();

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-gray-800 shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex-shrink-0 flex items-center">
              <NavLink to="/" className="text-xl font-bold text-white">
                AlgoVisualizer
              </NavLink>
            </div>
            <div className="flex items-center space-x-4">
              {isLoading ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                algorithms &&
                Object.keys(algorithms).map((category) => (
                  <NavLink
                    key={category}
                    to={`/${category}`}
                    className={({ isActive }) =>
                      cn(
                        'text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium',
                        isActive && 'bg-gray-900 text-white'
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
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}