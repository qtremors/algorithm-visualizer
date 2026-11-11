import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePlayback } from './usePlayback';
import type { AlgorithmStep } from '../types';
const steps: AlgorithmStep[] = [
  'info',
  'compare',
  'swap',
  'info',
  'compare',
  'sorted',
].map((type, index) => ({
  type: type as AlgorithmStep['type'],
  snapshot: [],
  payload: {},
  message: String(index),
  line: index + 1,
}));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
describe('timeline and breakpoints', () => {
  it('bounds seeking and pauses playback', () => {
    const { result } = renderHook(() => usePlayback(steps));
    act(() => result.current.play());
    act(() => result.current.seek(999));
    expect(result.current.currentStepIndex).toBe(5);
    expect(result.current.isPlaying).toBe(false);
    act(() => result.current.seek(-10));
    expect(result.current.currentStepIndex).toBe(0);
    act(() => result.current.seek(NaN));
    expect(result.current.currentStepIndex).toBe(0);
  });
  it('steps to matching operations in both directions', () => {
    const { result } = renderHook(() => usePlayback(steps));
    act(() => result.current.setOperation('compare'));
    act(() => result.current.nextStep());
    expect(result.current.currentStepIndex).toBe(1);
    act(() => result.current.nextStep());
    expect(result.current.currentStepIndex).toBe(4);
    act(() => result.current.prevStep());
    expect(result.current.currentStepIndex).toBe(1);
  });
  it('stops at the first crossed breakpoint even when an animation frame is late', () => {
    let tick: FrameRequestCallback = () => {};
    vi.spyOn(performance, 'now').mockReturnValue(0);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        tick = callback;
        return 1;
      }),
    );
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const { result } = renderHook(() => usePlayback(steps));
    act(() => result.current.toggleBreakpoint(3));
    act(() => result.current.play());
    act(() => tick(2000));
    expect(result.current.currentStepIndex).toBe(2);
    expect(result.current.isPlaying).toBe(false);
    act(() => result.current.toggleBreakpoint(3));
    expect(result.current.breakpoints).toEqual([]);
  });
});

it('pauses at the current frame when the tab becomes hidden without resuming on return', () => {
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  const { result, unmount } = renderHook(() => usePlayback(steps));
  act(() => result.current.seek(2));
  act(() => result.current.play());
  hidden.mockReturnValue(true);
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(result.current.isPlaying).toBe(false);
  expect(result.current.currentStepIndex).toBe(2);
  hidden.mockReturnValue(false);
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(result.current.isPlaying).toBe(false);
  act(() => result.current.play());
  expect(result.current.isPlaying).toBe(true);
  unmount();
});
