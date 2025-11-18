import React, { useMemo } from 'react';
import type { AlgorithmStep } from '../../types';
import { cn } from '../../lib/utils';

const EDGE_COLORS = [
  "stroke-purple-500", 
  "stroke-orange-500", 
  "stroke-pink-500",   
  "stroke-teal-500",   
  "stroke-indigo-500"  
];

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
  showEdgeColors: boolean;
  showPath: boolean; 
  isFitToScreen: boolean;
};

export default function GraphVisualizer({ 
  step, initialData, isInteracting, 
  onNodeClick, onNodeDragStart, onNodeMouseUp, onNodeDrag, onNodeDragEnd, onWeightClick, 
  tempLine, zoom, showEdgeColors, showPath, isFitToScreen
}: GraphVisualizerProps) {
  
  const nodes = initialData?.nodes || {}; 
  const adjacency = initialData?.adjacency || {}; 
  const startNode = initialData?.start;
  const endNode = initialData?.end;

  const visited = new Set(step?.snapshot?.visited || []);
  const pathList = step?.snapshot?.path || [];
  const pathSet = new Set(pathList);
  const currentNode = step?.payload?.node;

  const { contentWidth, contentHeight } = useMemo(() => {
      let maxX = 0; 
      let maxY = 0;  
      const keys = Object.keys(nodes);
      if (keys.length === 0) return { contentWidth: 800, contentHeight: 600 };

      keys.forEach((key) => {
          const n = nodes[key];
          if (n.x > maxX) maxX = n.x;
          if (n.y > maxY) maxY = n.y;
      });
      return { contentWidth: maxX + 100, contentHeight: maxY + 100 };
  }, [nodes]);

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
      const neighborKeys = Object.keys(neighbors);
      
      neighborKeys.forEach((targetId, index) => {
        const pairId = `${sourceId}-${targetId}`;
        const source = nodes[sourceId];
        const target = nodes[targetId];
        if (!source || !target) return;
        
        const weight = neighbors[targetId];
        const isVisited = (visited.has(sourceId) && visited.has(targetId));
        const isPath = pathSet.has(sourceId) && pathSet.has(targetId);
        
        let strokeColor = "stroke-gray-700";
        let strokeWidth = "2";
        let opacity = "opacity-50";
        let zOrder = 0;

        if (isPath) { 
            strokeColor = "stroke-yellow-400"; 
            strokeWidth = "4"; 
            opacity = "opacity-100";
            zOrder = 10;
        }
        else if (isVisited) { 
            strokeColor = "stroke-blue-500"; 
            strokeWidth = "3"; 
            opacity = "opacity-80";
            zOrder = 5;
        }
        else if (showEdgeColors) {
            strokeColor = EDGE_COLORS[index % 5];
            opacity = "opacity-60";
        }

        const sx = source.x; const sy = source.y;
        const tx = target.x; const ty = target.y;

        edges.push(
          <g key={pairId} style={{ zIndex: zOrder }}>
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
      const isPath = pathSet.has(nodeId);

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
            transform={`translate(${node.x}, ${node.y})`} 
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

  // Inner Container Style (The part that grows/shrinks)
  const contentStyle = isFitToScreen 
    ? { width: '100%', height: '100%' }
    : { width: contentWidth * zoom, height: contentHeight * zoom };

  return (
    <div className="w-full h-full relative group">
        
        {/* --- Scroll Container --- */}
        <div 
            className={cn("w-full h-full", isFitToScreen ? "overflow-hidden" : "overflow-auto")}
            onMouseMove={(e) => isInteracting && onNodeDrag && onNodeDrag('canvas', e)}
            onMouseUp={onNodeDragEnd}
            onMouseLeave={onNodeDragEnd}
        >
            {/* --- Sized Content Area --- */}
            <div style={contentStyle} className="relative">
                <svg 
                    viewBox={`0 0 ${contentWidth} ${contentHeight}`}
                    className="block w-full h-full"
                    preserveAspectRatio={isFitToScreen ? "xMidYMid meet" : "xMidYMid slice"}
                >
                    {renderEdges()}
                    {tempLine && <path d={getPathD(tempLine.start.x, tempLine.start.y, tempLine.end.x, tempLine.end.y)} className="stroke-white opacity-50 fill-none" strokeWidth="2" strokeDasharray="5,5" />}
                    {renderNodes()}
                </svg>
            </div>
        </div>

        {pathList.length > 0 && showPath && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gray-900/90 border border-yellow-500/30 rounded-full px-6 py-3 shadow-2xl flex items-center gap-3 max-w-[90%] animate-in slide-in-from-bottom-4 fade-in duration-300 z-50">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Final Path</span>
                <div className="h-4 w-px bg-gray-700"></div>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-fade">
                    {pathList.map((nodeId: string, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className={cn("font-mono font-bold text-sm", i === 0 ? "text-green-400" : i === pathList.length - 1 ? "text-red-400" : "text-yellow-400")}>
                                {nodeId}
                            </span>
                            {i < pathList.length - 1 && <span className="text-gray-600 text-xs">→</span>}
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
}