import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AlgorithmContext } from './algorithm-context';
import type { AlgorithmsData } from '../types';
import { apiUrl } from '../lib/api';
import { parseAlgorithms } from '../lib/protocol';
import { readCatalog, saveCatalog } from '../lib/catalog';
import { applyCapabilities } from '../lib/capabilities';

export function AlgorithmProvider({ children }: { children: ReactNode }) {
  const [attempt, setAttempt] = useState(0);
  const [cached] = useState(readCatalog);
  const [state, setState] = useState({
    algorithms: cached as AlgorithmsData | null,
    isLoading: !cached,
    isServerWaking: false,
    error: null as string | null,
  });
  const retry = useCallback(() => {
    setState({
      algorithms: null,
      isLoading: true,
      isServerWaking: false,
      error: null,
    });
    setAttempt((n) => n + 1);
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const wake = setTimeout(() => {
      if (active) setState((s) => ({ ...s, isServerWaking: true }));
    }, 3000);
    const deadline = setTimeout(
      () => controller.abort(new Error('Connection timed out. Please retry.')),
      60_000,
    );
    async function fetchMetadata() {
      try {
        const response = await fetch(apiUrl('/api/algorithms'), {
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(
            `Cannot load algorithms (${response.status}). Please retry.`,
          );
        const algorithms = parseAlgorithms(await response.json());
        if (active) saveCatalog(algorithms);
        if (active)
          setState({
            algorithms,
            isLoading: false,
            isServerWaking: false,
            error: null,
          });
      } catch (error) {
        if (active)
          setState({
            algorithms: cached,
            isLoading: false,
            isServerWaking: false,
            error:
              error instanceof Error
                ? error.message
                : 'Cannot connect to the server. Please retry.',
          });
      } finally {
        clearTimeout(wake);
        clearTimeout(deadline);
      }
    }
    void fetchMetadata();
    void fetch(apiUrl('/api/capabilities'), { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((value) => {
        if (active && value) applyCapabilities(value);
      })
      .catch(() => {
        /* Legacy servers retain conservative client caps. */
      });
    return () => {
      active = false;
      controller.abort();
      clearTimeout(wake);
      clearTimeout(deadline);
    };
  }, [attempt, cached]);
  return (
    <AlgorithmContext.Provider value={{ ...state, retry }}>
      {children}
    </AlgorithmContext.Provider>
  );
}
