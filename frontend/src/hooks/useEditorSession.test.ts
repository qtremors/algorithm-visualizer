import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useEditorSession, sessionReducer } from './useEditorSession';
import { defaultSession, parseSession, SESSION_KEY } from '../lib/session';

describe('editor history', () => {
  it('undoes and redoes edits across draft types', () => {
    const { result } = renderHook(() => useEditorSession('sorting'));
    const original = result.current.session.drafts.array;
    act(() => result.current.update([3, 1]));
    act(() => result.current.setView('graph'));
    act(() => result.current.undo());
    expect(result.current.session.view).toBe('grid');
    expect(result.current.session.drafts.array).toEqual([3, 1]);
    act(() => result.current.undo());
    expect(result.current.session.drafts.array).toEqual(original);
    act(() => result.current.redo());
    expect(result.current.session.drafts.array).toEqual([3, 1]);
  });
  it('clears redo after a new edit and bounds retained history', () => {
    let state = {
      present: defaultSession(),
      past: [] as ReturnType<typeof defaultSession>[],
      future: [] as ReturnType<typeof defaultSession>[],
    };
    for (let i = 0; i < 100; i++)
      state = sessionReducer(state, {
        type: 'edit',
        session: { ...state.present, seed: String(i) },
      });
    expect(state.past).toHaveLength(40);
    state = sessionReducer(state, { type: 'undo' });
    expect(state.future).toHaveLength(1);
    state = sessionReducer(state, {
      type: 'edit',
      session: { ...state.present, seed: 'new' },
    });
    expect(state.future).toHaveLength(0);
  });
  it('persists drafts so a new workspace restores them', () => {
    const hook = renderHook(() => useEditorSession('sorting'));
    act(() => hook.result.current.update([-2, 4, 1]));
    expect(
      parseSession(localStorage.getItem(SESSION_KEY)!).drafts.array,
    ).toEqual([-2, 4, 1]);
    hook.unmount();
    const next = renderHook(() => useEditorSession('pathfinding'));
    expect(next.result.current.session.drafts.array).toEqual([-2, 4, 1]);
  });
});
