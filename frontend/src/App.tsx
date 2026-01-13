import { Routes, Route } from 'react-router-dom'
import { AlgorithmProvider } from './contexts/AlgorithmContext.tsx'
import Layout from './components/core/Layout.tsx'
import HomePage from './pages/HomePage.tsx'
import AlgorithmWorkspace from './pages/AlgorithmWorkspace.tsx'
import { ErrorBoundary } from './components/core/ErrorBoundary.tsx'

export default function App() {
  return (
    <AlgorithmProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route
            path="/:category"
            element={
              <ErrorBoundary>
                <AlgorithmWorkspace />
              </ErrorBoundary>
            }
          />
        </Route>
      </Routes>
    </AlgorithmProvider>
  )
}