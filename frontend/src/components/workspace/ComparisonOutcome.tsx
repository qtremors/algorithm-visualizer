import type { AlgorithmStep } from '../../types';

interface Lane {
  name: string;
  steps: AlgorithmStep[];
  metrics?: Record<string, number | string>;
}

function pathOutcome(lane: Lane): string {
  if (lane.steps.some((step) => step.type === 'negative_cycle'))
    return 'Negative cycle';
  return lane.steps.some((step) => step.type === 'found_path')
    ? 'Path found'
    : 'No path found';
}

function measurement(lane: Lane, key: string): number | string {
  if (key.startsWith('path_') && pathOutcome(lane) !== 'Path found') return '—';
  return lane.metrics?.[key] ?? '—';
}

export default function ComparisonOutcome({
  left,
  right,
  category,
  complete,
}: {
  left: Lane;
  right: Lane;
  category: string;
  complete: boolean;
}) {
  if (!complete || !left.metrics || !right.metrics) return null;
  const negativeCycle = [left, right].some((lane) =>
    lane.steps.some((step) => step.type === 'negative_cycle'),
  );
  const fields =
    category === 'sorting'
      ? [
          ['comparisons', 'Comparisons'],
          ['swaps', 'Swaps'],
          ['writes', 'Writes'],
        ]
      : category === 'trees'
        ? [
            ['comparisons', 'Comparisons'],
            ['visited', 'Visited nodes'],
          ]
        : [
            ['visited', 'Visited / discovered'],
            ['relaxations', 'Relaxations'],
            ['path_hops', 'Path hops'],
            ['path_cost', 'Path cost'],
          ];
  return (
    <section aria-label="Comparison results" className="comparison-outcome">
      <div className="section-heading">
        <h2>Final results</h2>
        <span className="result-label">Same input · generation complete</span>
      </div>
      <p>
        {negativeCycle
          ? 'A run found a reachable negative cycle. There is no finite shortest-path result to compare for that run.'
          : 'Compare the work performed by each algorithm. Counts are independent of playback speed.'}
      </p>
      <div className="result-table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Measurement</th>
              <th scope="col">{left.name}</th>
              <th scope="col">{right.name}</th>
            </tr>
          </thead>
          <tbody>
            {category === 'pathfinding' && (
              <tr>
                <th scope="row">Outcome</th>
                <td>{pathOutcome(left)}</td>
                <td>{pathOutcome(right)}</td>
              </tr>
            )}
            {fields.map(([key, label]) => (
              <tr key={key}>
                <th scope="row">{label}</th>
                <td>{measurement(left, key)}</td>
                <td>{measurement(right, key)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="result-footnote">
        Server time includes generation and streaming, so it is not a benchmark
        of algorithm CPU time.
      </p>
    </section>
  );
}
