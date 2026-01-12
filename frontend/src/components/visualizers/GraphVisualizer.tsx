import { useEffect, useId, useRef, useState } from 'react';
import type { AlgorithmStep } from '../../types';
import type {
  ConnectionLine,
  GraphInputData,
  GraphInteraction,
  GraphTool,
} from '../../types/input';
import { graphEdges, svgPoint } from '../../lib/graph';
import { cn } from '../../lib/utils';

type Props = {
  step: AlgorithmStep | null;
  initialData: GraphInputData;
  isInteracting: boolean;
  tool: GraphTool;
  onInteraction: (action: GraphInteraction) => void;
  onWeightClick: (source: string, target: string, weight: number) => void;
  tempLine: ConnectionLine | null;
  zoom: number;
  showEdgeColors: boolean;
  showPath: boolean;
  isFitToScreen: boolean;
};
export default function GraphVisualizer({
  step,
  initialData,
  isInteracting,
  tool,
  onInteraction,
  onWeightClick,
  tempLine,
  zoom,
  showEdgeColors,
  showPath,
  isFitToScreen,
}: Props) {
  const svg = useRef<SVGSVGElement>(null);
  const source = useRef<string | null>(null);
  const [cursor, setCursor] = useState({ x: 500, y: 360 });
  const marker = useId().replace(/:/g, '');
  const snapshot =
    step && !Array.isArray(step.snapshot) && step.snapshot.type === 'graph'
      ? step.snapshot
      : null;
  const visited = new Set(snapshot?.visited || []);
  const path = snapshot?.path || [];
  const pathSet = new Set(path);
  const current = step?.payload.node;
  const { nodes, start, end } = initialData;
  const interaction = useRef(onInteraction);
  useEffect(() => {
    interaction.current = onInteraction;
  }, [onInteraction]);
  useEffect(() => {
    source.current = null;
  }, [tool, isInteracting]);
  useEffect(() => {
    const cancel = () => {
      if (source.current !== null) {
        source.current = null;
        interaction.current({ type: 'connectCancel' });
      }
    };
    window.addEventListener('pointerup', cancel);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('blur', cancel);
    return () => {
      window.removeEventListener('pointerup', cancel);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('blur', cancel);
    };
  }, []);
  const cancel = () => {
    source.current = null;
    onInteraction({ type: 'connectCancel' });
  };
  const activate = (nodeId: string) => {
    if (!isInteracting) return;
    if (tool === 'edge') {
      if (source.current) {
        onInteraction({ type: 'connectEnd', nodeId });
        source.current = null;
      } else {
        source.current = nodeId;
        onInteraction({ type: 'connectStart', nodeId });
      }
    } else onInteraction({ type: 'nodeClick', nodeId });
  };
  return (
    <div className="w-full h-full relative">
      <p className="sr-only">
        Graph tools apply to focused nodes with Enter or Space. In Connect mode,
        activate a source and then a target. Focus the canvas and use arrow keys
        to choose a new node location; Enter adds it.
      </p>
      <div
        className={cn(
          'w-full h-full',
          isFitToScreen ? 'overflow-hidden' : 'overflow-auto',
        )}
      >
        <div
          style={
            isFitToScreen
              ? { width: '100%', height: '100%' }
              : { width: 1000 * zoom, height: 720 * zoom }
          }
        >
          <svg
            ref={svg}
            viewBox="0 0 1000 720"
            preserveAspectRatio="xMidYMid meet"
            role="group"
            tabIndex={0}
            aria-label={`Graph canvas. ${Object.keys(nodes).length} nodes. New node position ${Math.round(cursor.x)}, ${Math.round(cursor.y)}.`}
            className="block w-full h-full touch-none"
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget || !isInteracting)
                return;
              if (event.key === 'Escape') {
                event.preventDefault();
                cancel();
              } else if (
                ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(
                  event.key,
                )
              ) {
                event.preventDefault();
                event.stopPropagation();
                setCursor((p) => ({
                  x: Math.max(
                    20,
                    Math.min(
                      980,
                      p.x +
                        (event.key === 'ArrowRight'
                          ? 20
                          : event.key === 'ArrowLeft'
                            ? -20
                            : 0),
                    ),
                  ),
                  y: Math.max(
                    20,
                    Math.min(
                      700,
                      p.y +
                        (event.key === 'ArrowDown'
                          ? 20
                          : event.key === 'ArrowUp'
                            ? -20
                            : 0),
                    ),
                  ),
                }));
              } else if (
                (event.key === 'Enter' || event.key === ' ') &&
                tool === 'node'
              ) {
                event.preventDefault();
                event.stopPropagation();
                onInteraction({ type: 'addNode', point: cursor });
              }
            }}
            onClick={(event) => {
              if (isInteracting && tool === 'node' && svg.current) {
                const point = svgPoint(
                  svg.current,
                  event.clientX,
                  event.clientY,
                );
                if (point) onInteraction({ type: 'addNode', point });
              }
            }}
            onPointerMove={(event) => {
              if (
                isInteracting &&
                source.current &&
                event.buttons === 1 &&
                svg.current
              ) {
                const point = svgPoint(
                  svg.current,
                  event.clientX,
                  event.clientY,
                );
                if (point) onInteraction({ type: 'connectMove', point });
              }
            }}
            onPointerUp={(event) => {
              if (!source.current) return;
              const target = document
                .elementFromPoint(event.clientX, event.clientY)
                ?.closest('[data-node-id]')
                ?.getAttribute('data-node-id');
              if (target && target !== source.current)
                onInteraction({ type: 'connectEnd', nodeId: target });
              else onInteraction({ type: 'connectCancel' });
              source.current = null;
              if (svg.current?.hasPointerCapture(event.pointerId))
                svg.current.releasePointerCapture(event.pointerId);
            }}
            onPointerCancel={cancel}
          >
            <defs>
              <marker
                id={marker}
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
              </marker>
            </defs>
            {graphEdges(initialData, path).map((edge, index) => {
              const u = nodes[edge.source],
                v = nodes[edge.target];
              const offset = edge.directed
                ? edge.source.localeCompare(edge.target) < 0
                  ? 24
                  : -24
                : 0;
              const color = edge.isPath
                ? 'stroke-yellow-400'
                : visited.has(edge.source) && visited.has(edge.target)
                  ? 'stroke-blue-500'
                  : showEdgeColors
                    ? [
                        'stroke-purple-400',
                        'stroke-pink-400',
                        'stroke-teal-400',
                      ][index % 3]
                    : 'stroke-gray-500';
              return (
                <g key={JSON.stringify([edge.source, edge.target])}>
                  <path
                    data-edge={`${edge.source}:${edge.target}`}
                    data-path={edge.isPath}
                    d={`M ${u.x} ${u.y} Q ${(u.x + v.x) / 2} ${(u.y + v.y) / 2 + offset} ${v.x} ${v.y}`}
                    className={cn('fill-none pointer-events-none', color)}
                    strokeWidth={edge.isPath ? 4 : 2}
                    markerEnd={edge.directed ? `url(#${marker})` : undefined}
                  />
                  <g
                    role="button"
                    tabIndex={isInteracting ? 0 : -1}
                    aria-disabled={!isInteracting}
                    aria-label={`${edge.directed ? 'Directed edge' : 'Edge'} ${edge.source} to ${edge.target}, weight ${edge.weight}. ${tool === 'delete' ? 'Delete connection' : 'Edit weight'}.`}
                    transform={`translate(${(u.x + v.x) / 2}, ${(u.y + v.y) / 2 + offset / 2})`}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (isInteracting)
                        onWeightClick(edge.source, edge.target, edge.weight);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        event.stopPropagation();
                        if (isInteracting)
                          onWeightClick(edge.source, edge.target, edge.weight);
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <rect
                      x="-16"
                      y="-12"
                      width="32"
                      height="24"
                      rx="4"
                      className="fill-gray-900 stroke-gray-500"
                    />
                    <text
                      textAnchor="middle"
                      dy=".3em"
                      className="fill-gray-200 text-[11px]"
                    >
                      {edge.weight}
                    </text>
                  </g>
                </g>
              );
            })}
            {tempLine && (
              <path
                data-connection-preview="true"
                d={`M ${tempLine.start.x} ${tempLine.start.y} L ${tempLine.end.x} ${tempLine.end.y}`}
                stroke="white"
                strokeDasharray="5,5"
                className="pointer-events-none"
              />
            )}
            {Object.entries(nodes).map(([id, point]) => {
              const state =
                id === start
                  ? 'start'
                  : id === end
                    ? 'end'
                    : pathSet.has(id)
                      ? 'path'
                      : id === current
                        ? 'current'
                        : visited.has(id)
                          ? 'visited'
                          : 'unvisited';
              return (
                <g
                  key={id}
                  data-node-id={id}
                  transform={`translate(${point.x}, ${point.y})`}
                  role="button"
                  tabIndex={isInteracting ? 0 : -1}
                  aria-disabled={!isInteracting}
                  aria-label={`Node ${id}, ${state}. ${tool === 'edge' ? 'Connect' : tool === 'delete' ? 'Delete' : `Set ${tool}`}.`}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    if (
                      isInteracting &&
                      tool === 'edge' &&
                      event.button === 0
                    ) {
                      source.current = id;
                      onInteraction({ type: 'connectStart', nodeId: id });
                      svg.current?.setPointerCapture(event.pointerId);
                    }
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (tool !== 'edge') activate(id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      event.stopPropagation();
                      activate(id);
                    } else if (event.key === 'Escape') {
                      event.preventDefault();
                      cancel();
                    }
                  }}
                  className="cursor-pointer"
                >
                  <circle
                    r="20"
                    className={cn(
                      'stroke-2',
                      id === start
                        ? 'fill-green-600 stroke-green-300'
                        : id === end
                          ? 'fill-red-600 stroke-red-300'
                          : pathSet.has(id)
                            ? 'fill-yellow-600 stroke-yellow-300'
                            : id === current
                              ? 'fill-blue-500 stroke-blue-200'
                              : visited.has(id)
                                ? 'fill-blue-900 stroke-blue-400'
                                : 'fill-gray-800 stroke-gray-400',
                    )}
                  />
                  <text
                    textAnchor="middle"
                    dy=".3em"
                    className="fill-white text-xs font-bold pointer-events-none"
                  >
                    {id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      {!Object.keys(nodes).length && (
        <p className="absolute inset-x-0 top-6 text-center text-gray-400 pointer-events-none">
          Generate a graph or use the Node tool to add nodes.
        </p>
      )}
      {showPath && path.length > 0 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/95 border border-yellow-500/40 rounded-lg px-4 py-2 max-w-[90%] overflow-auto text-yellow-300 text-sm"
          aria-label="Final path"
        >
          {path.join(' → ')}
        </div>
      )}
    </div>
  );
}
