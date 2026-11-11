import { afterEach, describe, expect, it, vi } from 'vitest';
import { readCatalog, saveCatalog } from './catalog';
import { applyCapabilities } from './capabilities';
import { LIMITS } from './input';
const metadata = {
  name: 'Sort',
  description: 'Sort values',
  pseudocode: ['sort'],
  complexity: { time: 'O(n)', space: 'O(1)' },
  input_type: 'list[int]' as const,
  visualizer: 'bar_chart' as const,
  pros: [],
  cons: [],
};
const caps = { ...LIMITS };
afterEach(() => {
  vi.restoreAllMocks();
  Object.assign(LIMITS, caps);
});
describe('catalog and server capabilities', () => {
  it('restores validated metadata within its age budget', () => {
    saveCatalog({ sorting: { sort: metadata } });
    expect(readCatalog()).toEqual({ sorting: { sort: metadata } });
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 25 * 60 * 60 * 1000);
    expect(readCatalog()).toBeNull();
  });
  it('discards corrupted or unbounded local metadata', () => {
    localStorage.setItem('algoviz.catalog.v1', '{broken');
    expect(readCatalog()).toBeNull();
    localStorage.setItem('algoviz.catalog.v1', 'a'.repeat(300000));
    expect(readCatalog()).toBeNull();
  });
  it('uses server caps without expanding client memory budgets', () => {
    const limits = {
      max_array_size: 20,
      max_grid_rows: 20,
      max_grid_cols: 20,
      max_graph_nodes: 20,
      max_graph_edges: 40,
      max_steps: 999999,
      max_trace_bytes: 999999999,
    };
    applyCapabilities({ limits });
    expect(LIMITS.array).toBe(20);
    expect(LIMITS.steps).toBe(caps.steps);
    expect(LIMITS.bytes).toBe(caps.bytes);
    expect(() =>
      applyCapabilities({ limits: { ...limits, max_steps: -1 } }),
    ).toThrow();
  });
});
