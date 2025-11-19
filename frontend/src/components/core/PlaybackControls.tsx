import {
  Play,
  Pause,
  StepForward,
  StepBack,
  RotateCcw,
  Zap,
  Maximize,
  Eye,
  Palette,
  Code,
} from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
type Props = {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  disabled: boolean;
  canReset: boolean;
  canVisualize: boolean;
  onVisualize: () => void;
  isVisualizing: boolean;
  onOpenCombined: () => void;
  hasViewControls: boolean;
  isGraphView: boolean;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isFitToScreen: boolean;
  onToggleFit: () => void;
  showPath: boolean;
  onTogglePath: () => void;
  showEdgeColors: boolean;
  onToggleEdgeColors: () => void;
  estimatedRemainingTime: number;
};
export default function PlaybackControls(p: Props) {
  return (
    <div className="bg-gray-800 p-3 rounded-xl flex flex-wrap items-center justify-between gap-4 border border-gray-700">
      <div
        className="flex items-center gap-2"
        role="group"
        aria-label="Playback"
      >
        <IconButton
          onClick={p.onReset}
          disabled={!p.canReset}
          aria-label={p.isVisualizing ? 'Cancel and reset' : 'Reset'}
          title="Reset"
        >
          <RotateCcw size={16} />
        </IconButton>
        <IconButton
          onClick={p.onPrev}
          disabled={p.disabled || p.isPlaying}
          aria-label="Previous step"
        >
          <StepBack size={16} />
        </IconButton>
        <IconButton
          onClick={p.isPlaying ? p.onPause : p.onPlay}
          disabled={p.disabled}
          aria-label={p.isPlaying ? 'Pause' : 'Play'}
          className="bg-blue-600"
        >
          {p.isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </IconButton>
        <IconButton
          onClick={p.onNext}
          disabled={p.disabled || p.isPlaying}
          aria-label="Next step"
        >
          <StepForward size={16} />
        </IconButton>
      </div>
      <details className="relative text-xs text-gray-400">
        <summary className="cursor-pointer">Shortcuts</summary>
        <p className="absolute z-10 top-full bg-gray-900 p-3 rounded w-52">
          Space: Play/Pause
          <br />← / →: Previous/Next
          <br />
          R: Cancel and reset
        </p>
      </details>
      <label className="flex items-center gap-2 text-xs">
        Speed
        <input
          aria-label="Playback speed"
          type="range"
          min="10"
          max="500"
          value={510 - p.speed}
          onChange={(e) => p.onSpeedChange(510 - Number(e.target.value))}
          disabled={p.disabled}
          className="w-28 accent-blue-500"
        />
      </label>
      <span
        className="text-xs text-gray-400"
        aria-label="Buffered playback time"
      >
        {p.estimatedRemainingTime > 0
          ? `~${(p.estimatedRemainingTime / 1000).toFixed(1)}s${p.isVisualizing ? ' buffered' : ' left'}`
          : ''}
      </span>
      {p.hasViewControls && (
        <div
          className="flex items-center gap-2"
          role="group"
          aria-label="View controls"
        >
          <IconButton
            onClick={p.onToggleFit}
            aria-label="Fit to screen"
            aria-pressed={p.isFitToScreen}
          >
            <Maximize size={16} />
          </IconButton>
          <label className="text-xs">
            Zoom
            <input
              aria-label="Zoom"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={p.zoom}
              onChange={(e) => p.onZoomChange(Number(e.target.value))}
              disabled={p.isFitToScreen}
              className="w-20 ml-1 accent-blue-500"
            />
          </label>
          {p.isGraphView && (
            <>
              <IconButton
                onClick={p.onTogglePath}
                aria-label="Show path panel"
                aria-pressed={p.showPath}
              >
                <Eye size={16} />
              </IconButton>
              <IconButton
                onClick={p.onToggleEdgeColors}
                aria-label="Color edges"
                aria-pressed={p.showEdgeColors}
              >
                <Palette size={16} />
              </IconButton>
            </>
          )}
        </div>
      )}
      <div className="flex items-center gap-2">
        <IconButton onClick={p.onOpenCombined} aria-label="Detailed view">
          <Code size={18} />
        </IconButton>
        <button
          type="button"
          onClick={p.onVisualize}
          disabled={!p.canVisualize || p.isVisualizing || p.isPlaying}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg text-sm"
        >
          <Zap size={16} />
          {p.isVisualizing ? 'Running...' : 'Visualize'}
        </button>
      </div>
    </div>
  );
}
function IconButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'p-2 rounded-full bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-600',
        className,
      )}
    />
  );
}
