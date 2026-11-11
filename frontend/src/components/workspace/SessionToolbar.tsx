import { useState } from 'react';
import {
  parseSessionText,
  serializeSession,
  shareUrl,
  SESSION_BYTES,
  type Session,
} from '../../lib/session';

export default function SessionToolbar({
  session,
  onImport,
  undo,
  redo,
  canUndo,
  canRedo,
  disabled,
  setSeed,
}: {
  session: Session;
  onImport: (value: Session) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  disabled: boolean;
  setSeed: (seed: string) => void;
}) {
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const importText = (value: string) => {
    try {
      onImport(parseSessionText(value));
      setMessage('Session imported.');
      setError('');
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : 'Cannot import session.',
      );
    }
  };
  const exportFile = () => {
    try {
      const value = serializeSession(session);
      const url = URL.createObjectURL(
        new Blob([value], { type: 'application/json' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = 'algoviz-session.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setText(value);
      setMessage('Session exported.');
      setError('');
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : 'Cannot export session.',
      );
    }
  };
  const copyLink = async () => {
    try {
      const url = shareUrl(session);
      setText(url);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setMessage('Share link copied.');
      } else setMessage('Copy the link from the session text field.');
      setError('');
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : 'Cannot copy link. Use Export session.',
      );
    }
  };
  return (
    <section
      aria-label="Session tools"
      className="rounded-xl bg-gray-900 border border-gray-800 p-3 space-y-2"
    >
      <div className="flex flex-wrap gap-2 items-center">
        <button
          className="action-secondary"
          disabled={disabled || !canUndo}
          onClick={undo}
        >
          Undo
        </button>
        <button
          className="action-secondary"
          disabled={disabled || !canRedo}
          onClick={redo}
        >
          Redo
        </button>
        <label className="text-sm flex items-center gap-2">
          Seed
          <input
            aria-label="Generator seed"
            className="bg-gray-800 rounded p-2 w-28"
            maxLength={128}
            value={session.seed}
            disabled={disabled}
            onChange={(event) => setSeed(event.target.value)}
          />
        </label>
        <button
          className="action-secondary"
          disabled={disabled}
          onClick={exportFile}
        >
          Export session
        </button>
        <button
          className="action-secondary"
          disabled={disabled}
          onClick={() => void copyLink()}
        >
          Share session
        </button>
        <span className="text-xs text-gray-400">
          Drafts save on this device.
        </span>
      </div>
      <details>
        <summary className="text-sm cursor-pointer py-2">
          Import or copy a session
        </summary>
        <div className="space-y-2 pt-2">
          <label className="block text-sm">
            Session JSON or share link
            <textarea
              aria-label="Session text"
              className="w-full bg-gray-950 p-3 rounded font-mono text-xs"
              rows={3}
              value={text}
              disabled={disabled}
              onChange={(event) => setText(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={disabled || !text}
              className="action-secondary"
              onClick={() => importText(text)}
            >
              Import JSON
            </button>
            <label className="action-secondary cursor-pointer">
              Import file
              <input
                aria-label="Import session file"
                className="sr-only"
                type="file"
                accept="application/json,.json"
                disabled={disabled}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > SESSION_BYTES) {
                    setError('Session exceeds 64 KiB.');
                    return;
                  }
                  void file
                    .text()
                    .then(importText)
                    .catch(() => setError('Cannot read session file.'));
                  event.target.value = '';
                }}
              />
            </label>
          </div>
        </div>
      </details>
      {message && (
        <p className="text-sm text-blue-300" role="status">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}
