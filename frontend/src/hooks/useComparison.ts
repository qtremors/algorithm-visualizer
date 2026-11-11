import { useMemo } from 'react';
import { useAlgorithmRunner } from './useAlgorithmRunner';
import { usePlayback } from './usePlayback';
import type { InputData } from '../types/input';

/** One received step per lane per tick; finished lanes retain their final frame. */
export function useComparison(
  category: string,
  leftName: string,
  rightName: string,
) {
  const left = useAlgorithmRunner(category, leftName);
  const right = useAlgorithmRunner(category, rightName);
  const failed = left.status === 'failed' || right.status === 'failed';
  const streaming = left.isRunning || right.isRunning;
  const timeline = useMemo(() => {
    const maximum = Math.max(left.steps.length, right.steps.length);
    // Wait for a frame from every unfinished lane. A completed lane can hold
    // its last frame while the other continues; a slower stream cannot skip.
    const leftHorizon =
      left.status === 'completed' ? maximum : left.steps.length;
    const rightHorizon =
      right.status === 'completed' ? maximum : right.steps.length;
    const length = Math.min(maximum, leftHorizon, rightHorizon);
    return Array.from(
      { length },
      (_, index) => left.steps[index] || right.steps[index],
    );
  }, [left.steps, right.steps, left.status, right.status]);
  const playback = usePlayback(timeline, streaming, failed);
  const reset = () => {
    playback.reset();
    left.resetSteps();
    right.resetSteps();
  };
  const run = (input: InputData) => {
    if (streaming || playback.isPlaying) return;
    reset();
    left.runAlgorithm(structuredClone(input));
    right.runAlgorithm(structuredClone(input));
    playback.start();
  };
  return {
    left,
    right,
    playback,
    reset,
    run,
    streaming,
    failed,
    busy: streaming || playback.isPlaying,
    leftIndex: Math.min(
      playback.currentStepIndex,
      Math.max(0, left.steps.length - 1),
    ),
    rightIndex: Math.min(
      playback.currentStepIndex,
      Math.max(0, right.steps.length - 1),
    ),
    count: timeline.length,
  };
}
