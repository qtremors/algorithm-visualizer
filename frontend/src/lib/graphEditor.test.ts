import { describe, expect, it } from 'vitest';
import { changeWeight, editGraph } from './graphEditor';
import type { GraphInputData } from '../types/input';
const graph = (): GraphInputData => ({
  kind: 'graph',
  nodes: { A: { x: 100, y: 100 }, B: { x: 300, y: 300 } },
  adjacency: { A: {}, B: {} },
  start: 'A',
  end: 'B',
});
describe('graph mutations', () => {
  it('creates a directed connection without adding a reverse edge', () => {
    const original = graph();
    const result = editGraph(
      original,
      { type: 'connectEnd', nodeId: 'B' },
      'edge',
      true,
      'A',
    );
    expect(result.adjacency).toEqual({ A: { B: 1 }, B: {} });
    expect(original.adjacency.A).toEqual({});
  });
  it('preserves existing edge weights and direction', () => {
    const data = graph();
    data.adjacency.A.B = 0;
    expect(
      editGraph(data, { type: 'connectEnd', nodeId: 'B' }, 'edge', true, 'A'),
    ).toBe(data);
    expect(
      editGraph(data, { type: 'connectEnd', nodeId: 'A' }, 'edge', false, 'B'),
    ).toBe(data);
  });
  it('supports distinct reverse directed weights', () => {
    const data = graph();
    data.adjacency.A.B = 9;
    data.adjacency.B.A = 3;
    const result = changeWeight(data, 'A', 'B', -2);
    expect(result.adjacency).toEqual({ A: { B: -2 }, B: { A: 3 } });
    expect(changeWeight(result, 'A', 'B', null).adjacency).toEqual({
      A: {},
      B: { A: 3 },
    });
  });
  it('edits symmetric weights together including zero', () => {
    const data = graph();
    data.adjacency.A.B = data.adjacency.B.A = 0;
    expect(changeWeight(data, 'A', 'B', 5).adjacency).toEqual({
      A: { B: 5 },
      B: { A: 5 },
    });
  });
  it('clamps node movement and keeps adjacency stable', () => {
    const data = graph();
    data.adjacency.A.B = 4;
    const result = editGraph(
      data,
      { type: 'moveNode', nodeId: 'A', point: { x: -10, y: 900 } },
      'move',
      false,
      null,
    );
    expect(result.nodes.A).toEqual({ x: 20, y: 700 });
    expect(result.adjacency).toEqual(data.adjacency);
  });
  it('deleting an endpoint also removes incident edges and endpoint selection', () => {
    const data = graph();
    data.adjacency.A.B = data.adjacency.B.A = 1;
    const result = editGraph(
      data,
      { type: 'nodeClick', nodeId: 'A' },
      'delete',
      false,
      null,
    );
    expect(result.start).toBeUndefined();
    expect(result.adjacency).toEqual({ B: {} });
    expect(result.end).toBe('B');
  });
  it.each([Infinity, NaN, 1000001])('rejects an unsafe weight %s', (weight) => {
    const data = graph();
    data.adjacency.A.B = 1;
    expect(() => changeWeight(data, 'A', 'B', weight)).toThrow();
  });
});
