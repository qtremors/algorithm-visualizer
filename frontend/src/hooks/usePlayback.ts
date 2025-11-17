import { useState, useEffect, useCallback, useRef } from 'react';
import type { AlgorithmStep } from '../types';

/** Appended stream batches never reset the playhead. Reset is an explicit action. */
export function usePlayback(
  steps: AlgorithmStep[],
  streaming = false,
  failed = false,
) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(200);
  const currentStepIndex = Math.min(index, Math.max(0, steps.length - 1));
  const clock = useRef({
    speed,
    length: steps.length,
    streaming,
    index: currentStepIndex,
  });
  useEffect(() => {
    clock.current = {
      speed,
      length: steps.length,
      streaming,
      index: currentStepIndex,
    };
  }, [speed, steps.length, streaming, currentStepIndex]);
  useEffect(() => {
    if (!isPlaying || failed) return;
    let frame = 0;
    let last = performance.now();
    function tick(now: number) {
      const state = clock.current;
      const available = state.length - 1;
      if (now - last >= state.speed) {
        const advance = Math.floor((now - last) / state.speed);
        last = now - ((now - last) % state.speed);
        if (state.index < available) {
          state.index = Math.min(available, state.index + advance);
          setIndex(state.index);
        } else if (!state.streaming) {
          setIsPlaying(false);
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, failed]);
  const reset = useCallback(() => {
    setIsPlaying(false);
    setIndex(0);
  }, []);
  const start = useCallback(() => {
    setIndex(0);
    setIsPlaying(true);
  }, []);
  const play = useCallback(() => {
    if (failed) return;
    if (steps.length > 1 && currentStepIndex === steps.length - 1 && !streaming)
      setIndex(0);
    setIsPlaying(true);
  }, [steps.length, currentStepIndex, streaming, failed]);
  const pause = useCallback(() => setIsPlaying(false), []);
  const nextStep = useCallback(
    () => setIndex((i) => Math.min(i + 1, Math.max(0, steps.length - 1))),
    [steps.length],
  );
  const prevStep = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  return {
    currentStep: steps[currentStepIndex],
    currentStepIndex,
    isPlaying: isPlaying && !failed,
    speed,
    play,
    start,
    pause,
    nextStep,
    prevStep,
    reset,
    setSpeed: (value: number) => {
      if (Number.isFinite(value)) setSpeed(Math.max(10, Math.min(500, value)));
    },
    estimatedRemainingTime: Math.max(
      0,
      (steps.length - currentStepIndex - 1) * speed,
    ),
  };
}
