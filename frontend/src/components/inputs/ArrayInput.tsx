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
  const [draft, setDraft] = useState({ source: currentData, previous: currentData, text: currentData?.join(', ') || '' });
  const localDraft = draft.source === currentData || draft.previous === currentData;
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
    setDraft({ source: values, previous: currentData, text: values.join(', ') });
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
    <fieldset
      disabled={disabled}
      className="flex flex-col xl:flex-row gap-4 w-full disabled:opacity-60"
    >
      <legend className="sr-only">Sorting input</legend>
      <div>
        <span className="text-xs font-bold text-gray-400 uppercase">
          Generator
        </span>
        <div className="flex flex-wrap items-center gap-2 bg-gray-900 rounded-lg border border-gray-700 p-2">
          <label htmlFor={`${id}-size`} className="text-xs">
            Size
          </label>
          <input
            id={`${id}-size`}
            type="number"
            min="1"
            max="100"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-14 bg-transparent"
          />
          <label htmlFor={`${id}-min`} className="sr-only">
            Minimum value
          </label>
          <input
            id={`${id}-min`}
            type="number"
            value={min}
            onChange={(e) => setMin(Number(e.target.value))}
            className="w-16 bg-transparent"
          />
          <span aria-hidden="true">–</span>
          <label htmlFor={`${id}-max`} className="sr-only">
            Maximum value
          </label>
          <input
            id={`${id}-max`}
            type="number"
            value={max}
            onChange={(e) => setMax(Number(e.target.value))}
            className="w-16 bg-transparent"
          />
          <button
            type="button"
            onClick={generate}
            title="Generate New"
            aria-label="Generate New"
            className="p-1 text-blue-400"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
      <label className="text-xs">
        Preset
        <select
          aria-label="Array preset"
          value={preset}
          onChange={(event) => setPreset(event.target.value as ArrayPreset)}
          className="block bg-gray-900 p-2 rounded border border-gray-700"
        >
          <option value="random">Random</option>
          <option value="sorted">Sorted</option>
          <option value="reversed">Reversed</option>
          <option value="nearly_sorted">Nearly sorted</option>
          <option value="duplicates">Duplicates</option>
          <option value="signed">Signed</option>
        </select>
      </label>
      <div className="flex-grow min-w-0">
        <label
          htmlFor={`${id}-text`}
          className="text-xs font-bold text-gray-400 uppercase"
        >
          Custom Input
        </label>
        <input
          id={`${id}-text`}
          type="text"
          value={text}
          onChange={(e) => update(e.target.value)}
          aria-invalid={!!error && localDraft}
          aria-describedby={error && localDraft ? `${id}-error` : undefined}
          placeholder="e.g., 50, 20, 80..."
          className="w-full bg-gray-900 text-white p-2 rounded-lg border border-gray-700 text-sm font-mono"
        />
        {error && localDraft && (
          <p
            id={`${id}-error`}
            role="alert"
            className="text-xs text-red-400 mt-1"
          >
            {error}
          </p>
        )}
      </div>
    </fieldset>
  );
}
