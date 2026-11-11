import { useMemo } from 'react';
import CanvasEmptyState from '../core/CanvasEmptyState';
import type { AlgorithmStep, TreeNode, TreeSnapshot } from '../../types';

export default function TreeVisualizer({
  step,
}: {
  step: AlgorithmStep | null;
}) {
  const snapshot: TreeSnapshot | null =
    step && !Array.isArray(step.snapshot) && step.snapshot.type === 'tree'
      ? step.snapshot
      : null;
  const layout = useMemo(() => {
    const nodes = snapshot?.nodes || [];
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const positions = new Map<string, { x: number; y: number }>();
    let index = 0;
    let maxDepth = 0;
    const place = (id: string | null, depth: number) => {
      if (!id || !byId.has(id)) return;
      const node = byId.get(id)!;
      place(node.left, depth + 1);
      positions.set(id, { x: 45 + index++ * 70, y: 40 + depth * 90 });
      maxDepth = Math.max(maxDepth, depth);
      place(node.right, depth + 1);
    };
    place(snapshot?.root || null, 0);
    return {
      nodes,
      positions,
      width: Math.max(500, index * 70 + 40),
      height: Math.max(320, (maxDepth + 1) * 90),
    };
  }, [snapshot]);
  const visited = new Set(snapshot?.visited || []);
  const current = step?.payload.node;
  return (
    <div className="relative w-full h-full overflow-auto p-3">
      {!layout.nodes.length ? (
        <CanvasEmptyState kind="tree" />
      ) : (
        <svg
          role="img"
          aria-label={`Search tree with ${layout.nodes.length} distinct values. Root ${snapshot?.root}. ${step?.message || ''}`}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          style={{
            minWidth: Math.min(layout.width, 1400),
            minHeight: layout.height,
          }}
          className="w-full h-full"
        >
          {layout.nodes.flatMap((node: TreeNode) =>
            [node.left, node.right]
              .filter((id): id is string => !!id)
              .map((child) => {
                const from = layout.positions.get(node.id)!,
                  to = layout.positions.get(child)!;
                return (
                  <line
                    key={`${node.id}:${child}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    className="stroke-gray-500"
                    strokeWidth={2}
                  />
                );
              }),
          )}
          {layout.nodes.map((node) => {
            const point = layout.positions.get(node.id)!;
            return (
              <g
                key={node.id}
                data-node-state={
                  current === node.id
                    ? 'current'
                    : visited.has(node.id)
                      ? 'visited'
                      : 'unvisited'
                }
                transform={`translate(${point.x}, ${point.y})`}
              >
                <title>
                  {node.value}, count {node.count}, height {node.height}
                </title>
                <circle r={24} strokeWidth={2} />
                <text
                  textAnchor="middle"
                  dy=".3em"
                  className="fill-white text-xs"
                >
                  {node.value}
                </text>
                <text
                  textAnchor="middle"
                  y={40}
                  className="fill-gray-300 text-[10px]"
                >
                  h={node.height}
                  {node.count > 1 ? ` ×${node.count}` : ''}
                </text>
              </g>
            );
          })}
        </svg>
      )}
      {!!snapshot?.visited.length && (
        <p
          className="text-xs text-blue-300 mt-2"
          aria-label="Tree traversal output"
        >
          Visited: {snapshot.visited.join(' → ')}
        </p>
      )}
    </div>
  );
}
