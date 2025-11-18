import { useEffect, useRef, useState } from 'react';
import type { AlgorithmStep } from '../../types';
import { cn } from '../../lib/utils';

type GridVisualizerProps = {
  step: AlgorithmStep | null;
  initialData: any;
  mode?: string;
  onUpdate?: (newData: any) => void;
  isInteracting?: boolean;
  zoom: number;
  isFitToScreen: boolean;
};

export default function GridVisualizer({ 
  step, initialData, mode, onUpdate, isInteracting,
  zoom, isFitToScreen 
}: GridVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(24); 

  const gridData = step?.snapshot?.grid || initialData?.grid;
  
  useEffect(() => {
    if (!isFitToScreen || !containerRef.current || !gridData) return;

    const updateSize = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const cols = gridData[0].length;
      const rows = gridData.length;
      
      const sizeX = (width - 40) / cols;
      const sizeY = (height - 40) / rows;
      setCellSize(Math.min(sizeX, sizeY));
    };

    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    updateSize(); 

    return () => observer.disconnect();
  }, [isFitToScreen, gridData]);

  if (!gridData) return <div className="flex items-center justify-center h-full text-gray-500">Initialize Grid to Start</div>;

  const cols = gridData[0].length;

  const renderSize = isFitToScreen ? cellSize : (24 * zoom);

  const startNode = step?.payload?.start || initialData?.start || { row: 0, col: 0 };
  const endNode = step?.payload?.end || initialData?.end || { row: 0, col: 0 };
  
  const visited = new Set(step?.snapshot?.visited?.map((n: number[]) => `${n[0]}-${n[1]}`) || []);
  const path = new Set(step?.snapshot?.path?.map((n: number[]) => `${n[0]}-${n[1]}`) || []);
  
  const startId = `${startNode.row}-${startNode.col}`;
  const endId = `${endNode.row}-${endNode.col}`;

  const handleCellClick = (r: number, c: number) => {
    if (!isInteracting || !onUpdate || !initialData) return;
    const newData = JSON.parse(JSON.stringify(initialData));
    
    if (mode === 'start') { newData.start = { row: r, col: c }; newData.grid[r][c] = 0; }
    else if (mode === 'end') { newData.end = { row: r, col: c }; newData.grid[r][c] = 0; }
    else if (mode === 'wall') {
        if ((r !== newData.start.row || c !== newData.start.col) && (r !== newData.end.row || c !== newData.end.col)) {
            newData.grid[r][c] = newData.grid[r][c] === 1 ? 0 : 1;
        }
    }
    onUpdate(newData);
  };

  const getCellColor = (r: number, c: number) => {
    const id = `${r}-${c}`;
    const isWall = gridData[r][c] === 1;
    
    if (id === startId) return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] z-10 scale-110';
    if (id === endId) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] z-10 scale-110';
    if (isWall) return 'bg-gray-600';
    if (path.has(id)) return 'bg-yellow-400 animate-in zoom-in duration-300';
    if (visited.has(id)) return 'bg-blue-500 animate-in fade-in duration-200';
    
    return 'bg-gray-800/50 hover:bg-gray-700/80'; 
  };
  
  return (
    <div 
        ref={containerRef} 
        className={cn(
            "flex w-full h-full p-4 bg-gray-900/50 rounded-lg border border-gray-800 relative transition-all",
            isFitToScreen ? "items-center justify-center overflow-hidden" : "overflow-auto"
        )}
    >
      <div 
        className={cn(
            "grid gap-[1px] bg-gray-800/50 p-1 rounded transition-all duration-300 ease-out",
            !isFitToScreen && "m-auto"
        )}
        style={{
          gridTemplateColumns: `repeat(${cols}, ${renderSize}px)`,
          minWidth: isFitToScreen ? 'auto' : 'max-content',
          minHeight: isFitToScreen ? 'auto' : 'max-content'
        }}
      >
        {gridData.map((row: number[], r: number) =>
          row.map((_: number, c: number) => (
            <div
              key={`${r}-${c}`}
              onMouseDown={() => handleCellClick(r, c)}
              style={{ height: `${renderSize}px`, width: `${renderSize}px` }}
              className={cn("rounded-[1px] transition-colors duration-75 cursor-pointer border border-white/5", getCellColor(r, c))}
            />
          ))
        )}
      </div>
    </div>
  );
}