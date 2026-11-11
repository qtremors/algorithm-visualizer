import { useState, useEffect, useCallback, useRef } from 'react';
import type { AlgorithmStep } from '../types';

export type PlaybackOperation =
  | 'any'
  | 'compare'
  | 'swap'
  | 'write'
  | 'visit_node'
  | 'relax_edge';

/** One playhead follows the received buffer; appending frames never rewinds it. */
export function usePlayback(
  steps: AlgorithmStep[],
  streaming = false,
  failed = false,
  matchesOperation?: (index: number, operation: PlaybackOperation) => boolean,
) {
  const [index, setIndex] = useState(0);
  // React may commit a render after another animation callback has run. Keep
  // the clock's cursor outside render synchronization so a late commit cannot rewind it.
  const position = useRef(0);
  const move = useCallback((target: number) => {
    position.current = target;
    setIndex(target);
  }, []);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(200);
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [operation, setOperation] = useState<PlaybackOperation>('any');
  const currentStepIndex = Math.min(index, Math.max(0, steps.length - 1));
  const clock = useRef({
    speed,
    steps,
    streaming,
    breakpoints,
  });
  useEffect(() => {
    clock.current = {
      speed,
      steps,
      streaming,
      breakpoints,
    };
  }, [speed, steps, streaming, breakpoints]);
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
        const from = Math.min(position.current, Math.max(0, available));
        if (from < available) {
          let target = Math.min(available, from + advance);
          let hit = false;
          for (let next = from + 1; next <= target; next++) {
            if (
              state.steps[next].line !== state.steps[next - 1].line &&
              state.breakpoints.includes(state.steps[next].line)
            ) {
              target = next;
              hit = true;
              break;
            }
          }
          move(target);
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
  }, [isPlaying, failed, move]);
  useEffect(() => {
    const pauseWhenHidden = () => {
      if (document.hidden) setIsPlaying(false);
    };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () =>
      document.removeEventListener('visibilitychange', pauseWhenHidden);
  }, []);
  const reset = useCallback(() => {
    setIsPlaying(false);
    move(0);
  }, [move]);
  const start = useCallback(() => {
    move(0);
    setIsPlaying(
      !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    );
  }, [move]);
  const play = useCallback(() => {
    if (failed) return;
    if (steps.length > 1 && position.current >= steps.length - 1 && !streaming)
      move(0);
    setIsPlaying(true);
  }, [steps.length, streaming, failed, move]);
  const pause = useCallback(() => setIsPlaying(false), []);
  const seek = useCallback(
    (target: number) => {
      if (!Number.isFinite(target)) return;
      setIsPlaying(false);
      move(Math.max(0, Math.min(Math.trunc(target), steps.length - 1)));
    },
    [steps.length, move],
  );
  const nextStep = useCallback(() => {
    const last = Math.max(0, steps.length - 1);
    const from = Math.min(position.current, last);
    if (operation === 'any') {
      move(Math.min(from + 1, last));
      return;
    }
    for (let next = from + 1; next < steps.length; next++) {
      if (
        matchesOperation
          ? matchesOperation(next, operation)
          : steps[next].type === operation
      ) {
        move(next);
        return;
      }
    }
    move(last);
  }, [steps, operation, matchesOperation, move]);
  const prevStep = useCallback(() => {
    const from = Math.min(position.current, Math.max(0, steps.length - 1));
    if (operation === 'any') {
      move(Math.max(0, from - 1));
      return;
    }
    for (let next = from - 1; next >= 0; next--) {
      if (
        matchesOperation
          ? matchesOperation(next, operation)
          : steps[next].type === operation
      ) {
        move(next);
        return;
      }
    }
    move(0);
  }, [steps, operation, matchesOperation, move]);
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
