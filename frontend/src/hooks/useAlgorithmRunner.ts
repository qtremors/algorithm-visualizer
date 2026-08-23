import { useState, useCallback, useEffect, useRef } from 'react';
import type { AlgorithmStep } from '../types';

// --- DYNAMIC CONFIGURATION ---
const HOST = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD && typeof window !== 'undefined' ? window.location.host : '127.0.0.1:8000');
// If on HTTPS, use WSS (Secure WebSocket), otherwise use WS
const PROTOCOL = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const WS_URL = `${PROTOCOL}${HOST}/ws/visualize`;

export const useAlgorithmRunner = (category?: string, algorithmName?: string) => {
  const [steps, setSteps] = useState<AlgorithmStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    setSteps([]);
    setError(null);

    // Cleanup when category/algorithm changes
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [category, algorithmName]);

  // Comprehensive cleanup on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []);

  const resetSteps = useCallback(() => {
    setSteps([]);
    setIsRunning(false);
    setError(null);
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  const runAlgorithm = useCallback((data: any) => {
    if (!category || !algorithmName) {
      setError("No algorithm selected");
      return;
    }

    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.close();
    }

    setSteps([]);
    setIsRunning(true);
    setError(null);

    const ws = new WebSocket(`${WS_URL}/${category}/${algorithmName}`);
    socketRef.current = ws;
    
    const receivedSteps: AlgorithmStep[] = [];

    ws.onopen = () => {
      // Check if we haven't unmounted or replaced this socket
      if (socketRef.current === ws) {
        ws.send(JSON.stringify(data));
      }
    };

    ws.onmessage = (event) => {
      if (socketRef.current === ws) {
        receivedSteps.push(JSON.parse(event.data));
      }
    };

    ws.onclose = (event) => {
      if (socketRef.current === ws) {
        setSteps(receivedSteps);
        setIsRunning(false);
        socketRef.current = null;
        
        // 1000 is normal closure
        if (receivedSteps.length === 0 && event.code !== 1000) {
          setError(`Algorithm execution failed: ${event.reason || 'Unknown error'}`);
        }
      }
    };

    ws.onerror = (event) => {
      if (socketRef.current === ws) {
        console.error('WebSocket Error:', event);
        setError('Connection to visualization server failed.');
        setIsRunning(false);
        socketRef.current = null;
      }
    };

  }, [category, algorithmName]);

  return { steps, isRunning, error, runAlgorithm, resetSteps };
};