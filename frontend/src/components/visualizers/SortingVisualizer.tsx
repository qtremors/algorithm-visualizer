import { useMemo } from 'react';
import type { AlgorithmStep } from '../../types';
import { cn } from '../../lib/utils';

type SortingVisualizerProps = {
  step: AlgorithmStep | null;
  initialData: number[] | null;
};

export default function SortingVisualizer({ step, initialData }: SortingVisualizerProps) {
  // 1. Get the array to display
  const arrayState = useMemo(() => {
    return (step?.snapshot || initialData || []) as number[];
  }, [step, initialData]);

  // 2. Find the max value to normalize bar heights (100% height = max value)
  const maxArrayValue = useMemo(() => Math.max(...arrayState, 1), [arrayState]);

  // 3. Dynamic Bar Coloring Logic
  const getBarColor = (index: number): string => {
    if (!step) return 'bg-sky-500'; 

    const { type, payload } = step;
    
    if (type === 'sorted') return 'bg-green-500';
    
    if (payload.indices && payload.indices.includes(index)) {
      if (type === 'compare') return 'bg-yellow-500';
      if (type === 'swap') return 'bg-red-500';
    }
    
    return 'bg-sky-500';
  };

  return (
    <div className="flex-grow flex items-end justify-center gap-[2px] w-full h-full p-4">
      {arrayState.map((value, index) => (
        <div 
          key={index} 
          className="flex-grow flex flex-col items-center justify-end h-full" 
          style={{ maxWidth: '80px' }} 
        >
          <div 
            className={cn("w-full rounded-t-md transition-colors duration-200", getBarColor(index))}
            style={{ 
              // Use CSS percentage instead of pixel calculation
              height: `${(value / maxArrayValue) * 100}%`,
              minHeight: '2px'
            }} 
          ></div>
          {/* Hide numbers if array is too large to prevent clutter */}
          {arrayState.length <= 40 && (
            <span className="text-xs mt-1 text-gray-400">{value}</span>
          )}
        </div>
      ))}
    </div>
  );
}