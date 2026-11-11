import { describe, expect, it } from 'vitest';
import { parseMessage } from './protocol';
import { algorithmInputError, createTree } from './input';
import { defaultSession, parseSession, serializeSession } from './session';
const frame = {
  type: 'tree_update',
  payload: {},
  message: 'Inserted 2',
  line: 1,
  snapshot: {
    type: 'tree',
    root: '2',
    visited: [],
    nodes: [
      { id: '2', value: 2, count: 1, height: 1, left: null, right: null },
    ],
  },
};
describe('tree and signed-distance contracts', () => {
  it('accepts explicit trees and rejects cyclic or disconnected snapshots', () => {
    expect(parseMessage(JSON.stringify(frame)).type).toBe('tree_update');
    const cyclic = structuredClone(frame);
    cyclic.snapshot.nodes[0].left = '2' as unknown as null;
    expect(() => parseMessage(JSON.stringify(cyclic))).toThrow('cyclic');
    const disconnected = structuredClone(frame);
    disconnected.snapshot.root = null as unknown as string;
    expect(() => parseMessage(JSON.stringify(disconnected))).toThrow(
      'Disconnected',
    );
  });
  it('accepts negative finite Bellman–Ford distances', () => {
    expect(
      parseMessage(
        JSON.stringify({
          type: 'found_path',
          payload: { dist: -2, path: ['A', 'B'] },
          message: 'Found',
          line: 1,
          snapshot: { type: 'graph', visited: ['A', 'B'], path: ['A', 'B'] },
        }),
      ).type,
    ).toBe('found_path');
  });
  it('roundtrips tree operations with a session', () => {
    const session = defaultSession('trees');
    session.drafts.tree.operations.push({ type: 'delete', value: 20 });
    expect(parseSession(serializeSession(session))).toEqual(session);
    const old = JSON.parse(serializeSession(session));
    delete old.drafts.tree;
    expect(parseSession(JSON.stringify(old)).drafts.tree).toEqual(createTree());
  });
  it('prevents running stale tree input while the editor has invalid text', () => {
    expect(algorithmInputError({ ...createTree(), invalid: true })).toContain(
      'Correct',
    );
  });
});
