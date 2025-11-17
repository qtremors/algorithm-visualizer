import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAlgorithmRunner } from './useAlgorithmRunner';
import { LIMITS } from '../lib/input';

class FakeSocket {
  static CLOSING = 2;
  static sockets: FakeSocket[] = [];
  readyState = 1;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = 3;
  });
  constructor() {
    FakeSocket.sockets.push(this);
  }
  message(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}
const step = {
  type: 'compare',
  snapshot: [2, 1],
  payload: { indices: [0, 1] },
  message: 'Comparing',
  line: 1,
};
function setup() {
  const hook = renderHook(() => useAlgorithmRunner('sorting', 'bubble_sort'));
  act(() => hook.result.current.runAlgorithm([2, 1]));
  return { ...hook, socket: FakeSocket.sockets.at(-1)! };
}
describe('visualization lifecycle', () => {
  beforeEach(() => {
    FakeSocket.sockets = [];
    vi.stubGlobal('WebSocket', FakeSocket);
  });
  afterEach(() => vi.unstubAllGlobals());
  it('publishes steps while the connection is open and requires explicit completion', () => {
    const { result, socket } = setup();
    act(() => {
      socket.onopen?.();
      socket.message(step);
    });
    expect(socket.send).toHaveBeenCalledWith('[2,1]');
    expect(result.current.steps).toHaveLength(1);
    expect(result.current.status).toBe('running');
    act(() => {
      socket.message({ type: 'complete', steps: 1 });
      socket.onclose?.({ code: 1000, reason: '' });
    });
    expect(result.current.status).toBe('completed');
  });
  it('reports abnormal closure after partial output', () => {
    const { result, socket } = setup();
    act(() => {
      socket.message(step);
      socket.onclose?.({ code: 1011, reason: 'Server failed' });
    });
    expect(result.current.steps).toHaveLength(1);
    expect(result.current.status).toBe('failed');
    expect(result.current.error).toContain('Server failed');
  });
  it('rejects an apparently normal close without terminal success', () => {
    const { result, socket } = setup();
    act(() => socket.onclose?.({ code: 1000, reason: '' }));
    expect(result.current.status).toBe('failed');
  });
  it('preserves explicit errors and rejects missing steps or malformed messages', () => {
    const { result, socket } = setup();
    act(() =>
      socket.message({
        type: 'error',
        code: 'invalid_input',
        message: 'Choose an end node.',
      }),
    );
    expect(result.current.error).toBe('Choose an end node.');
    act(() => result.current.runAlgorithm([2, 1]));
    act(() =>
      FakeSocket.sockets.at(-1)!.message({ type: 'complete', steps: 9 }),
    );
    expect(result.current.status).toBe('failed');
    act(() => result.current.runAlgorithm([2, 1]));
    act(() => FakeSocket.sockets.at(-1)!.onmessage?.({ data: '{invalid' }));
    expect(result.current.status).toBe('failed');
  });
  it('cancels, clears state, and ignores queued callbacks from an old socket', () => {
    const { result, socket } = setup();
    const delayed = socket.onmessage;
    act(() => result.current.resetSteps());
    expect(socket.close).toHaveBeenCalledOnce();
    act(() => delayed?.({ data: JSON.stringify(step) }));
    expect(result.current.steps).toEqual([]);
    expect(result.current.status).toBe('idle');
  });
  it('disconnects when the algorithm changes or the hook unmounts', () => {
    const { result, rerender, unmount } = renderHook(
      ({ name }) => useAlgorithmRunner('sorting', name),
      { initialProps: { name: 'bubble_sort' } },
    );
    act(() => result.current.runAlgorithm([2, 1]));
    const old = FakeSocket.sockets.at(-1)!;
    rerender({ name: 'insertion_sort' });
    expect(old.close).toHaveBeenCalledOnce();
    expect(result.current.isRunning).toBe(false);
    act(() => result.current.runAlgorithm([2, 1]));
    const active = FakeSocket.sockets.at(-1)!;
    unmount();
    expect(active.close).toHaveBeenCalledOnce();
  });
  it('handles constructor failures without getting stuck running', () => {
    vi.stubGlobal(
      'WebSocket',
      class {
        constructor() {
          throw new Error('blocked');
        }
      },
    );
    const { result } = renderHook(() =>
      useAlgorithmRunner('sorting', 'bubble_sort'),
    );
    act(() => result.current.runAlgorithm([2, 1]));
    expect(result.current.isRunning).toBe(false);
    expect(result.current.status).toBe('failed');
  });
  it('reports a send failure immediately and closes the connection', () => {
    const { result, socket } = setup();
    socket.send.mockImplementation(() => { throw new Error('send failed'); });
    act(() => socket.onopen?.());
    expect(result.current.status).toBe('failed');
    expect(result.current.error).toContain('send');
    expect(socket.close).toHaveBeenCalledOnce();
  });
  it.each([0, -1])('applies the byte budget to trace frames with boundary offset %s', (offset) => {
    const original = LIMITS.bytes;
    LIMITS.bytes = new TextEncoder().encode(JSON.stringify(step)).length + offset;
    try {
      const { result, socket } = setup();
      act(() => {
        socket.message(step);
        socket.message({ type: 'complete', steps: 1 });
        socket.onclose?.({ code: 1000, reason: '' });
      });
      expect(result.current.status).toBe(offset === 0 ? 'completed' : 'failed');
    } finally {
      LIMITS.bytes = original;
    }
  });
});
