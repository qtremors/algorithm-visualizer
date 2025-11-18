import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AlgorithmsData } from '../types';

interface AlgorithmContextType {
  algorithms: AlgorithmsData | null;
  isLoading: boolean;
  isServerWaking: boolean;
  error: string | null;
}

const AlgorithmContext = createContext<AlgorithmContextType | undefined>(undefined);

// Dynamic Environment Configuration
const HOST = import.meta.env.VITE_API_BASE_URL || '127.0.0.1:8000';
const PROTOCOL = window.location.protocol === 'https:' ? 'https://' : 'http://'; 
const API_URL = `${PROTOCOL}${HOST}/api/algorithms`;

export const AlgorithmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [algorithms, setAlgorithms] = useState<AlgorithmsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isServerWaking, setIsServerWaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let wakeTimer: ReturnType<typeof setTimeout>;

    const fetchAlgorithms = async () => {
      // 1. Start a timer. If fetch takes > 3 seconds, assume server is cold.
      wakeTimer = setTimeout(() => {
        setIsServerWaking(true);
      }, 3000);

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
        // 2. Clear timer and states when done
        clearTimeout(wakeTimer);
        setIsServerWaking(false);
        setIsLoading(false);
      }
    };

    fetchAlgorithms();

    return () => clearTimeout(wakeTimer);
  }, []);

  return (
    <AlgorithmContext.Provider value={{ algorithms, isLoading, isServerWaking, error }}>
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