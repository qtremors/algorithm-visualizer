export default function VisualizerLegend({
  category,
  view = 'grid',
}: {
  category?: string;
  view?: 'grid' | 'graph';
}) {
  const entries =
    category === 'sorting'
      ? [
          ['var(--color-sky-500)', 'Value'],
          ['var(--color-yellow-500)', 'Comparison / write'],
          ['var(--color-red-500)', 'Swap'],
          ['var(--color-green-500)', 'Sorted'],
        ]
      : category === 'trees'
        ? [
            ['var(--ui-text-subtle)', 'Node'],
            ['var(--ui-accent)', 'Current'],
            ['var(--viz-visited)', 'Visited'],
          ]
        : view === 'graph'
          ? [
              ['var(--viz-start)', 'Start'],
              ['var(--viz-end)', 'End'],
              ['var(--viz-visited)', 'Visited'],
              ['var(--viz-path)', 'Path'],
            ]
          : [
              ['var(--viz-start)', 'S Start'],
              ['var(--viz-end)', 'E End'],
              ['var(--viz-wall)', '× Wall'],
              ['var(--viz-weight)', '5 Entry cost'],
              ['var(--viz-visited)', '· Visited'],
              ['var(--viz-path)', '• Path'],
            ];
  return (
    <ul aria-label="Visualization legend" className="visualizer-legend">
      {entries.map(([color, label]) => (
        <li key={label}>
          <span aria-hidden="true" style={{ backgroundColor: color }} />
          {label}
        </li>
      ))}
      {category === 'trees' && (
        <li className="legend-note">h = height · × = duplicate count</li>
      )}
    </ul>
  );
}
