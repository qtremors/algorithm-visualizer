import { useState } from 'react';
import { History, X } from 'lucide-react';
import Modal from './Modal';
import LogList from './LogList';
type Props = {
  logHistory: string[];
  error: string | null;
  totalSteps: number;
  currentStepIndex: number;
  isRunning: boolean;
};
export default function StatusLog({
  logHistory,
  error,
  totalSteps,
  currentStepIndex,
  isRunning,
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-300">
          Status{' '}
          {totalSteps > 0 && (
            <span className="text-xs text-blue-400">
              {currentStepIndex + 1}/{totalSteps}
              {isRunning ? '+' : ''}
            </span>
          )}
        </h3>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-blue-400 text-xs flex gap-1 items-center"
        >
          <History size={14} />
          History
        </button>
      </div>
      <div
        role={error ? 'alert' : 'status'}
        aria-live="polite"
        className={`bg-black rounded p-3 text-sm ${error ? 'text-red-400' : 'text-yellow-300'}`}
      >
        {error || logHistory.at(-1) || 'Ready.'}
      </div>
      {open && (
        <Modal title="Execution log" onClose={() => setOpen(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 h-[75vh] flex flex-col">
            <header className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Execution log</h2>
              <button
                type="button"
                aria-label="Close execution log"
                onClick={() => setOpen(false)}
              >
                <X />
              </button>
            </header>
            <div className="flex-1 min-h-0">
              <LogList messages={logHistory} />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
