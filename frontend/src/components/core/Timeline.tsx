import { useId, useState, type CSSProperties, type FormEvent } from 'react';
import type { PlaybackOperation } from '../../hooks/usePlayback';

interface Props {
  index: number;
  length: number;
  streaming: boolean;
  disabled: boolean;
  onSeek: (index: number) => void;
  operation: PlaybackOperation;
  onOperationChange: (operation: PlaybackOperation) => void;
  breakpointHint?: boolean;
}

export default function Timeline({
  index,
  length,
  streaming,
  disabled,
  onSeek,
  operation,
  onOperationChange,
  breakpointHint = true,
}: Props) {
  const id = useId();
  const [target, setTarget] = useState('');
  const numeric = Number(target);
  const valid =
    /^\d+$/.test(target) &&
    Number.isSafeInteger(numeric) &&
    numeric >= 1 &&
    numeric <= length;
  const jump = (event: FormEvent) => {
    event.preventDefault();
    if (valid && !disabled) {
      onSeek(numeric - 1);
      setTarget('');
    }
  };
  const progress = length > 1 ? (index / (length - 1)) * 100 : 0;
  return (
    <section aria-label="Timeline" className="timeline-controls">
      <button
        className="action-secondary"
        disabled={disabled}
        onClick={() => onSeek(0)}
        title="First step (Home)"
      >
        First step
      </button>
      <label className="control-field timeline-track" htmlFor={`${id}-range`}>
        <span className="timeline-caption">
          <span>
            Step <strong>{length ? index + 1 : 0}</strong> of {length}
          </span>
          {streaming && <span className="buffer-label">Receiving</span>}
        </span>
        <input
          id={`${id}-range`}
          type="range"
          aria-label="Playback timeline"
          aria-valuetext={`${length ? index + 1 : 0} of ${length} steps${streaming ? ' received so far' : ''}`}
          min={0}
          max={Math.max(0, length - 1)}
          value={index}
          disabled={disabled}
          style={{ '--range-progress': `${progress}%` } as CSSProperties}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
      </label>
      <button
        className="action-secondary"
        disabled={disabled}
        onClick={() => onSeek(length - 1)}
        title="Last received step (End)"
      >
        Last step
      </button>
      <label
        className="control-field timeline-operation"
        htmlFor={`${id}-operation`}
      >
        <span>Step by</span>
        <select
          id={`${id}-operation`}
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
          <option value="write">Write</option>
          <option value="visit_node">Node visit</option>
          <option value="relax_edge">Edge relaxation</option>
        </select>
      </label>
      <form className="timeline-jump" onSubmit={jump}>
        <label className="control-field" htmlFor={`${id}-step`}>
          <span>Go to step</span>
          <input
            id={`${id}-step`}
            aria-label="Go to step"
            type="number"
            inputMode="numeric"
            min={1}
            max={Math.max(1, length)}
            value={target}
            placeholder={length ? String(index + 1) : '—'}
            disabled={disabled}
            onChange={(event) => setTarget(event.target.value)}
            className="control-input"
          />
        </label>
        <button
          className="action-secondary"
          disabled={disabled || !valid}
          type="submit"
        >
          Go
        </button>
      </form>
      {breakpointHint && (
        <p className="timeline-help">
          Select a pseudocode line number to set a breakpoint. Use Home / End to
          jump, or ← / → to step while paused.
        </p>
      )}
    </section>
  );
}
