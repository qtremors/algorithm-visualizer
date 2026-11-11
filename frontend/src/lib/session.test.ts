import { beforeEach, describe, expect, it } from 'vitest';
import {
  defaultSession,
  initialSession,
  parseSession,
  serializeSession,
  sessionFromUrl,
  shareUrl,
  SESSION_KEY,
} from './session';

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
describe('session boundaries', () => {
  it('roundtrips separate drafts and Unicode seeds', () => {
    const session = defaultSession('pathfinding');
    session.seed = 'maze-λ-世界';
    session.drafts.array = [-3, 0, 2];
    session.drafts.grid.grid[0][0] = 5;
    const restored = parseSession(serializeSession(session));
    expect(restored).toEqual(session);
    expect(restored.drafts.grid).not.toBe(session.drafts.grid);
    expect(sessionFromUrl(new URL(shareUrl(session)).hash)).toEqual(session);
  });
  it('prefers a shared session over local storage', () => {
    const saved = defaultSession();
    saved.seed = 'saved';
    localStorage.setItem(SESSION_KEY, serializeSession(saved));
    const shared = defaultSession();
    shared.seed = 'shared';
    window.history.replaceState(null, '', shareUrl(shared));
    expect(initialSession('sorting').session.seed).toBe('shared');
  });
  it('preserves drafts while changing category and clears category-specific selection', () => {
    const session = defaultSession('sorting');
    session.selection = 'bubble_sort';
    localStorage.setItem(SESSION_KEY, serializeSession(session));
    const loaded = initialSession('pathfinding').session;
    expect(loaded.drafts).toEqual(session.drafts);
    expect(loaded.selection).toBe('');
    expect(loaded.category).toBe('pathfinding');
  });
  it.each([
    (session: ReturnType<typeof defaultSession>) => ({
      ...session,
      version: 7,
    }),
    (session: ReturnType<typeof defaultSession>) => ({
      ...session,
      category: '__proto__',
    }),
    (session: ReturnType<typeof defaultSession>) => ({
      ...session,
      seed: 'x'.repeat(129),
    }),
    (session: ReturnType<typeof defaultSession>) => ({
      ...session,
      drafts: { ...session.drafts, array: [1.2] },
    }),
    (session: ReturnType<typeof defaultSession>) => ({
      ...session,
      drafts: {
        ...session.drafts,
        grid: { ...session.drafts.grid, grid: [[0], [0, 0]] },
      },
    }),
    (session: ReturnType<typeof defaultSession>) => ({
      ...session,
      drafts: {
        ...session.drafts,
        graph: { kind: 'graph', nodes: {}, adjacency: { A: {} } },
      },
    }),
  ])('rejects malformed imported data', (mutate) => {
    expect(() =>
      parseSession(JSON.stringify(mutate(defaultSession()))),
    ).toThrow();
  });
  it('rejects prototype keys, missing references, and nonfinite weights', () => {
    const session = defaultSession();
    session.drafts.graph = JSON.parse(
      '{"kind":"graph","nodes":{"__proto__":{"x":1,"y":1}},"adjacency":{"__proto__":{}}}',
    );
    expect(() => serializeSession(session)).toThrow();
    session.drafts.graph = {
      kind: 'graph',
      nodes: { A: { x: 1, y: 1 } },
      adjacency: { A: { B: 1 } },
    };
    expect(() => serializeSession(session)).toThrow();
  });
  it('rejects excessive input before parsing and recovers from corrupted storage', () => {
    expect(() => parseSession(' '.repeat(65537))).toThrow('64 KiB');
    expect(() => sessionFromUrl('#session=' + 'a'.repeat(90001))).toThrow(
      'large',
    );
    localStorage.setItem(SESSION_KEY, '{broken');
    const loaded = initialSession('sorting');
    expect(loaded.notice).toBeTruthy();
    expect(loaded.session.version).toBe(1);
  });
});

it('preserves saved work when a shared session link is malformed', () => {
  const session = defaultSession('sorting');
  session.drafts.array = [8, 3, 1];
  session.seed = 'work-to-keep';
  localStorage.setItem(SESSION_KEY, serializeSession(session));
  window.history.replaceState(null, '', '/sorting#session=not-valid-json');
  const restored = initialSession('sorting');
  expect(restored.session.drafts.array).toEqual([8, 3, 1]);
  expect(restored.session.seed).toBe('work-to-keep');
  expect(restored.notice).toBeTruthy();
});
