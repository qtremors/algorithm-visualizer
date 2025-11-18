import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AlgorithmStep, RunStatus } from '../types';
import type { GraphInputData } from '../types/input';
import { useAlgorithmWorkspace } from './useAlgorithmWorkspace';

const runner = vi.hoisted(() => ({
  steps: [] as AlgorithmStep[],
  isRunning: false,
  status: 'idle' as RunStatus,
  error: null,
  resetSteps: vi.fn(),
  runAlgorithm: vi.fn(),
}));
vi.mock('./useAlgorithmRunner', () => ({ useAlgorithmRunner: () => runner }));
vi.mock('react-router-dom', () => ({ useParams: () => ({ category: 'pathfinding' }) }));
vi.mock('../contexts/algorithm-context', () => ({
  useAlgorithms: () => ({ algorithms: { pathfinding: { dijkstra: {} } }, isLoading: false, error: null }),
}));

const graph: GraphInputData = {
  kind: 'graph',
  nodes: { A: { x: 100, y: 100 }, B: { x: 400, y: 400 } },
  adjacency: { A: { B: 9 }, B: { A: 9 } },
  start: 'A',
  end: 'B',
};
function setup(data = graph) {
  const hook = renderHook(useAlgorithmWorkspace);
  act(() => hook.result.current.setViewMode('graph'));
  act(() => hook.result.current.handleInputUpdate(structuredClone(data)));
  return hook;
}
afterEach(() => {
  runner.steps = [];
  runner.status = 'idle';
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('graph editor data preservation', () => {
  it.each([0, 9])('reconnecting an existing edge preserves its weight %s', (weight) => {
    const { result } = setup({ ...graph, adjacency: { A: { B: weight }, B: { A: weight } } });
    act(() => result.current.setGraphTool('edge'));
    act(() => result.current.handleGraphInteraction({ type: 'connectStart', nodeId: 'A' }));
    act(() => result.current.handleGraphInteraction({ type: 'connectEnd', nodeId: 'B' }));
    expect((result.current.inputData as GraphInputData).adjacency).toEqual({ A: { B: weight }, B: { A: weight } });
    expect(result.current.draggedNode).toBeNull();
  });
  it('creates a new undirected connection with the default weight', () => {
    const { result } = setup({ ...graph, adjacency: { A: {}, B: {} } });
    act(() => result.current.setGraphTool('edge'));
    act(() => result.current.handleGraphInteraction({ type: 'connectStart', nodeId: 'A' }));
    act(() => result.current.handleGraphInteraction({ type: 'connectEnd', nodeId: 'B' }));
    expect((result.current.inputData as GraphInputData).adjacency).toEqual({ A: { B: 1 }, B: { A: 1 } });
  });
  it('reconnecting a directed edge preserves its orientation', () => {
    const { result } = setup({ ...graph, adjacency: { A: { B: 9 }, B: {} } });
    act(() => result.current.setGraphTool('edge'));
    act(() => result.current.handleGraphInteraction({ type: 'connectStart', nodeId: 'B' }));
    act(() => result.current.handleGraphInteraction({ type: 'connectEnd', nodeId: 'A' }));
    expect((result.current.inputData as GraphInputData).adjacency).toEqual({ A: { B: 9 }, B: {} });
  });
  it('editing a directed edge preserves the different reverse weight', () => {
    const { result } = setup({ ...graph, adjacency: { A: { B: 9 }, B: { A: 2 } } });
    vi.spyOn(window, 'prompt').mockReturnValue('4');
    act(() => result.current.handleWeightChange('A', 'B', 9));
    expect((result.current.inputData as GraphInputData).adjacency).toEqual({ A: { B: 4 }, B: { A: 2 } });
  });
  it('deleting a directed edge preserves the reverse connection', () => {
    const { result } = setup({ ...graph, adjacency: { A: { B: 9 }, B: { A: 2 } } });
    act(() => result.current.setGraphTool('delete'));
    act(() => result.current.handleWeightChange('A', 'B', 9));
    expect((result.current.inputData as GraphInputData).adjacency).toEqual({ A: {}, B: { A: 2 } });
  });
});

it.each(['No path found.', 'Shortest path found! Distance: 2'])('keeps the final outcome visible after completion: %s', (message) => {
  runner.steps = [{ type: 'info', snapshot: { type: 'graph', visited: [], path: [] }, payload: {}, message, line: 1 }];
  runner.status = 'completed';
  const { result } = renderHook(useAlgorithmWorkspace);
  expect(result.current.logHistory.at(-1)).toContain(message);
  expect(result.current.logHistory.at(-1)).toContain('Algorithm finished.');
});
