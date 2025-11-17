import { Play, Pause, StepForward, StepBack, RotateCcw, Zap, Layout } from 'lucide-react';
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
};

const MIN_SPEED = 10; // min delay
const MAX_SPEED = 500; // max delay
const speedToSlider = (speed: number) => MAX_SPEED + MIN_SPEED - speed;
const sliderToSpeed = (sliderVal: number) => MAX_SPEED + MIN_SPEED - sliderVal;

export default function PlaybackControls({
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onReset,
  speed,
  onSpeedChange,
  disabled,
  onVisualize,
  isVisualizing,
  onOpenCombined
}: PlaybackControlsProps) {

  const sliderValue = speedToSlider(speed);
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSpeedChange(sliderToSpeed(parseInt(e.target.value, 10)));
  };
  
  return (
    <div className="bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6 border border-gray-700">
      
      {/* Left: Playback Icons */}
      <div className="flex items-center gap-2">
        <IconButton onClick={onReset} disabled={disabled && !isVisualizing} aria-label="Reset">
          <RotateCcw className="h-5 w-5" />
        </IconButton>
        <IconButton onClick={onPrev} disabled={disabled || isPlaying} aria-label="Previous">
          <StepBack className="h-5 w-5" />
        </IconButton>
        
        {isPlaying ? (
          <IconButton onClick={onPause} disabled={disabled} aria-label="Pause" className="bg-blue-600 hover:bg-blue-500 text-white border-blue-500">
            <Pause className="h-6 w-6 fill-current" />
          </IconButton>
        ) : (
          <IconButton onClick={onPlay} disabled={disabled} aria-label="Play" className="bg-blue-600 hover:bg-blue-500 text-white border-blue-500">
            <Play className="h-6 w-6 fill-current" />
          </IconButton>
        )}
        
        <IconButton onClick={onNext} disabled={disabled || isPlaying} aria-label="Next">
          <StepForward className="h-5 w-5" />
        </IconButton>
      </div>
      
      {/* Middle: Speed Control */}
      <div className="flex items-center gap-3 w-full sm:w-auto flex-grow justify-center px-4">
        <span className="text-xs font-medium text-gray-400">Slow</span>
        <input
          type="range"
          min={MIN_SPEED}
          max={MAX_SPEED}
          value={sliderValue}
          onChange={handleSliderChange}
          className="w-full max-w-[200px] h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          disabled={disabled}
        />
        <span className="text-xs font-medium text-gray-400">Fast</span>
      </div>

      {/* Right: Action Buttons */}
      <div className="flex items-center gap-2">
          {/* Combined View Button */}
          <button 
             onClick={onOpenCombined}
             className="p-2.5 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600 hover:text-white transition-all border border-gray-600"
             title="Open Combined View"
          >
             <Layout size={18} />
          </button>

          {/* Visualize Button */}
          <button 
            onClick={onVisualize}
            disabled={isVisualizing || isPlaying}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 whitespace-nowrap h-12"
          >
            {isVisualizing ? (
                <span className="flex items-center gap-2">Running...</span>
            ) : (
                <> <Zap size={18} fill="currentColor" /> Visualize</>
            )}
          </button>
      </div>

    </div>
  );
}

const IconButton = ({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={cn(
      "p-2.5 rounded-full bg-gray-700 text-gray-200 hover:bg-gray-600 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-gray-600",
      className
    )}
  >
    {children}
  </button>
);