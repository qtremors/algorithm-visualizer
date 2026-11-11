import type { PlaybackOperation } from '../../hooks/usePlayback';
export default function Timeline({
  index,
  length,
  streaming,
  disabled,
  onSeek,
  operation,
  onOperationChange,
  breakpointHint = true,
}: {
  breakpointHint?: boolean;
  index: number;
  length: number;
  streaming: boolean;
  disabled: boolean;
  onSeek: (index: number) => void;
  operation: PlaybackOperation;
  onOperationChange: (operation: PlaybackOperation) => void;
}) {
  return (
    <section aria-label="Timeline" className="timeline-controls">
      <button
        className="action-secondary"
        disabled={disabled}
        onClick={() => onSeek(0)}
      >
        First step
      </button>
      <label className="control-field">
        <span>
          Step {length ? index + 1 : 0} of {length}
          {streaming ? ' received so far' : ''}
        </span>
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
      <label className="control-field timeline-operation">
        <span>Step by</span>
        <select
          aria-label="Step operation"
          value={operation}
          onChange={(event) =>
            onOperationChange(event.target.value as PlaybackOperation)
          }
          className="control-input"
        >
          <option value="any">Every step</option>
          <option value="compare">Comparison</option>
          <option value="swap">Swap</option>
          <option value="visit_node">Node visit</option>
          <option value="relax_edge">Edge relaxation</option>
        </select>
      </label>
      {breakpointHint && (
        <p className="timeline-help">
          Click a pseudocode line number to pause there. Timeline movement
          pauses playback.
        </p>
      )}
    </section>
  );
}
