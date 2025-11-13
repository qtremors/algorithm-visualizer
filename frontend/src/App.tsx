import { Routes, Route, useParams, Link } from 'react-router-dom';
import { AlgorithmProvider } from './contexts/AlgorithmContext';
import Layout from './components/core/Layout';
import HomePage from './pages/HomePage';
import AlgorithmWorkspace from './pages/AlgorithmWorkspace';
import { ErrorBoundary } from './components/core/ErrorBoundary';
function WorkspaceRoute() {
  const { category } = useParams();
  return (
    <ErrorBoundary key={category}>
      <AlgorithmWorkspace key={category} />
    </ErrorBoundary>
  );
}
export default function App() {
  return (
    <AlgorithmProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
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
    </AlgorithmProvider>
  );
}
