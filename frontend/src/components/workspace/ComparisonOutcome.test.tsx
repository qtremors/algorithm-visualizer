import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AlgorithmStep } from '../../types';
import ComparisonOutcome from './ComparisonOutcome';

const step = (type: AlgorithmStep['type']): AlgorithmStep => ({
  type,
  payload: {},
  snapshot: [],
  message: '',
  line: 0,
});
const left = {
  name: 'Left algorithm',
  steps: [step('sorted')],
  metrics: { comparisons: 8, swaps: 0, writes: 4 },
};
const right = {
  name: 'Right algorithm',
  steps: [step('sorted')],
  metrics: { comparisons: 12, swaps: 3, writes: 0 },
};

describe('final comparison results', () => {
  it('waits for both runs and their final metrics', () => {
    const { rerender } = render(
      <ComparisonOutcome
        left={left}
        right={right}
        category="sorting"
        complete={false}
      />,
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    rerender(
      <ComparisonOutcome
        left={left}
        right={{ ...right, metrics: undefined }}
        category="sorting"
        complete
      />,
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
  it('shows algorithm labels and final operation counts, including zero', () => {
    render(
      <ComparisonOutcome
        left={left}
        right={right}
        category="sorting"
        complete
      />,
    );
    expect(
      screen.getByRole('columnheader', { name: 'Left algorithm' }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('row', { name: 'Swaps 0 3' }))
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['0', '3']);
    expect(
      screen.getByText(/Counts are independent of playback speed/),
    ).toBeInTheDocument();
  });
  it('distinguishes an unreachable destination from a valid zero-hop path', () => {
    render(
      <ComparisonOutcome
        left={{ ...left, steps: [], metrics: { path_hops: 0 } }}
        right={{
          ...right,
          steps: [step('found_path')],
          metrics: { path_hops: 0, path_cost: 0 },
        }}
        category="pathfinding"
        complete
      />,
    );
    expect(
      screen.getByRole('row', { name: 'Outcome No path found Path found' }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('row', { name: 'Path hops — 0' }))
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['—', '0']);
  });
  it('avoids presenting path measurements for a negative-cycle result', () => {
    render(
      <ComparisonOutcome
        left={{
          ...left,
          steps: [step('negative_cycle')],
          metrics: { path_hops: 0, path_cost: -5 },
        }}
        right={{
          ...right,
          steps: [step('found_path')],
          metrics: { path_hops: 2, path_cost: 7 },
        }}
        category="pathfinding"
        complete
      />,
    );
    expect(
      screen.getByText(/There is no finite shortest-path result/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('row', { name: 'Path cost — 7' }),
    ).toBeInTheDocument();
  });
});
