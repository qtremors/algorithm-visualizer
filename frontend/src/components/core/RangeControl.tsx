import { useId, type CSSProperties } from 'react';

interface Props {
  label: string;
  accessibleLabel?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  displayValue: string;
  valueText?: string;
  disabled?: boolean;
  disabledReason?: string;
  onChange: (value: number) => void;
  className?: string;
}

/** A visible track, a readable value, and native keyboard range behavior. */
export default function RangeControl({
  label,
  accessibleLabel = label,
  value,
  min,
  max,
  step = 1,
  displayValue,
  valueText = displayValue,
  disabled = false,
  disabledReason,
  onChange,
  className = '',
}: Props) {
  const id = useId();
  const fraction =
    max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
  return (
    <label className={`range-control ${className}`} htmlFor={id}>
      <span className="range-label">{label}</span>
      <input
        id={id}
        type="range"
        aria-label={accessibleLabel}
        aria-valuetext={valueText}
        aria-describedby={
          disabled && disabledReason ? `${id}-reason` : undefined
        }
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        style={{ '--range-progress': `${fraction * 100}%` } as CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output htmlFor={id} aria-hidden="true" className="range-value">
        {displayValue}
      </output>
      {disabled && disabledReason && (
        <span id={`${id}-reason`} className="sr-only">
          {disabledReason}
        </span>
      )}
    </label>
  );
}
