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
import RangeControl from './RangeControl';
import { playbackRate } from '../../lib/runState';
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
    <div className="playback-toolbar">
      <div className="playback-group" role="group" aria-label="Playback">
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
          className="control-play"
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
        <p className="shortcut-popover">
          Space: Play/Pause
          <br />← / →: Previous/Next
          <br />
          Home / End: First/Last
          <br />
          Ctrl/⌘ Z: Undo input
          <br />
          R: Cancel and reset
        </p>
      </details>
      <RangeControl
        label="Speed"
        accessibleLabel="Playback speed"
        value={510 - p.speed}
        min={10}
        max={500}
        displayValue={playbackRate(p.speed)}
        disabled={p.disabled}
        disabledReason="Start a visualization to adjust playback speed."
        onChange={(value) => p.onSpeedChange(510 - value)}
      />
      <span
        className="text-xs text-gray-400"
        aria-label="Buffered playback time"
      >
        {p.estimatedRemainingTime > 0
          ? `~${(p.estimatedRemainingTime / 1000).toFixed(1)}s${p.isVisualizing ? ' buffered' : ' left'}`
          : ''}
      </span>
      {p.hasViewControls && (
        <div className="playback-group" role="group" aria-label="View controls">
          <IconButton
            onClick={p.onToggleFit}
            aria-label="Fit to screen"
            aria-pressed={p.isFitToScreen}
          >
            <Maximize size={16} />
          </IconButton>
          <RangeControl
            label="Zoom"
            value={p.zoom}
            min={0.5}
            max={2}
            step={0.1}
            displayValue={`${p.zoom.toFixed(1)}×`}
            valueText={`${Math.round(p.zoom * 100)} percent`}
            disabled={p.isFitToScreen}
            disabledReason="Turn off Fit to screen to change zoom."
            onChange={p.onZoomChange}
          />
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
      <div className="playback-actions">
        <IconButton onClick={p.onOpenCombined} aria-label="Detailed view">
          <Code size={18} />
        </IconButton>
        <button
          type="button"
          onClick={p.onVisualize}
          disabled={!p.canVisualize || p.isVisualizing || p.isPlaying}
          className="action-primary"
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
        'control-icon text-gray-200 disabled:cursor-not-allowed',
        className,
      )}
    />
  );
}
