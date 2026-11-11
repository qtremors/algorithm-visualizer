import { describe, expect, it } from 'vitest';
import { runPhase, playbackRate } from './runState';
import { comparisonCategory, editorHint } from './presentation';
describe('run presentation', () => {
  it('distinguishes completed reception from completed playback', () => {
    expect(
      runPhase({ status: 'completed', length: 10, index: 3, playing: true }),
    ).toBe('playing');
    expect(
      runPhase({ status: 'completed', length: 10, index: 3, playing: false }),
    ).toBe('paused');
    expect(
      runPhase({ status: 'completed', length: 10, index: 9, playing: false }),
    ).toBe('complete');
  });
  it('reports waiting and failures before any steps arrive', () => {
    expect(
      runPhase({ status: 'running', length: 0, index: 0, playing: true }),
    ).toBe('receiving');
    expect(
      runPhase({ status: 'failed', length: 0, index: 0, playing: false }),
    ).toBe('failed');
    expect(
      runPhase({ status: 'idle', length: 0, index: 0, playing: false }),
    ).toBe('idle');
  });
  it('formats rates in units a user can compare', () => {
    expect(playbackRate(200)).toBe('5 steps/s');
    expect(playbackRate(10)).toBe('100 steps/s');
    expect(playbackRate(300)).toBe('3.3 steps/s');
    expect(playbackRate(0)).toBe('—');
  });
  it.each([
    ['/pathfinding', 'pathfinding'],
    ['/compare/trees', 'trees'],
    ['/', 'sorting'],
    ['/unknown', 'sorting'],
  ])('preserves the navigation category from %s', (path, expected) => {
    expect(comparisonCategory(path)).toBe(expected);
  });
  it('explains the chosen tool and why editing is locked', () => {
    expect(editorHint('grid', 'weight', 'node', false)).toContain('cost of 5');
    expect(editorHint('graph', 'wall', 'move', false)).toContain('arrow keys');
    expect(editorHint('grid', 'wall', 'node', true)).toContain('locked');
  });
});
