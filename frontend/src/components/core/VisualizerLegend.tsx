export default function VisualizerLegend({ category }: { category?: string }) {
  const items =
    category === 'sorting'
      ? [
          ['bg-sky-500', 'Value'],
          ['bg-yellow-500', 'Comparison / write'],
          ['bg-red-500', 'Swap'],
          ['bg-green-500', 'Sorted'],
        ]
      : category === 'trees'
        ? [
            ['bg-gray-600', 'Node'],
            ['bg-yellow-600', 'Current'],
            ['bg-blue-700', 'Visited'],
            ['bg-gray-500', 'h = height; × = count'],
          ]
        : [
            ['bg-green-500', 'S Start'],
            ['bg-red-500', 'E End'],
            ['bg-gray-500', '× Wall'],
            ['bg-purple-400', '5 Entry cost'],
            ['bg-blue-500', '· Visited'],
            ['bg-yellow-400', '• Path'],
          ];
  return (
    <ul
      aria-label="Visualization legend"
      className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-300"
    >
      {items.map(([color, label]) => (
        <li key={label} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`inline-block h-3 w-3 rounded ${color}`}
          />
          {label}
        </li>
      ))}
    </ul>
  );
}
