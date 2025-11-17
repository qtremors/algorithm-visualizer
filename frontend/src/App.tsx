import { Routes, Route } from 'react-router-dom'
import { AlgorithmProvider } from './contexts/AlgorithmContext.tsx'
import Layout from './components/core/Layout.tsx'
import HomePage from './pages/HomePage.tsx'
import AlgorithmWorkspace from './pages/AlgorithmWorkspace.tsx'

export default function App() {
  return (
    <AlgorithmProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/:category" element={<AlgorithmWorkspace />} />
        </Route>
      </Routes>
    </AlgorithmProvider>
  )
}