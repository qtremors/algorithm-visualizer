import { useState, useCallback, useEffect } from 'react';
import type { AlgorithmStep } from '../types';

const API_HOST = import.meta.env.VITE_API_BASE_URL || '127.0.0.1:8000';
const WS_URL = `ws://${API_HOST}/ws/visualize`;

export const useAlgorithmRunner = (category?: string, algorithmName?: string) => {
  const [steps, setSteps] = useState<AlgorithmStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSteps([]);
    setError(null);
  }, [category, algorithmName]);

  const resetSteps = useCallback(() => {
    setSteps([]);
    setIsRunning(false);
    setError(null);
  }, []);

  const runAlgorithm = useCallback((data: any) => {
    if (!category || !algorithmName) {
      setError("No algorithm selected");
      return;
    }

    setSteps([]);
    setIsRunning(true);
    setError(null);

    const ws = new WebSocket(`${WS_URL}/${category}/${algorithmName}`);
    const receivedSteps: AlgorithmStep[] = [];

    ws.onopen = () => {
      ws.send(JSON.stringify(data));
    };

    ws.onmessage = (event) => {
      receivedSteps.push(JSON.parse(event.data));
    };

    ws.onclose = () => {
      setSteps(receivedSteps);
      setIsRunning(false);
      if (receivedSteps.length === 0) {
        setError("Algorithm execution failed or produced no steps.");
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket Error:', event);
      setError('Connection to visualization server failed.');
      setIsRunning(false);
    };

  }, [category, algorithmName]);

  return { steps, isRunning, error, runAlgorithm, resetSteps };
};