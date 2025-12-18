import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ArrayInput from './ArrayInput';
import GridInput from './GridInput';
import { createGrid } from '../../lib/input';
import SortingVisualizer from '../visualizers/SortingVisualizer';

describe('input regressions', () => {
  it('invalidates parent input when cleared or malformed', () => {
    const submit = vi.fn();
    render(
      <ArrayInput currentData={[7, 3, 5]} onSubmit={submit} disabled={false} />,
    );
    fireEvent.change(screen.getByLabelText('Custom Input'), {
      target: { value: '' },
    });
    expect(submit).toHaveBeenLastCalledWith(null);
    fireEvent.change(screen.getByLabelText('Custom Input'), {
      target: { value: '1.9,2oops' },
    });
    expect(submit).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
  it('disables every sorting generator control during a run', () => {
    render(<ArrayInput currentData={[1]} onSubmit={vi.fn()} disabled />);
    expect(screen.getByRole('button', { name: 'Generate New' })).toBeDisabled();
    expect(screen.getByLabelText('Size')).toBeDisabled();
    expect(screen.getByLabelText('Minimum value')).toBeDisabled();
  });
  it('rejects zero/fractional grid size and one-cell randomization without allocating or looping', () => {
    const submit = vi.fn();
    render(
      <GridInput
        currentData={createGrid(1, 1)}
        onSubmit={submit}
        mode="wall"
        setMode={vi.fn()}
        disabled={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Randomize Walls' }));
    expect(screen.getByRole('alert')).toHaveTextContent('at least two');
    fireEvent.change(screen.getByLabelText('Rows'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Clear Grid' }));
    expect(submit).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Rows'), {
      target: { value: '1.5' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Clear Grid' }));
    expect(submit).not.toHaveBeenCalled();
  });
  it('bounds coordinates against the actual grid rather than unapplied dimensions', () => {
    const submit = vi.fn();
    render(
      <GridInput
        currentData={createGrid(2, 2)}
        onSubmit={submit}
        mode="wall"
        setMode={vi.fn()}
        disabled={false}
      />,
    );
    fireEvent.change(screen.getByLabelText('Rows'), {
      target: { value: '30' },
    });
    fireEvent.change(screen.getByLabelText('start row'), {
      target: { value: '25' },
    });
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('current grid');
  });
  it('renders finite nonnegative heights for signed and zero values', () => {
    const { container, rerender } = render(
      <SortingVisualizer initialData={[5, 2, 0]} step={null} />,
    );
    rerender(<SortingVisualizer initialData={[-5, -2, 0]} step={null} />);
    const bars = [...container.querySelectorAll<HTMLElement>('[data-value]')];
    expect(bars.map((bar) => bar.style.height)).toEqual(['100%', '40%', '0%']);
    expect(bars.every((bar) => Number.parseFloat(bar.style.bottom) >= 0)).toBe(
      true,
    );
    rerender(<SortingVisualizer initialData={[0, 0]} step={null} />);
    expect(container.innerHTML).not.toContain('NaN');
  });
});
