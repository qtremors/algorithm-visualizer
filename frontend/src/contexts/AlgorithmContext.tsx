import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AlgorithmsData } from '../types';

interface AlgorithmContextType {
  algorithms: AlgorithmsData | null;
  isLoading: boolean;
  error: string | null;
}

const AlgorithmContext = createContext<AlgorithmContextType | undefined>(undefined);

// If VITE_API_BASE_URL is set, use it. Otherwise, use localhost.
const HOST = import.meta.env.VITE_API_BASE_URL || '127.0.0.1:8000';
const PROTOCOL = window.location.protocol === 'https:' ? 'https://' : 'http://';
const API_URL = `${PROTOCOL}${HOST}/api/algorithms`;

export const AlgorithmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [algorithms, setAlgorithms] = useState<AlgorithmsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlgorithms = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Failed to fetch algorithms: ${response.statusText}`);
        }
        const data: AlgorithmsData = await response.json();
        setAlgorithms(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlgorithms();
  }, []);

  return (
    <AlgorithmContext.Provider value={{ algorithms, isLoading, error }}>
      {children}
    </AlgorithmContext.Provider>
  );
};

export const useAlgorithms = () => {
  const context = useContext(AlgorithmContext);
  if (context === undefined) {
    throw new Error('useAlgorithms must be used within an AlgorithmProvider');
  }
  return context;
};