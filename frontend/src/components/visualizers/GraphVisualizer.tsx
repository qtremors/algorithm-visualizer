import React, { useMemo } from 'react';
import type { AlgorithmStep } from '../../types';
import { cn } from '../../lib/utils';

type GraphVisualizerProps = {
  step: AlgorithmStep | null;
  initialData: any;
  isInteracting?: boolean;
  onNodeClick?: (nodeId: string) => void;
  onNodeDragStart?: (nodeId: string, e: React.MouseEvent) => void;
  onNodeMouseUp?: (nodeId: string) => void;
  onNodeDrag?: (nodeId: string, e: React.MouseEvent) => void;
  onNodeDragEnd?: () => void;
  onWeightClick?: (sourceId: string, targetId: string, currentWeight: number) => void;
  tempLine?: { start: {x:number, y:number}, end: {x:number, y:number} } | null;
  zoom: number; 
};

export default function GraphVisualizer({ 
  step, initialData, isInteracting, onNodeClick, onNodeDragStart, onNodeMouseUp, onNodeDrag, onNodeDragEnd, onWeightClick, tempLine, zoom
}: GraphVisualizerProps) {
  
  const nodes = initialData?.nodes || {}; 
  const adjacency = initialData?.adjacency || {}; 
  const startNode = initialData?.start;
  const endNode = initialData?.end;

  const visited = new Set(step?.snapshot?.visited || []);
  const path = new Set(step?.snapshot?.path || []);
  const currentNode = step?.payload?.node;

  const { width, height } = useMemo(() => {
      let maxX = 1000; 
      let maxY = 600;  
      Object.values(nodes).forEach((n: any) => {
          if ((n.x * zoom) > maxX - 100) maxX = (n.x * zoom) + 100;
          if ((n.y * zoom) > maxY - 100) maxY = (n.y * zoom) + 100;
      });
      return { width: maxX, height: maxY };
  }, [nodes, zoom]);

  const getPathD = (x1: number, y1: number, x2: number, y2: number) => {
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const curveOffset = 20; 
    return `M ${x1} ${y1} Q ${cx} ${cy + curveOffset} ${x2} ${y2}`;
  };

  const renderEdges = () => {
    const edges: React.ReactNode[] = [];

    Object.keys(adjacency).forEach((sourceId) => {
      const neighbors = adjacency[sourceId];
      Object.keys(neighbors).forEach((targetId) => {
        const pairId = `${sourceId}-${targetId}`;
        const source = nodes[sourceId];
        const target = nodes[targetId];
        if (!source || !target) return;
        
        const weight = neighbors[targetId];
        const isVisited = (visited.has(sourceId) && visited.has(targetId));
        const isPath = (path.has(sourceId) && path.has(targetId));
        
        let strokeColor = "stroke-gray-700";
        let strokeWidth = "2";
        let opacity = "opacity-50";
        
        if (isPath) { strokeColor = "stroke-yellow-400"; strokeWidth = "4"; opacity = "opacity-100"; }
        else if (isVisited) { strokeColor = "stroke-blue-500"; strokeWidth = "3"; opacity = "opacity-80"; }

        const sx = source.x * zoom; const sy = source.y * zoom;
        const tx = target.x * zoom; const ty = target.y * zoom;

        edges.push(
          <g key={pairId}>
            <path
              d={getPathD(sx, sy, tx, ty)}
              className={cn("fill-none transition-all duration-500 pointer-events-none", strokeColor, opacity)}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <g 
                transform={`translate(${(sx + tx) / 2}, ${(sy + ty) / 2 + 10})`}
                onClick={(e) => { e.stopPropagation(); if (isInteracting && onWeightClick) onWeightClick(sourceId, targetId, weight); }}
                className={cn("transition-colors group", isInteracting ? "cursor-pointer" : "")}
            >
                <rect x="-10" y="-10" width="20" height="20" rx="4" className="fill-gray-900 stroke-gray-600 stroke-1 group-hover:stroke-blue-500" />
                <text dy=".3em" className="fill-gray-300 text-[10px] font-mono select-none font-bold" textAnchor="middle">{weight}</text>
            </g>
          </g>
        );
      });
    });
    return edges;
  };

  const renderNodes = () => {
    return Object.keys(nodes).map((nodeId) => {
      const node = nodes[nodeId];
      const isStart = nodeId === startNode;
      const isEnd = nodeId === endNode;
      const isCurrent = nodeId === currentNode;
      const isVisited = visited.has(nodeId);
      const isPath = path.has(nodeId);

      let bgClass = "fill-gray-800 stroke-gray-500";
      let glowClass = "";

      if (isStart) { bgClass = "fill-green-600 stroke-green-400"; glowClass = "filter drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]"; }
      else if (isEnd) { bgClass = "fill-red-600 stroke-red-400"; glowClass = "filter drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"; }
      else if (isPath) { bgClass = "fill-yellow-500 stroke-yellow-300"; glowClass = "filter drop-shadow-[0_0_6px_rgba(234,179,8,0.6)]"; }
      else if (isCurrent) { bgClass = "fill-blue-400 stroke-blue-200"; glowClass = "filter drop-shadow-[0_0_10px_rgba(96,165,250,0.9)]"; }
      else if (isVisited) { bgClass = "fill-blue-900 stroke-blue-700"; }

      return (
        <g 
            key={nodeId} 
            transform={`translate(${node.x * zoom}, ${node.y * zoom})`}
            onMouseDown={(e) => { e.stopPropagation(); if (isInteracting && onNodeDragStart) onNodeDragStart(nodeId, e); }}
            onMouseUp={(e) => { e.stopPropagation(); if (isInteracting && onNodeMouseUp) onNodeMouseUp(nodeId); }}
            onClick={(e) => { e.stopPropagation(); if (isInteracting && onNodeClick) onNodeClick(nodeId); }}
            className="cursor-pointer transition-all duration-300"
        >
          <circle r="20" className={cn("stroke-2 transition-all duration-300", bgClass, glowClass)} />
          <text dy=".3em" textAnchor="middle" className="fill-white text-xs font-bold pointer-events-none select-none">{nodeId}</text>
        </g>
      );
    });
  };

  if (!nodes || Object.keys(nodes).length === 0) return <div className="flex items-center justify-center h-full text-gray-500">Generate a Graph to Start</div>;

  return (
    <div 
        className="w-full h-full"
        onMouseMove={(e) => isInteracting && onNodeDrag && onNodeDrag('canvas', e)}
        onMouseUp={onNodeDragEnd}
        onMouseLeave={onNodeDragEnd}
    >
      <svg width={width} height={height} className="block min-w-full min-h-full">
        {renderEdges()}
        {tempLine && (
            <path d={getPathD(tempLine.start.x * zoom, tempLine.start.y * zoom, tempLine.end.x * zoom, tempLine.end.y * zoom)} className="stroke-white opacity-50 fill-none" strokeWidth="2" strokeDasharray="5,5" />
        )}
        {renderNodes()}
      </svg>
    </div>
  );
}