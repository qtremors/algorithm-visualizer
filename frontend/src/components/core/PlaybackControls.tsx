import { Play, Pause, StepForward, StepBack, RotateCcw, Zap, Layout, Maximize, Search, Eye, Palette } from 'lucide-react';
import { cn } from '../../lib/utils';

type PlaybackControlsProps = {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  disabled: boolean;
  onVisualize: () => void;
  isVisualizing: boolean;
  onOpenCombined: () => void;
  
  // View Control Props
  hasViewControls?: boolean;
  isGraphView?: boolean;
  zoom: number;
  onZoomChange: (z: number) => void;
  isFitToScreen: boolean;
  onToggleFit: () => void;
  showPath: boolean;
  onTogglePath: () => void;
  showEdgeColors: boolean;
  onToggleEdgeColors: () => void;
};

const MIN_SPEED = 10;
const MAX_SPEED = 500;
const speedToSlider = (speed: number) => MAX_SPEED + MIN_SPEED - speed;
const sliderToSpeed = (sliderVal: number) => MAX_SPEED + MIN_SPEED - sliderVal;

export default function PlaybackControls({
  isPlaying, onPlay, onPause, onNext, onPrev, onReset,
  speed, onSpeedChange, disabled, onVisualize, isVisualizing, onOpenCombined,
  hasViewControls, isGraphView, zoom, onZoomChange, isFitToScreen, onToggleFit, 
  showPath, onTogglePath, showEdgeColors, onToggleEdgeColors
}: PlaybackControlsProps) {

  const sliderValue = speedToSlider(speed);
  
  return (
    <div className="bg-gray-800 p-3 rounded-xl shadow-lg flex flex-col xl:flex-row items-center justify-between gap-4 border border-gray-700">
      
      {/* 1. Playback Actions */}
      <div className="flex items-center gap-2">
        <IconButton onClick={onReset} disabled={disabled && !isVisualizing} title="Reset">
          <RotateCcw className="h-4 w-4" />
        </IconButton>
        <IconButton onClick={onPrev} disabled={disabled || isPlaying} title="Prev Step">
          <StepBack className="h-4 w-4" />
        </IconButton>
        {isPlaying ? (
          <IconButton onClick={onPause} disabled={disabled} className="bg-blue-600 hover:bg-blue-500 text-white border-blue-500">
            <Pause className="h-5 w-5 fill-current" />
          </IconButton>
        ) : (
          <IconButton onClick={onPlay} disabled={disabled} className="bg-blue-600 hover:bg-blue-500 text-white border-blue-500">
            <Play className="h-5 w-5 fill-current" />
          </IconButton>
        )}
        <IconButton onClick={onNext} disabled={disabled || isPlaying} title="Next Step">
          <StepForward className="h-4 w-4" />
        </IconButton>
      </div>
      
      {/* 2. Speed Control */}
      <div className="flex items-center gap-2 w-full max-w-[150px] px-2">
        <span className="text-[10px] font-bold uppercase text-gray-500">Speed</span>
        <input
          type="range" min={MIN_SPEED} max={MAX_SPEED} value={sliderValue}
          onChange={(e) => onSpeedChange(sliderToSpeed(parseInt(e.target.value, 10)))}
          className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          disabled={disabled}
        />
      </div>

      {/* 3. View Controls */}
      {hasViewControls && (
        <div className="flex items-center gap-2 px-3 border-l border-r border-gray-700 h-8">
            {/* Fit Toggle */}
            <button 
                onClick={onToggleFit}
                className={cn("p-1.5 rounded transition-colors", isFitToScreen ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-700")}
                title={isFitToScreen ? "Switch to Zoom Mode" : "Fit to Screen"}
            >
                <Maximize size={16} />
            </button>

            {/* Zoom Slider */}
            <div className={cn("flex items-center gap-2 transition-opacity", isFitToScreen ? "opacity-30 pointer-events-none" : "opacity-100")}>
                <Search size={14} className="text-gray-500" />
                <input 
                    type="range" min="0.5" max="2" step="0.1" 
                    value={zoom} onChange={(e) => onZoomChange(parseFloat(e.target.value))}
                    className="w-16 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
            </div>

            {/* Graph Specific Controls */}
            {isGraphView && (
              <>
                <div className="w-px h-4 bg-gray-700 mx-1" />
                
                <button 
                    onClick={onTogglePath}
                    className={cn("flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors", showPath ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" : "text-gray-500 hover:bg-gray-700")}
                    title="Show/Hide Path Panel"
                >
                    <Eye size={14} /> Path
                </button>

                <button 
                    onClick={onToggleEdgeColors}
                    className={cn("flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors", showEdgeColors ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-gray-500 hover:bg-gray-700")}
                    title="Toggle Connector Colors"
                >
                    <Palette size={14} /> Colors
                </button>
              </>
            )}
        </div>
      )}

      {/* 4. Main Actions */}
      <div className="flex items-center gap-2">
          <button onClick={onOpenCombined} className="p-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 hover:text-white border border-gray-600" title="Detailed View">
             <Layout size={18} />
          </button>
          <button 
            onClick={onVisualize} disabled={isVisualizing || isPlaying}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 text-sm"
          >
            {isVisualizing ? "Running..." : <><Zap size={16} fill="currentColor" /> Visualize</>}
          </button>
      </div>
    </div>
  );
}

const IconButton = ({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={cn("p-2 rounded-full bg-gray-700 text-gray-200 hover:bg-gray-600 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-gray-600", className)}
  >
    {children}
  </button>
);