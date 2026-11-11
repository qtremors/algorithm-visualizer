import type { RunStatus } from '../types';

export type RunPhase =
  | 'idle'
  | 'receiving'
  | 'playing'
  | 'paused'
  | 'complete'
  | 'failed';
export interface RunProgress {
  status: RunStatus;
  length: number;
  index: number;
  playing: boolean;
}

/** Receiving completion and finishing playback are separate user-visible states. */
export function runPhase({
  status,
  length,
  index,
  playing,
}: RunProgress): RunPhase {
  if (status === 'failed') return 'failed';
  if (status === 'idle') return 'idle';
  if (!length) return status === 'running' ? 'receiving' : 'complete';
  if (status === 'completed' && index >= length - 1) return 'complete';
  if (playing) return 'playing';
  return 'paused';
}

export const phaseLabels: Record<RunPhase, string> = {
  idle: 'Ready',
  receiving: 'Receiving steps',
  playing: 'Playing',
  paused: 'Paused',
  complete: 'Complete',
  failed: 'Failed',
};

export const phaseDescriptions: Record<RunPhase, string> = {
  idle: 'Edit the input, then start a visualization.',
  receiving:
    'Connected to the server. Waiting for the first visualization step.',
  playing: 'The timeline is advancing. Pause to inspect a step.',
  paused: 'The timeline is paused. Resume or step through the received result.',
  complete: 'The algorithm and playback have reached the final step.',
  failed: 'The run could not complete. Review the error and retry.',
};

export function playbackRate(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return '—';
  const rate = 1000 / milliseconds;
  return `${Number.isInteger(rate) ? rate : rate.toFixed(1)} steps/s`;
}
