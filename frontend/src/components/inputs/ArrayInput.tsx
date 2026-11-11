import { useId, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { arrayPreset, type ArrayPreset } from '../../lib/random';
import { integerInRange, LIMITS, parseArray } from '../../lib/input';

type Props = {
  onSubmit: (data: number[] | null) => void;
  currentData: number[] | null;
  disabled: boolean;
  seed?: string;
};
export default function ArrayInput({
  onSubmit,
  currentData,
  disabled,
  seed = 'algoviz',
}: Props) {
  const id = useId();
  const [draft, setDraft] = useState({
    source: currentData,
    previous: currentData,
    text: currentData?.join(', ') || '',
  });
  const localDraft =
    draft.source === currentData || draft.previous === currentData;
  const text = localDraft ? draft.text : currentData?.join(', ') || '';
  const [preset, setPreset] = useState<ArrayPreset>('random');
  const [size, setSize] = useState(15);
  const [min, setMin] = useState(10);
  const [max, setMax] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const generate = () => {
    if (disabled) return;
    if (
      !integerInRange(size, 1, LIMITS.array) ||
      !Number.isSafeInteger(min) ||
      !Number.isSafeInteger(max) ||
      min > max ||
      !Number.isSafeInteger(max - min + 1)
    ) {
      setError('Use a size of 1–100 and a safe integer range with min ≤ max.');
      return;
    }
    const values = arrayPreset(preset, size, seed, min, max);
    setDraft({
      source: values,
      previous: currentData,
      text: values.join(', '),
    });
    setError(null);
    onSubmit(values);
  };
  const update = (value: string) => {
    try {
      const values = parseArray(value);
      setDraft({ source: values, previous: currentData, text: value });
      setError(null);
      onSubmit(values);
    } catch (problem) {
      setDraft({ source: null, previous: currentData, text: value });
      setError(problem instanceof Error ? problem.message : 'Invalid input.');
      onSubmit(null);
    }
  };
  return (
    <fieldset disabled={disabled} className="array-editor">
      <legend className="sr-only">Sorting input</legend>
      <label className="control-field">
        <span>Size</span>
        <input
          aria-label="Size"
          type="number"
          min={1}
          max={LIMITS.array}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="control-input"
        />
      </label>
      <label className="control-field">
        <span>Minimum</span>
        <input
          aria-label="Minimum value"
          type="number"
          value={min}
          onChange={(e) => setMin(Number(e.target.value))}
          className="control-input"
        />
      </label>
      <label className="control-field">
        <span>Maximum</span>
        <input
          aria-label="Maximum value"
          type="number"
          value={max}
          onChange={(e) => setMax(Number(e.target.value))}
          className="control-input"
        />
      </label>
      <label className="control-field array-preset">
        <span>Preset</span>
        <select
          aria-label="Array preset"
          value={preset}
          onChange={(e) => setPreset(e.target.value as ArrayPreset)}
          className="control-input"
        >
          <option value="random">Random</option>
          <option value="sorted">Sorted</option>
          <option value="reversed">Reversed</option>
          <option value="nearly_sorted">Nearly sorted</option>
          <option value="duplicates">Duplicates</option>
          <option value="signed">Signed</option>
        </select>
      </label>
      <label className="control-field array-custom">
        <span>Custom input</span>
        <input
          id={`${id}-text`}
          aria-label="Custom Input"
          type="text"
          value={text}
          onChange={(e) => update(e.target.value)}
          aria-invalid={!!error && localDraft}
          aria-describedby={error && localDraft ? `${id}-error` : undefined}
          placeholder="50, 20, 80..."
          className="control-input font-mono"
        />
      </label>
      <button
        type="button"
        onClick={generate}
        title="Generate New"
        aria-label="Generate New"
        className="control-icon"
      >
        <RefreshCw size={18} />
      </button>
      {error && localDraft && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs text-red-400 col-span-full"
        >
          {error}
        </p>
      )}
    </fieldset>
  );
}
