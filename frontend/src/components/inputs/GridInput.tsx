import { useState, useEffect } from 'react';
import { Ban, Flag, PlayCircle, Shuffle, RefreshCw, Layers } from 'lucide-react'; // Added Layers icon
import { cn } from '../../lib/utils';

type GridInputProps = {
  onSubmit: (data: any) => void;
  mode?: string;
  setMode?: (mode: string) => void;
  currentData?: any;
};

export default function GridInput({ onSubmit, mode, setMode, currentData }: GridInputProps) {
  const [rows, setRows] = useState(15);
  const [cols, setCols] = useState(30);
  const [wallDensity, setWallDensity] = useState(30); // Default 30% walls
  
  useEffect(() => {
    if (currentData?.grid) {
      setRows(currentData.grid.length);
      setCols(currentData.grid[0].length);
    } else {
      handleGenerate();
    }
  }, []);

  const createBaseGrid = (r: number, c: number) => Array(r).fill(0).map(() => Array(c).fill(0));

  const handleGenerate = (newRows = rows, newCols = cols) => {
    const newGrid = {
      grid: createBaseGrid(newRows, newCols),
      start: { row: Math.floor(newRows / 2), col: Math.floor(newCols / 4) },
      end: { row: Math.floor(newRows / 2), col: Math.floor(newCols * 0.75) }
    };
    onSubmit(newGrid);
  };

  const handleRandom = () => {
    const r = rows;
    const c = cols;
    const start = { row: Math.floor(Math.random() * r), col: Math.floor(Math.random() * c) };
    let end = { row: Math.floor(Math.random() * r), col: Math.floor(Math.random() * c) };
    
    while (end.row === start.row && end.col === start.col) {
        end = { row: Math.floor(Math.random() * r), col: Math.floor(Math.random() * c) };
    }

    const grid = createBaseGrid(r, c).map((rowArray, rowIndex) => 
      rowArray.map((_, colIndex) => {
        if ((rowIndex === start.row && colIndex === start.col) || 
            (rowIndex === end.row && colIndex === end.col)) return 0;
        
        return Math.random() < (wallDensity / 100) ? 1 : 0;
      })
    );
    onSubmit({ grid, start, end });
  };

  const updateCoordinate = (type: 'start' | 'end', axis: 'row' | 'col', val: number) => {
    if (!currentData) return;
    const newData = JSON.parse(JSON.stringify(currentData));
    const maxVal = axis === 'row' ? rows - 1 : cols - 1;
    const validVal = Math.max(0, Math.min(val, maxVal));
    newData[type][axis] = validVal;
    if (newData.grid[newData[type].row][newData[type].col] === 1) {
        newData.grid[newData[type].row][newData[type].col] = 0;
    }
    onSubmit(newData);
  };

  const startR = currentData?.start?.row ?? 0;
  const startC = currentData?.start?.col ?? 0;
  const endR = currentData?.end?.row ?? 0;
  const endC = currentData?.end?.col ?? 0;

  return (
    <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 w-full">
      {/* Left Group: Grid Config */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Grid Generator</span>
        <div className="flex items-center bg-gray-900 rounded-lg border border-gray-700 p-1">
          {/* Size Inputs */}
          <span className="text-xs text-gray-500 pl-2">Size:</span>
          <input type="number" value={rows} onChange={e => setRows(Number(e.target.value))} className="w-9 bg-transparent text-white text-sm text-center focus:outline-none" min="5" max="50"/>
          <span className="text-gray-500 text-xs">x</span>
          <input type="number" value={cols} onChange={e => setCols(Number(e.target.value))} className="w-9 bg-transparent text-white text-sm text-center focus:outline-none" min="5" max="50"/>
          
          <div className="w-px h-5 bg-gray-700 mx-2"></div>
          
          {/* Wall Density Input */}
          <span className="text-xs text-gray-500">Walls:</span>
          <input type="number" value={wallDensity} onChange={e => setWallDensity(Number(e.target.value))} className="w-9 bg-transparent text-white text-sm text-center focus:outline-none" min="0" max="90"/>
          <span className="text-gray-500 text-xs pr-1">%</span>

          <div className="w-px h-5 bg-gray-700 mx-2"></div>
          
          {/* Action Buttons */}
          <button onClick={() => handleGenerate(rows, cols)} className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors" title="Clear Grid">
            <RefreshCw size={14} />
          </button>
          <button onClick={handleRandom} className="p-1.5 hover:bg-gray-800 rounded text-purple-400 hover:text-purple-300 transition-colors" title="Randomize Walls">
            <Shuffle size={14} />
          </button>
        </div>
      </div>

      {/* Middle Group: Tools & Coordinates */}
      <div className="flex flex-col gap-1.5 flex-grow">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tools & Points</span>
        <div className="flex flex-wrap items-center gap-3">
            {/* Drawing Tools Toggle Group */}
            {setMode && (
                <div className="flex items-center bg-gray-900 rounded-lg border border-gray-700 p-1">
                <ToolButton active={mode === 'start'} onClick={() => setMode('start')} icon={<PlayCircle size={14} fill="currentColor" />} label="Start" color="text-green-500" />
                <div className="w-px h-4 bg-gray-700 mx-1"></div>
                <ToolButton active={mode === 'end'} onClick={() => setMode('end')} icon={<Flag size={14} fill="currentColor"/>} label="End" color="text-red-500" />
                <div className="w-px h-4 bg-gray-700 mx-1"></div>
                <ToolButton active={mode === 'wall'} onClick={() => setMode('wall')} icon={<Ban size={14}/>} label="Wall" color="text-gray-400" />
                </div>
            )}

            {/* Coordinates Display */}
            <div className="flex items-center gap-2 bg-gray-900/50 px-3 py-1.5 rounded-lg border border-gray-700/50">
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-xs text-gray-400">Start:</span>
                    <input type="number" value={startR} onChange={e => updateCoordinate('start', 'row', Number(e.target.value))} className="w-8 bg-transparent text-white text-xs border-b border-gray-600 text-center focus:border-green-500 outline-none" />
                    <span className="text-gray-600">,</span>
                    <input type="number" value={startC} onChange={e => updateCoordinate('start', 'col', Number(e.target.value))} className="w-8 bg-transparent text-white text-xs border-b border-gray-600 text-center focus:border-green-500 outline-none" />
                </div>
                <div className="w-px h-4 bg-gray-700 mx-1"></div>
                <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="text-xs text-gray-400">End:</span>
                    <input type="number" value={endR} onChange={e => updateCoordinate('end', 'row', Number(e.target.value))} className="w-8 bg-transparent text-white text-xs border-b border-gray-600 text-center focus:border-red-500 outline-none" />
                    <span className="text-gray-600">,</span>
                    <input type="number" value={endC} onChange={e => updateCoordinate('end', 'col', Number(e.target.value))} className="w-8 bg-transparent text-white text-xs border-b border-gray-600 text-center focus:border-red-500 outline-none" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

const ToolButton = ({ active, onClick, icon, label, color }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
      active 
        ? "bg-gray-700 text-white shadow-sm" 
        : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
    )}
  >
    <span className={cn(active ? color : "text-gray-500")}>{icon}</span>
    <span>{label}</span>
  </button>
);