import { useMemo } from 'react';
import type { AlgorithmStep } from '../../types';

export default function RunSummary({
  steps,
  index,
  metrics,
  category,
}: {
  steps: AlgorithmStep[];
  index: number;
  metrics?: Record<string, number | string>;
  category?: string;
}) {
  const prefixes = useMemo(() => {
    const result = [];
    let counts = { comparisons: 0, swaps: 0, writes: 0, relaxations: 0 };
    for (const step of steps) {
      counts = {
        comparisons: counts.comparisons + Number(step.type === 'compare'),
        swaps: counts.swaps + Number(step.type === 'swap'),
        writes: counts.writes + Number(step.type === 'write'),
        relaxations: counts.relaxations + Number(step.type === 'relax_edge'),
      };
      result.push(counts);
    }
    return result;
  }, [steps]);
  const current = steps[index];
  const counts = prefixes[index] || {
    comparisons: 0,
    swaps: 0,
    writes: 0,
    relaxations: 0,
  };
  const visited =
    current && !Array.isArray(current.snapshot)
      ? current.snapshot.visited.length
      : 0;
  const path =
    current?.type === 'found_path' ? current.payload.path : undefined;
  const kind =
    category ||
    (current && !Array.isArray(current.snapshot)
      ? current.snapshot.type
      : 'sorting');
  const entries =
    kind === 'sorting'
      ? [
          ['Comparisons', counts.comparisons],
          ['Swaps', counts.swaps],
          ['Writes', counts.writes],
        ]
      : kind === 'trees' || kind === 'tree'
        ? [
            ['Comparisons', counts.comparisons],
            ['Visited', visited],
          ]
        : [
            ['Relaxations', counts.relaxations],
            ['Visited / discovered', visited],
            ['Path hops', path ? Math.max(0, path.length - 1) : '—'],
            ['Path cost', path ? (current?.payload.dist ?? 'unweighted') : '—'],
          ];
  return (
    <section
      aria-label="Run measurements"
      className="bg-gray-900 border border-gray-700 rounded-xl p-3 space-y-2"
    >
      <dl className="metrics-grid">
        {entries.map(([name, value]) => (
          <div key={name}>
            <dt className="text-xs text-gray-400">{name}</dt>
            <dd className="font-mono text-sm">{value}</dd>
          </div>
        ))}
      </dl>
      {metrics && (
        <p className="text-xs text-gray-400">
          Server run: {metrics.execution_ms} ms. Includes generation and
          streaming; animation time is separate.
        </p>
      )}
      {current?.type === 'negative_cycle' && (
        <p role="status" className="text-amber-300 text-sm">
          A reachable negative cycle prevents a finite shortest-path result.
        </p>
      )}
    </section>
  );
}
