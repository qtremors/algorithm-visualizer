import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AlgorithmProvider } from './AlgorithmContext';
import { useAlgorithms } from './algorithm-context';
import { saveCatalog } from '../lib/catalog';
import { LIMITS } from '../lib/input';
const catalog = {
  sorting: {
    bubble_sort: {
      name: 'Bubble Sort',
      input_type: 'list[int]' as const,
      visualizer: 'bar_chart' as const,
      pseudocode: ['sort'],
      description: 'Sort',
      complexity: { time: 'O(n²)', space: 'O(1)' },
      pros: [],
      cons: [],
    },
  },
};
const response = (data: unknown, status = 200) =>
  ({ ok: status === 200, status, json: async () => data }) as Response;
const wrapper = ({ children }: { children: ReactNode }) => (
  <AlgorithmProvider>{children}</AlgorithmProvider>
);
const originalCaps = { ...LIMITS };
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Object.assign(LIMITS, originalCaps);
});

describe('catalog connection recovery', () => {
  it('keeps a successful catalog usable when a later refresh fails', async () => {
    let fail = false;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.endsWith('/api/capabilities')) return response(null, 404);
        if (fail) throw new Error('Offline');
        return response(catalog);
      }),
    );
    const { result } = renderHook(useAlgorithms, { wrapper });
    await waitFor(() => expect(result.current.algorithms).toEqual(catalog));
    fail = true;
    act(() => result.current.retry());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.algorithms).toEqual(catalog);
    await waitFor(() => expect(result.current.error).toBe('Offline'));
    expect(result.current.algorithms).toEqual(catalog);
  });
  it('exposes saved metadata while the server is unavailable', async () => {
    saveCatalog(catalog);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Offline')));
    const { result } = renderHook(useAlgorithms, { wrapper });
    expect(result.current.algorithms).toEqual(catalog);
    await waitFor(() => expect(result.current.error).toBe('Offline'));
    expect(result.current.isLoading).toBe(false);
  });
  it('times out a hanging capabilities request even after metadata has loaded', async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, options: RequestInit) => {
        if (url.endsWith('/api/algorithms'))
          return Promise.resolve(response(catalog));
        signal = options.signal as AbortSignal;
        return new Promise((_, reject) =>
          signal?.addEventListener('abort', () => reject(signal?.reason)),
        );
      }),
    );
    const { result, unmount } = renderHook(useAlgorithms, { wrapper });
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.algorithms).toEqual(catalog);
    await act(async () => vi.advanceTimersByTimeAsync(60000));
    expect(signal?.aborted).toBe(true);
    expect(result.current.error).toBeNull();
    unmount();
  });
  it('aborts requests when the provider unmounts', () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_: string, options: RequestInit) => {
        signal = options.signal as AbortSignal;
        return new Promise((_, reject) =>
          signal?.addEventListener('abort', () => reject(signal?.reason)),
        );
      }),
    );
    const { unmount } = renderHook(useAlgorithms, { wrapper });
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
