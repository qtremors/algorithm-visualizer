import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useComparison } from './useComparison';
import type { AlgorithmStep, RunStatus } from '../types';
const lanes = vi.hoisted(() => {
  const lane = () => ({
    steps: [] as AlgorithmStep[],
    status: 'idle' as RunStatus,
    isRunning: false,
    error: null,
    runAlgorithm: vi.fn(),
    resetSteps: vi.fn(),
  });
  return { left: lane(), right: lane() };
});
vi.mock('./useAlgorithmRunner', () => ({
  useAlgorithmRunner: (_: string, name: string) =>
    name === 'left' ? lanes.left : lanes.right,
}));
const frame = (value: number): AlgorithmStep => ({
  type: 'info',
  payload: {},
  snapshot: [value],
  line: 1,
  message: String(value),
});
beforeEach(() => {
  for (const lane of Object.values(lanes)) {
    lane.steps = [];
    lane.status = 'idle';
    lane.isRunning = false;
    lane.runAlgorithm.mockClear();
    lane.resetSteps.mockClear();
  }
});
describe('comparison synchronization', () => {
  it('starts isolated copies of identical input in both lanes', () => {
    const { result } = renderHook(() =>
      useComparison('sorting', 'left', 'right'),
    );
    const input = [3, 1, 2];
    act(() => result.current.run(input));
    const a = lanes.left.runAlgorithm.mock.calls[0][0];
    const b = lanes.right.runAlgorithm.mock.calls[0][0];
    expect(a).toEqual(input);
    expect(b).toEqual(input);
    expect(a).not.toBe(input);
    expect(a).not.toBe(b);
  });
  it('keeps a shorter lane at its terminal frame while advancing the longer lane', () => {
    lanes.left.status = lanes.right.status = 'completed';
    lanes.left.steps = [frame(1), frame(2)];
    lanes.right.steps = [frame(1), frame(2), frame(3), frame(4)];
    const { result } = renderHook(() =>
      useComparison('sorting', 'left', 'right'),
    );
    act(() => result.current.playback.seek(3));
    expect(result.current.leftIndex).toBe(1);
    expect(result.current.rightIndex).toBe(3);
    expect(result.current.count).toBe(4);
    act(() => result.current.playback.seek(0));
    expect(result.current.leftIndex).toBe(0);
    expect(result.current.rightIndex).toBe(0);
  });
  it('waits for streaming lanes and fails the shared clock when either lane fails', () => {
    lanes.left.steps = [frame(1)];
    lanes.left.isRunning = true;
    const { result, rerender } = renderHook(() =>
      useComparison('sorting', 'left', 'right'),
    );
    expect(result.current.streaming).toBe(true);
    lanes.left.isRunning = false;
    lanes.right.status = 'failed';
    rerender();
    expect(result.current.failed).toBe(true);
    expect(result.current.playback.isPlaying).toBe(false);
    act(() => result.current.reset());
    expect(lanes.left.resetSteps).toHaveBeenCalled();
    expect(lanes.right.resetSteps).toHaveBeenCalled();
  });
});

it('holds the shared playhead behind a slower unfinished stream', () => {
  lanes.left.steps = [frame(1), frame(2), frame(3), frame(4)];
  lanes.right.steps = [frame(1)];
  lanes.left.status = lanes.right.status = 'running';
  lanes.left.isRunning = lanes.right.isRunning = true;
  const { result, rerender } = renderHook(() =>
    useComparison('sorting', 'left', 'right'),
  );
  expect(result.current.count).toBe(1);
  lanes.left.status = 'completed';
  lanes.left.isRunning = false;
  rerender();
  expect(result.current.count).toBe(1);
  lanes.right.steps = [frame(1), frame(2)];
  rerender();
  expect(result.current.count).toBe(2);
  lanes.right.status = 'completed';
  lanes.right.isRunning = false;
  rerender();
  expect(result.current.count).toBe(4);
});

it('steps to operations in either lane and does not repeat a held terminal frame', () => {
  lanes.left.status = lanes.right.status = 'completed';
  lanes.left.steps = [frame(0), { ...frame(1), type: 'swap' }];
  lanes.right.steps = [
    frame(0),
    frame(1),
    frame(2),
    { ...frame(3), type: 'swap' },
    frame(4),
  ];
  const { result } = renderHook(() =>
    useComparison('sorting', 'left', 'right'),
  );
  act(() => result.current.playback.setOperation('swap'));
  act(() => result.current.playback.nextStep());
  expect(result.current.playback.currentStepIndex).toBe(1);
  act(() => result.current.playback.nextStep());
  expect(result.current.playback.currentStepIndex).toBe(3);
  act(() => result.current.playback.prevStep());
  expect(result.current.playback.currentStepIndex).toBe(1);
  act(() => result.current.playback.nextStep());
  act(() => result.current.playback.nextStep());
  expect(result.current.playback.currentStepIndex).toBe(4);
});
