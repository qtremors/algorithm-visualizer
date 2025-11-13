import { describe, expect, it } from 'vitest';
import { createGrid, inputError, parseArray } from './input';
import { parseMessage, parseAlgorithms } from './protocol';
import { graphEdges } from './graph';
import type { GraphInputData } from '../types/input';
describe('input and protocol boundaries', () => {
  it.each([
    '',
    '1.9,2',
    '2oops,3',
    'abc',
    '1,,2',
    '9007199254740992',
    Array(101).fill(1).join(','),
  ])('rejects misleading array input: %s', (text) =>
    expect(() => parseArray(text)).toThrow(),
  );
  it('supports negative and zero integers without changing tokens', () =>
    expect(parseArray(' -5, +2, 0 ')).toEqual([-5, 2, 0]));
  it.each([0, -1, 1.5, NaN, Infinity, 51])(
    'rejects unsafe grid dimensions: %s',
    (rows) => expect(() => createGrid(rows, 2)).toThrow(),
  );
  it('does not permit a blank graph to run', () =>
    expect(inputError({ kind: 'graph', nodes: {}, adjacency: {} })).toContain(
      'Add graph nodes',
    ));
  it('rejects malformed server data', () => {
    expect(() => parseAlgorithms({ sorting: { bad: {} } })).toThrow();
    expect(() =>
      parseMessage(
        JSON.stringify({
          type: 'visit_node',
          line: 1,
          message: 'bad',
          payload: {},
          snapshot: { type: 'grid', visited: ['A'], path: [] },
        }),
      ),
    ).toThrow();
    expect(() =>
      parseMessage(JSON.stringify({ type: 'complete', steps: -1 })),
    ).toThrow();
  });
});
describe('graph edge semantics', () => {
  const graph: GraphInputData = {
    kind: 'graph',
    nodes: { A: { x: 0, y: 0 }, B: { x: 1, y: 0 }, C: { x: 2, y: 0 } },
    adjacency: { A: { B: 1, C: 5 }, B: { A: 1, C: 1 }, C: { A: 5, B: 1 } },
    start: 'A',
    end: 'C',
  };
  it('deduplicates undirected edges and leaves a non-path chord unhighlighted', () => {
    const edges = graphEdges(graph, ['A', 'B', 'C']);
    expect(edges).toHaveLength(3);
    expect(edges.filter((edge) => edge.isPath)).toHaveLength(2);
    expect(
      edges.find((edge) => edge.source === 'A' && edge.target === 'C')?.isPath,
    ).toBe(false);
  });
  it('retains directed edges and their orientation', () => {
    const directed = {
      ...graph,
      adjacency: { A: { B: 1 }, B: { A: 2 }, C: {} },
    };
    const edges = graphEdges(directed, ['A', 'B']);
    expect(edges).toHaveLength(2);
    expect(edges.every((edge) => edge.directed)).toBe(true);
    expect(edges.find((edge) => edge.source === 'B')?.isPath).toBe(false);
  });
});
