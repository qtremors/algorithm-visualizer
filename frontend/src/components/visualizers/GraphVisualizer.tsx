import { useEffect, useId, useRef, useState } from 'react';
import type { AlgorithmStep } from '../../types';
import type {
  ConnectionLine,
  GraphInputData,
  GraphInteraction,
  GraphTool,
} from '../../types/input';
import { graphEdges, svgPoint } from '../../lib/graph';
import CanvasEmptyState from '../core/CanvasEmptyState';
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
  const moving = useRef<string | null>(null);
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
    moving.current = null;
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
            className="graph-canvas block w-full h-full touch-none"
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
                moving.current &&
                event.buttons === 1 &&
                svg.current
              ) {
                const point = svgPoint(
                  svg.current,
                  event.clientX,
                  event.clientY,
                );
                if (point)
                  onInteraction({
                    type: 'moveNode',
                    nodeId: moving.current,
                    point,
                  });
                return;
              }
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
              if (moving.current) {
                moving.current = null;
                if (svg.current?.hasPointerCapture(event.pointerId))
                  svg.current.releasePointerCapture(event.pointerId);
                return;
              }
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
              <pattern
                id={`${marker}-dots`}
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="20" cy="20" r="1" fill="#64748b" opacity=".5" />
              </pattern>
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
            {isInteracting && (
              <rect
                x="0"
                y="0"
                width="1000"
                height="720"
                fill={`url(#${marker}-dots)`}
                className="pointer-events-none"
              />
            )}
            {isInteracting && tool === 'node' && (
              <g
                className="graph-keyboard-cursor"
                transform={`translate(${cursor.x},${cursor.y})`}
              >
                <circle r="12" />
                <path d="M -18 0 H 18 M 0 -18 V 18" />
              </g>
            )}
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
              const badgeWidth = Math.max(
                40,
                String(edge.weight).length * 7 + 16,
              );
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
                      x={-badgeWidth / 2}
                      y="-15"
                      width={badgeWidth}
                      height="30"
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
                  data-node-state={state}
                  transform={`translate(${point.x}, ${point.y})`}
                  role="button"
                  tabIndex={isInteracting ? 0 : -1}
                  aria-disabled={!isInteracting}
                  aria-label={`Node ${id}, ${state}. ${tool === 'edge' ? 'Connect' : tool === 'delete' ? 'Delete' : `Set ${tool}`}.`}
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    if (
                      isInteracting &&
                      tool === 'move' &&
                      event.button === 0
                    ) {
                      moving.current = id;
                      svg.current?.setPointerCapture(event.pointerId);
                    }
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
                    if (
                      tool === 'move' &&
                      [
                        'ArrowUp',
                        'ArrowDown',
                        'ArrowLeft',
                        'ArrowRight',
                      ].includes(event.key)
                    ) {
                      event.preventDefault();
                      event.stopPropagation();
                      onInteraction({
                        type: 'moveNode',
                        nodeId: id,
                        point: {
                          x:
                            point.x +
                            (event.key === 'ArrowRight'
                              ? 20
                              : event.key === 'ArrowLeft'
                                ? -20
                                : 0),
                          y:
                            point.y +
                            (event.key === 'ArrowDown'
                              ? 20
                              : event.key === 'ArrowUp'
                                ? -20
                                : 0),
                        },
                      });
                    } else if (event.key === 'Enter' || event.key === ' ') {
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
                  <circle r="20" className="stroke-2" />
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
      {!Object.keys(nodes).length && <CanvasEmptyState kind="graph" />}
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
