import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAlgorithms } from '../../contexts/algorithm-context';
import Footer from './Footer';
import { cn } from '../../lib/utils';
export default function Layout() {
  const { algorithms, isLoading, error, retry } = useAlgorithms();
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-blue-700 text-white p-3 rounded"
      >
        Skip to content
      </a>
      <nav
        aria-label="Main navigation"
        className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40"
      >
        <div className="container mx-auto px-4 h-16 flex justify-between items-center gap-4">
          <NavLink to="/" className="text-xl font-bold whitespace-nowrap">
            Algo<span className="text-blue-500">Visualizer</span>
          </NavLink>
          <div className="flex gap-2 overflow-auto">
            {isLoading ? (
              <span role="status">Connecting...</span>
            ) : (
              algorithms &&
              Object.keys(algorithms).map((category) => (
                <NavLink
                  key={category}
                  to={`/${category}`}
                  className={({ isActive }) =>
                    cn(
                      'px-4 py-2 rounded-full text-sm capitalize',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300',
                    )
                  }
                >
                  {category}
                </NavLink>
              ))
            )}
          </div>
        </div>
      </nav>
      {!dismissed && (
        <div className="lg:hidden flex gap-3 items-center p-3 bg-amber-950 text-amber-200 text-sm">
          <p>
            The visualizer works best on a larger screen. Keyboard controls are
            available for grids and graphs.
          </p>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="underline"
          >
            Dismiss
          </button>
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="container mx-auto mt-4 p-4 bg-red-950 border border-red-700 rounded flex items-center justify-between gap-3"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={retry}
            className="px-4 py-2 rounded bg-blue-600"
          >
            Retry
          </button>
        </div>
      )}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 container mx-auto p-4 lg:px-8"
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
