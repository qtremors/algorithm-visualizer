import type { AlgorithmStep } from '../../types';
import { cn } from '../../lib/utils';

type GridVisualizerProps = {
  step: AlgorithmStep | null;
  initialData: any;
  mode?: string; 
  onUpdate?: (newData: any) => void;
  isInteracting?: boolean;
};

export default function GridVisualizer({ step, initialData, mode, onUpdate, isInteracting }: GridVisualizerProps) {
  // 1. Determine current state source
  const gridData = step?.snapshot?.grid || initialData?.grid;
  
  if (!gridData) return <div className="flex items-center justify-center h-full text-gray-500">Initialize Grid to Start</div>;

  const cols = gridData[0].length;

  const startNode = step?.payload?.start || initialData?.start || { row: 0, col: 0 };
  const endNode = step?.payload?.end || initialData?.end || { row: 0, col: 0 };
  
  // Convert arrays to Sets for O(1) lookup
  const visited = new Set(step?.snapshot?.visited?.map((n: number[]) => `${n[0]}-${n[1]}`) || []);
  const path = new Set(step?.snapshot?.path?.map((n: number[]) => `${n[0]}-${n[1]}`) || []);
  
  const startId = `${startNode.row}-${startNode.col}`;
  const endId = `${endNode.row}-${endNode.col}`;

  const handleCellClick = (r: number, c: number) => {
    if (!isInteracting || !onUpdate || !initialData) return;

    const newData = JSON.parse(JSON.stringify(initialData));
    
    if (mode === 'start') {
        newData.start = { row: r, col: c };
        newData.grid[r][c] = 0; 
    } else if (mode === 'end') {
        newData.end = { row: r, col: c };
        newData.grid[r][c] = 0; 
    } else if (mode === 'wall') {
        if ((r !== newData.start.row || c !== newData.start.col) && 
            (r !== newData.end.row || c !== newData.end.col)) {
            newData.grid[r][c] = newData.grid[r][c] === 1 ? 0 : 1;
        }
    }
    onUpdate(newData);
  };

  const getCellColor = (r: number, c: number) => {
    const id = `${r}-${c}`;
    const isWall = gridData[r][c] === 1;
    
    // 1. Special Nodes (Override everything)
    if (id === startId) return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)] z-10 scale-110';
    if (id === endId) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)] z-10 scale-110';
    
    // 2. Walls
    if (isWall) return 'bg-gray-500 animate-pop';

    // 3. Algorithm Progress
    if (path.has(id)) return 'bg-yellow-400 animate-path';
    if (visited.has(id)) return 'bg-blue-500 animate-visited';
    
    // 4. Empty
    return 'bg-gray-800/50 hover:bg-gray-700/80'; 
  };
  
  return (
    <div className="flex-grow flex items-center justify-center w-full h-full p-4 overflow-auto bg-gray-900/50 rounded-lg border border-gray-800">
      <div 
        className="grid gap-[1px] bg-gray-800/50 p-1 rounded"
        style={{
          gridTemplateColumns: `repeat(${cols}, 24px)`,
        }}
        onMouseLeave={() => { /* Optional */ }}
      >
        {gridData.map((row: number[], r: number) =>
          row.map((_: number, c: number) => (
            <div
              key={`${r}-${c}`}
              onMouseDown={() => handleCellClick(r, c)}
              className={cn(
                "h-6 w-6 rounded-[2px] transition-all duration-200 cursor-pointer border border-white/5",
                getCellColor(r, c)
              )}
            />
          ))
        )}
      </div>
    </div>
  );
}