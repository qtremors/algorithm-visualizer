import { createContext, useContext } from 'react';
import type { AlgorithmsData } from '../types';
export interface AlgorithmContextType {
  algorithms: AlgorithmsData | null;
  isLoading: boolean;
  isServerWaking: boolean;
  error: string | null;
  retry: () => void;
}
export const AlgorithmContext = createContext<AlgorithmContextType | undefined>(
  undefined,
);
export function useAlgorithms() {
  const context = useContext(AlgorithmContext);
  if (!context) throw new Error('useAlgorithms requires AlgorithmProvider.');
  return context;
}
