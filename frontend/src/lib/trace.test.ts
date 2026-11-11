import { describe, expect, it } from 'vitest';
import { TraceDecoder } from './trace';
import { parseMessage } from './protocol';
import type { AlgorithmStep } from '../types';

function frame(sequence: number, snapshot: object): AlgorithmStep {
  return parseMessage(JSON.stringify({
    type: 'visit_node', payload: {}, message: 'Visit', line: 1, sequence,
    snapshot: { type: 'graph', added: [], removed: [], path: [], ...snapshot },
  })) as AlgorithmStep;
}
const visited = (step: AlgorithmStep) => !Array.isArray(step.snapshot) && step.snapshot.visited;

describe('checkpoint replay', () => {
  it('reconstructs arbitrary earlier frames independently', () => {
    const decoder = new TraceDecoder();
    const first = decoder.decode(frame(0, { visited: ['A'], added: ['A'] }));
    const second = decoder.decode(frame(1, { added: ['B'] }));
    const third = decoder.decode(frame(2, { removed: ['A'], added: ['C'] }));
    expect(visited(third)).toEqual(['B', 'C']);
    expect(visited(first)).toEqual(['A']);
    expect(visited(second)).toEqual(['A', 'B']);
    const copy = visited(second);
    if (copy) copy.pop();
    expect(visited(second)).toEqual(['A', 'B']);
  });

  it('does not retain every full visited snapshot', () => {
    const decoder = new TraceDecoder();
    const steps: AlgorithmStep[] = [];
    for (let i = 0; i < 400; i++) {
      steps.push(decoder.decode(frame(i, {
        added: [String(i)],
        ...(i % 128 === 0 ? { visited: Array.from({ length: i + 1 }, (_, j) => String(j)) } : {}),
      })));
    }
    expect(visited(steps[399])).toHaveLength(400);
    expect(visited(steps[127])).toHaveLength(128);
    expect(visited(steps[0])).toEqual(['0']);
  });

  it('rejects missing checkpoints, frame gaps, and type changes', () => {
    expect(() => new TraceDecoder().decode(frame(0, { added: ['A'] }))).toThrow('checkpoint');
    const decoder = new TraceDecoder();
    decoder.decode(frame(0, { visited: ['A'] }));
    expect(() => decoder.decode(frame(2, { added: ['B'] }))).toThrow('reordered');
  });

  it('requires another checkpoint within a bounded interval', () => {
    const decoder = new TraceDecoder();
    decoder.decode(frame(0, { visited: [] }));
    for (let i = 1; i < 128; i++) decoder.decode(frame(i, {}));
    expect(() => decoder.decode(frame(128, {}))).toThrow('checkpoint');
  });

  it('retains legacy full snapshots and sorting frames', () => {
    const decoder = new TraceDecoder();
    const step: AlgorithmStep = { type: 'info', payload: {}, snapshot: [2, 1], message: 'Start', line: 1 };
    expect(decoder.decode(step)).toBe(step);
  });

  it.each([
    { added: [false] },
    { removed: 'A' },
    { visited: [null] },
    { path: [5] },
    { added: Array(2501).fill('A') },
  ])('rejects malformed wire deltas: %o', (snapshot) => {
    expect(() => frame(0, snapshot)).toThrow();
  });
});
