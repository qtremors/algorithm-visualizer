import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { usePlayback } from './usePlayback';
import type { AlgorithmStep } from '../types';
const steps: AlgorithmStep[] = Array.from({ length: 5 }, (_, i) => ({
  type: 'info',
  snapshot: [],
  payload: {},
  message: String(i),
  line: 1,
}));
let callback: FrameRequestCallback;
beforeEach(() => {
  vi.spyOn(performance, 'now').mockReturnValue(0);
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((fn: FrameRequestCallback) => {
      callback = fn;
      return 1;
    }),
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('waits for stream batches without resetting the playhead and honors live speed changes', () => {
  const { result, rerender } = renderHook(
    ({ data, streaming }) => usePlayback(data, streaming),
    { initialProps: { data: steps.slice(0, 2), streaming: true } },
  );
  act(() => result.current.play());
  act(() => callback(200));
  expect(result.current.currentStepIndex).toBe(1);
  act(() => callback(400));
  expect(result.current.isPlaying).toBe(true);
  rerender({ data: steps, streaming: true });
  expect(result.current.currentStepIndex).toBe(1);
  act(() => result.current.setSpeed(10));
  act(() => callback(420));
  expect(result.current.currentStepIndex).toBe(3);
  rerender({ data: steps, streaming: false });
  act(() => callback(440));
  act(() => callback(460));
  expect(result.current.currentStepIndex).toBe(4);
  expect(result.current.isPlaying).toBe(false);
});
it('stops the animation on failure and cancels on unmount', () => {
  const { result, rerender, unmount } = renderHook(
    ({ failed }) => usePlayback(steps, false, failed),
    { initialProps: { failed: false } },
  );
  act(() => result.current.play());
  rerender({ failed: true });
  expect(result.current.isPlaying).toBe(false);
  expect(cancelAnimationFrame).toHaveBeenCalled();
  unmount();
});
