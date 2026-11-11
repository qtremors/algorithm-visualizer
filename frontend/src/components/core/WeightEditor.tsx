import { useState } from 'react';
import Modal from './Modal';

export default function WeightEditor({
  source,
  target,
  weight,
  onSave,
  onClose,
}: {
  source: string;
  target: string;
  weight: number;
  onSave: (value: number) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(String(weight));
  const value = Number(text);
  const valid =
    text.trim() !== '' && Number.isFinite(value) && Math.abs(value) <= 1000000;
  return (
    <Modal title="Edit edge weight" onClose={onClose}>
      <form
        className="bg-gray-900 border border-gray-700 rounded-xl p-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onSave(value);
        }}
      >
        <h2 className="text-xl font-bold">
          Weight: {source} → {target}
        </h2>
        <label className="block">
          Edge weight
          <input
            autoFocus
            aria-label="Edge weight"
            type="number"
            step="any"
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="block mt-2 w-full rounded bg-gray-800 border border-gray-600 p-3"
          />
        </label>
        <p className="text-sm text-gray-400">
          Negative edges require Bellman–Ford. Equal reciprocal edges are edited
          together.
        </p>
        {!valid && (
          <p role="alert">
            Enter a finite weight between -1000000 and 1000000.
          </p>
        )}
        <div className="flex gap-3">
          <button type="submit" disabled={!valid} className="action-primary">
            Save weight
          </button>
          <button type="button" onClick={onClose} className="action-secondary">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
