import { Routes, Route, useParams, Link } from 'react-router-dom';
import { AlgorithmProvider } from './contexts/AlgorithmContext';
import Layout from './components/core/Layout';
import { lazy, Suspense } from 'react';
const HomePage = lazy(() => import('./pages/HomePage'));
const AlgorithmWorkspace = lazy(() => import('./pages/AlgorithmWorkspace'));
const ComparisonWorkspace = lazy(() => import('./pages/ComparisonWorkspace'));
import { ErrorBoundary } from './components/core/ErrorBoundary';
function WorkspaceRoute({ compare = false }: { compare?: boolean }) {
  const { category } = useParams();
  return (
    <ErrorBoundary key={category}>
      {compare ? (
        <ComparisonWorkspace key={category} />
      ) : (
        <AlgorithmWorkspace key={category} />
      )}
    </ErrorBoundary>
  );
}
export default function App() {
  return (
    <AlgorithmProvider>
      <Suspense
        fallback={
          <p role="status" className="p-6">
            Loading workspace...
          </p>
        }
      >
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route
              path="compare/:category"
              element={<WorkspaceRoute compare />}
            />
            <Route path=":category" element={<WorkspaceRoute />} />
            <Route
              path="*"
              element={
                <div>
                  <h1 className="text-xl">Page not found.</h1>
                  <Link to="/" className="text-blue-400">
                    Return home
                  </Link>
                </div>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </AlgorithmProvider>
  );
}
