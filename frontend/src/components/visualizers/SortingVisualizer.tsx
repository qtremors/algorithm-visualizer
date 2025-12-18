import { useMemo } from 'react';
import type { AlgorithmStep } from '../../types';
import { cn } from '../../lib/utils';

type Props = { step: AlgorithmStep | null; initialData: number[] | null };
export default function SortingVisualizer({ step, initialData }: Props) {
  const values = useMemo(
    () =>
      step && Array.isArray(step.snapshot) ? step.snapshot : initialData || [],
    [step, initialData],
  );
  const { min, span, baseline } = useMemo(() => {
    const min = values.reduce((a, b) => Math.min(a, b), 0);
    const max = values.reduce((a, b) => Math.max(a, b), 0);
    const span = max - min || 1;
    return { min, span, baseline: (-min / span) * 100 };
  }, [values]);
  const color = (index: number) =>
    step?.type === 'sorted'
      ? 'bg-green-500'
      : step?.payload.indices?.includes(index)
        ? step.type === 'swap'
          ? 'bg-red-500'
          : 'bg-yellow-500'
        : 'bg-sky-500';
  return (
    <div
      role="img"
      aria-label={`Array: ${values.join(', ')}. ${step?.message || 'Ready to sort.'}`}
      className="relative flex gap-[2px] w-full h-full p-4"
    >
      <div
        className="absolute left-4 right-4 border-t border-gray-500"
        style={{ bottom: `calc(16px + (100% - 32px) * ${baseline / 100})` }}
      />
      {values.map((value, index) => (
        <div
          key={index}
          className="relative flex-1 h-full min-w-0"
          style={{ maxWidth: 80 }}
        >
          <div
            data-value={value}
            className={cn(
              'absolute w-full rounded-sm transition-colors duration-150',
              color(index),
            )}
            style={{
              height: `${(Math.abs(value) / span) * 100}%`,
              minHeight: '2px',
              bottom: `${value < 0 ? ((value - min) / span) * 100 : baseline}%`,
            }}
          />
          {values.length <= 40 && (
            <span
              className="absolute w-full text-center text-xs text-gray-300 truncate"
              style={{
                bottom: `${value < 0 ? ((value - min) / span) * 100 : ((value - min) / span) * 100}%`,
                transform: value < 0 ? 'translateY(100%)' : 'translateY(-2px)',
              }}
            >
              {value}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
