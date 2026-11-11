import { useState, useEffect, useCallback, useRef } from 'react';
import type { AlgorithmStep } from '../types';

export type PlaybackOperation =
  | 'any'
  | 'compare'
  | 'swap'
  | 'visit_node'
  | 'relax_edge';

/** One playhead follows the received buffer; appending frames never rewinds it. */
export function usePlayback(
  steps: AlgorithmStep[],
  streaming = false,
  failed = false,
) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(200);
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [operation, setOperation] = useState<PlaybackOperation>('any');
  const currentStepIndex = Math.min(index, Math.max(0, steps.length - 1));
  const clock = useRef({
    speed,
    steps,
    streaming,
    index: currentStepIndex,
    breakpoints,
  });
  useEffect(() => {
    clock.current = {
      speed,
      steps,
      streaming,
      index: currentStepIndex,
      breakpoints,
    };
  }, [speed, steps, streaming, currentStepIndex, breakpoints]);
  useEffect(() => {
    if (!isPlaying || failed) return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const state = clock.current;
      const available = state.steps.length - 1;
      if (now - last >= state.speed) {
        const advance = Math.floor((now - last) / state.speed);
        last = now - ((now - last) % state.speed);
        if (state.index < available) {
          let target = Math.min(available, state.index + advance);
          let hit = false;
          for (let next = state.index + 1; next <= target; next++) {
            if (
              state.steps[next].line !== state.steps[next - 1].line &&
              state.breakpoints.includes(state.steps[next].line)
            ) {
              target = next;
              hit = true;
              break;
            }
          }
          state.index = target;
          setIndex(target);
          if (hit) {
            setIsPlaying(false);
            return;
          }
        } else if (!state.streaming) {
          setIsPlaying(false);
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, failed]);
  const reset = useCallback(() => {
    setIsPlaying(false);
    setIndex(0);
  }, []);
  const start = useCallback(() => {
    setIndex(0);
    setIsPlaying(
      !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    );
  }, []);
  const play = useCallback(() => {
    if (failed) return;
    if (steps.length > 1 && currentStepIndex === steps.length - 1 && !streaming)
      setIndex(0);
    setIsPlaying(true);
  }, [steps.length, currentStepIndex, streaming, failed]);
  const pause = useCallback(() => setIsPlaying(false), []);
  const seek = useCallback(
    (target: number) => {
      if (!Number.isFinite(target)) return;
      setIsPlaying(false);
      setIndex(Math.max(0, Math.min(Math.trunc(target), steps.length - 1)));
    },
    [steps.length],
  );
  const nextStep = useCallback(() => {
    setIndex((previous) => {
      const from = Math.min(previous, Math.max(0, steps.length - 1));
      if (operation === 'any')
        return Math.min(from + 1, Math.max(0, steps.length - 1));
      for (let next = from + 1; next < steps.length; next++)
        if (steps[next].type === operation) return next;
      return Math.max(0, steps.length - 1);
    });
  }, [steps, operation]);
  const prevStep = useCallback(() => {
    setIndex((previous) => {
      const from = Math.min(previous, Math.max(0, steps.length - 1));
      if (operation === 'any') return Math.max(0, from - 1);
      for (let next = from - 1; next >= 0; next--)
        if (steps[next].type === operation) return next;
      return 0;
    });
  }, [steps, operation]);
  const toggleBreakpoint = (line: number) => {
    if (!Number.isInteger(line) || line < 1) return;
    setBreakpoints((previous) =>
      previous.includes(line)
        ? previous.filter((value) => value !== line)
        : [...previous, line],
    );
  };
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
    seek,
    breakpoints,
    toggleBreakpoint,
    operation,
    setOperation,
    first: () => seek(0),
    last: () => seek(steps.length - 1),
    clearBreakpoints: () => setBreakpoints([]),
    setSpeed: (value: number) => {
      if (Number.isFinite(value)) setSpeed(Math.max(10, Math.min(500, value)));
    },
    estimatedRemainingTime: Math.max(
      0,
      (steps.length - currentStepIndex - 1) * speed,
    ),
  };
}
