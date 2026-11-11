import { describe, expect, it } from 'vitest';
import { parseAlgorithms, parseMessage } from './protocol';
const frame = {
  type: 'visit_node',
  payload: {},
  line: 1,
  message: 'Visit A',
  snapshot: { type: 'graph', visited: ['A'], path: [] },
};
const metadata = {
  name: 'A*',
  description: 'Search',
  pseudocode: ['search'],
  input_type: 'graph_grid',
  visualizer: 'grid_2d',
  pros: [],
  cons: [],
  complexity: { time: 'O(V)', space: 'O(V)' },
};
describe('renderable protocol boundaries', () => {
  it('accepts signed distances, coordinate parents, and exclusive sorting boundaries', () => {
    const learning = {
      explanation: 'Relax an edge',
      distances: { A: -2.5, B: 0 },
      parents: { B: 'A', C: [0, 1] },
      boundary: [0, 100],
    };
    expect(parseMessage(JSON.stringify({ ...frame, learning }))).toEqual({
      ...frame,
      learning,
    });
  });
  it.each([
    { explanation: { html: 'object cannot be a React child' } },
    { explanation: 'x'.repeat(2001) },
    { boundary: '0, 1' },
    { boundary: [{ index: 1 }] },
    { boundary: [-1] },
    { distances: { A: { value: 1 } } },
    { distances: { A: '2' } },
    { parents: { B: { node: 'A' } } },
    { parents: { B: [0, 100] } },
  ])(
    'rejects malformed learning state before a panel attempts to render it: %j',
    (learning) => {
      expect(() =>
        parseMessage(JSON.stringify({ ...frame, learning })),
      ).toThrow(/Invalid/);
    },
  );
  it('rejects empty categories before workspace selection tries to access missing metadata', () => {
    expect(() => parseAlgorithms({ sorting: {} })).toThrow(/metadata/);
  });
  it.each([
    { heuristics: { manhattan: true } },
    { heuristics: ['manhattan', 1] },
    { supports_negative: 'yes' },
  ])('rejects malformed algorithm capabilities: %j', (extra) => {
    expect(() =>
      parseAlgorithms({ pathfinding: { astar: { ...metadata, ...extra } } }),
    ).toThrow(/metadata/);
  });
});
