import { useEffect, useReducer, useState } from 'react';
import type { InputData } from '../types/input';
import {
  initialSession,
  serializeSession,
  SESSION_KEY,
  type Session,
} from '../lib/session';

type History = { present: Session; past: Session[]; future: Session[] };
type Action =
  | { type: 'edit'; session: Session }
  | { type: 'undo' | 'redo' }
  | { type: 'replace'; session: Session };
const HISTORY_LIMIT = 40;
export function sessionReducer(state: History, action: Action): History {
  if (action.type === 'replace')
    return { present: action.session, past: [], future: [] };
  if (action.type === 'edit') {
    if (JSON.stringify(state.present) === JSON.stringify(action.session))
      return state;
    return {
      present: action.session,
      past: [...state.past, state.present].slice(-HISTORY_LIMIT),
      future: [],
    };
  }
  if (action.type === 'undo' && state.past.length)
    return {
      present: state.past[state.past.length - 1],
      past: state.past.slice(0, -1),
      future: [state.present, ...state.future],
    };
  if (action.type === 'redo' && state.future.length)
    return {
      present: state.future[0],
      past: [...state.past, state.present].slice(-HISTORY_LIMIT),
      future: state.future.slice(1),
    };
  return state;
}
export function useEditorSession(category: string) {
  const [restored] = useState(() => initialSession(category));
  const [state, dispatch] = useReducer(sessionReducer, {
    present: restored.session,
    past: [],
    future: [],
  });
  const [notice, setNotice] = useState(restored.notice);
  const session = state.present;
  useEffect(() => {
    if (window.location.hash.startsWith('#session='))
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(SESSION_KEY, serializeSession(session));
    } catch {
      /* Storage can be unavailable; in-memory editing stays usable. */
    }
  }, [session]);
  const edit = (next: Session) => dispatch({ type: 'edit', session: next });
  const update = (data: InputData | null) => {
    const field = data === null || Array.isArray(data) ? 'array' : data.kind;
    edit({ ...session, drafts: { ...session.drafts, [field]: data } });
  };
  return {
    session,
    update,
    notice,
    setNotice,
    setSelection: (selection: string) => edit({ ...session, selection }),
    setView: (view: Session['view']) => edit({ ...session, view }),
    setSeed: (seed: string) => edit({ ...session, seed: seed.slice(0, 128) }),
    replace: (next: Session) => {
      try { localStorage.setItem(SESSION_KEY, serializeSession(next)); } catch { /* Keep imported data usable in memory. */ }
      dispatch({ type: 'replace', session: next });
    },
    undo: () => dispatch({ type: 'undo' }),
    redo: () => dispatch({ type: 'redo' }),
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
