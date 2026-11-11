import type { AlgorithmStep } from '../../types';

export default function LearningPanel({
  steps,
  index,
  algorithm,
}: {
  steps: AlgorithmStep[];
  index: number;
  algorithm: string;
}) {
  let learning = steps[index]?.learning;
  if (!learning || !Object.keys(learning).length) {
    for (let previous = index - 1; previous >= 0; previous--) {
      if (
        steps[previous]?.learning &&
        Object.keys(steps[previous].learning!).length
      ) {
        learning = steps[previous].learning;
        break;
      }
    }
  }
  const current = steps[index];
  const frontierName =
    algorithm === 'bfs'
      ? 'Queue (front first)'
      : algorithm === 'dfs'
        ? 'Stack (top last)'
        : 'Priority queue (heap order)';
  const explanation =
    learning?.explanation ||
    (current?.type === 'relax_edge'
      ? 'Relaxation improves a known route to a neighbor. The predecessor records which edge gave that improvement.'
      : current?.type === 'compare'
        ? 'The comparison decides which value or branch should be considered next.'
        : current?.type === 'swap'
          ? 'A swap exchanges two values; it preserves the array contents.'
          : current?.type === 'found_path'
            ? 'Following predecessors back to the start reconstructs this route.'
            : 'Choose input, then follow each operation with the timeline and pseudocode.');
  return (
    <section
      aria-label="Learning state"
      className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3 text-sm"
    >
      <h2 className="font-semibold text-blue-300">Why this step?</h2>
      <p className="text-gray-300">{explanation}</p>
      {learning?.frontier && (
        <div>
          <h3 className="font-semibold mb-2">{frontierName}</h3>
          <p className="font-mono text-xs break-words">
            {learning.frontier.length
              ? learning.frontier
                  .map((node) =>
                    Array.isArray(node) ? `(${node.join(',')})` : node,
                  )
                  .join(' → ')
              : 'Empty'}
          </p>
          {Number(learning.frontier_count) > learning.frontier.length && (
            <p className="text-gray-400 text-xs">
              Showing {learning.frontier.length} of {learning.frontier_count}{' '}
              entries.
            </p>
          )}
        </div>
      )}
      {!!learning?.boundary?.length && (
        <p>
          Active boundaries:{' '}
          <span className="font-mono">{learning.boundary.join(' | ')}</span>
        </p>
      )}
      {learning?.distances && (
        <div className="max-h-48 overflow-auto">
          <table className="w-full text-xs">
            <caption className="text-left font-semibold mb-2">
              Known distances and predecessors
            </caption>
            <thead>
              <tr>
                <th scope="col" className="text-left">
                  Node
                </th>
                <th scope="col">Cost</th>
                <th scope="col">Parent</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(learning.distances).map(([node, cost]) => (
                <tr key={node} className="border-t border-gray-800">
                  <th scope="row" className="text-left py-1">
                    {node}
                  </th>
                  <td className="text-center">{cost}</td>
                  <td className="text-center">
                    {String(learning.parents?.[node] ?? '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
