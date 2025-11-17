import { useCallback, useEffect, useRef, useState } from 'react';
import type { AlgorithmStep, RunStatus } from '../types';
import type { InputData } from '../types/input';
import { apiUrl } from '../lib/api';
import { LIMITS } from '../lib/input';
import { parseMessage } from '../lib/protocol';

type Run = {
  key: string;
  id: number;
  steps: AlgorithmStep[];
  status: RunStatus;
  error: string | null;
};
export function useAlgorithmRunner(category?: string, algorithmName?: string) {
  const key = `${category}/${algorithmName}`;
  const sequence = useRef(0);
  const connection = useRef<(() => void) | null>(null);
  const [state, setState] = useState<Run>({
    key,
    id: 0,
    steps: [],
    status: 'idle',
    error: null,
  });
  const disconnect = useCallback(() => {
    connection.current?.();
    connection.current = null;
  }, []);
  useEffect(() => disconnect, [category, algorithmName, disconnect]);
  const resetSteps = useCallback(() => {
    disconnect();
    setState({
      key,
      id: ++sequence.current,
      steps: [],
      status: 'idle',
      error: null,
    });
  }, [disconnect, key]);
  const runAlgorithm = useCallback(
    (data: InputData) => {
      disconnect();
      const id = ++sequence.current;
      const steps: AlgorithmStep[] = [];
      setState({ key, id, steps: [], status: 'running', error: null });
      if (!category || !algorithmName) {
        setState({
          key,
          id,
          steps,
          status: 'failed',
          error: 'Choose an algorithm.',
        });
        return;
      }
      let socket: WebSocket;
      try {
        socket = new WebSocket(
          apiUrl(
            `/ws/visualize/${encodeURIComponent(category)}/${encodeURIComponent(algorithmName)}`,
            true,
          ),
        );
      } catch {
        setState({
          key,
          id,
          steps,
          status: 'failed',
          error: 'Cannot connect to the visualization server.',
        });
        return;
      }
      let active = true;
      let completed = false;
      let bytes = 0;
      let batch: ReturnType<typeof setTimeout> | undefined;
      const deadline = setTimeout(
        () => fail('Connection timed out. Please retry.'),
        30_000,
      );
      const publish = () => {
        clearTimeout(batch);
        batch = undefined;
        if (active)
          setState((previous) =>
            previous.id === id
              ? { ...previous, steps: steps.slice() }
              : previous,
          );
      };
      const cleanup = () => {
        active = false;
        clearTimeout(batch);
        clearTimeout(deadline);
        socket.onopen =
          socket.onmessage =
          socket.onclose =
          socket.onerror =
            null;
        if (socket.readyState < WebSocket.CLOSING) socket.close();
      };
      const fail = (error: string) => {
        if (!active) return;
        setState({ key, id, steps: steps.slice(), status: 'failed', error });
        cleanup();
        connection.current = null;
      };
      connection.current = cleanup;
      socket.onopen = () => {
        if (!active) return;
        try {
          socket.send(JSON.stringify(data));
        } catch {
          fail('Cannot send input to the visualization server. Please retry.');
        }
      };
      socket.onmessage = (event) => {
        if (!active) return;
        try {
          if (typeof event.data !== 'string')
            throw new Error('Invalid server message.');
          const messageBytes = new TextEncoder().encode(event.data).length;
          if (messageBytes > LIMITS.bytes)
            throw new Error(
              'This visualization is too large. Use a smaller input.',
            );
          const message = parseMessage(event.data);
          if (message.type === 'error') {
            fail(message.message);
            return;
          }
          if (message.type === 'complete') {
            if (completed || message.steps !== steps.length)
              throw new Error('The visualization ended with missing steps.');
            completed = true;
            publish();
            return;
          }
          if (completed) throw new Error('Unexpected step after completion.');
          // The server budgets trace frames; terminal control messages are separate.
          bytes += messageBytes;
          if (bytes > LIMITS.bytes)
            throw new Error(
              'This visualization is too large. Use a smaller input.',
            );
          if (
            Array.isArray(data) !== Array.isArray(message.snapshot) ||
            (!Array.isArray(data) &&
              !Array.isArray(message.snapshot) &&
              data.kind !== message.snapshot.type)
          )
            throw new Error('The visualization does not match the input.');
          if (steps.length >= LIMITS.steps)
            throw new Error(
              'This visualization is too large. Use a smaller input.',
            );
          steps.push(message);
          if (steps.length === 1 || steps.length % 128 === 0) publish();
          else batch ??= setTimeout(publish, 32);
        } catch (error) {
          fail(
            error instanceof Error ? error.message : 'Invalid server message.',
          );
        }
      };
      socket.onerror = () =>
        fail('Connection to the visualization server failed. Please retry.');
      socket.onclose = (event) => {
        if (!active) return;
        if (event.code !== 1000 || !completed) {
          fail(
            event.reason ||
              'Visualization interrupted before completion. Please retry.',
          );
          return;
        }
        setState({
          key,
          id,
          steps: steps.slice(),
          status: 'completed',
          error: null,
        });
        cleanup();
        connection.current = null;
      };
    },
    [category, algorithmName, key, disconnect],
  );
  const visible =
    state.key === key
      ? state
      : { ...state, steps: [], status: 'idle' as const, error: null };
  return {
    steps: visible.steps,
    isRunning: visible.status === 'running',
    status: visible.status,
    error: visible.error,
    runId: visible.id,
    runAlgorithm,
    resetSteps,
  };
}
