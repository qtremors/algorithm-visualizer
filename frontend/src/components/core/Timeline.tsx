import type { PlaybackOperation } from '../../hooks/usePlayback';
export default function Timeline({
  index,
  length,
  streaming,
  disabled,
  onSeek,
  operation,
  onOperationChange,
}: {
  index: number;
  length: number;
  streaming: boolean;
  disabled: boolean;
  onSeek: (index: number) => void;
  operation: PlaybackOperation;
  onOperationChange: (operation: PlaybackOperation) => void;
}) {
  return (
    <section
      aria-label="Timeline"
      className="rounded-xl border border-gray-700 bg-gray-900 p-3 flex flex-wrap gap-3 items-center"
    >
      <button
        className="action-secondary"
        disabled={disabled}
        onClick={() => onSeek(0)}
      >
        First step
      </button>
      <label className="flex-1 min-w-32 text-xs text-gray-300">
        Step {length ? index + 1 : 0} of {length}
        {streaming ? ' received so far' : ''}
        <input
          type="range"
          aria-label="Playback timeline"
          className="block w-full accent-blue-500 mt-2"
          min={0}
          max={Math.max(0, length - 1)}
          value={index}
          disabled={disabled}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
      </label>
      <button
        className="action-secondary"
        disabled={disabled}
        onClick={() => onSeek(length - 1)}
      >
        Last step
      </button>
      <label className="text-xs">
        Step by
        <select
          aria-label="Step operation"
          value={operation}
          onChange={(event) =>
            onOperationChange(event.target.value as PlaybackOperation)
          }
          className="block bg-gray-800 p-2 rounded mt-1"
        >
          <option value="any">Every step</option>
          <option value="compare">Comparison</option>
          <option value="swap">Swap</option>
          <option value="visit_node">Node visit</option>
          <option value="relax_edge">Edge relaxation</option>
        </select>
      </label>
      <p className="text-xs text-gray-400 w-full">
        Click a pseudocode line number to pause there. Timeline movement pauses
        playback.
      </p>
    </section>
  );
}
