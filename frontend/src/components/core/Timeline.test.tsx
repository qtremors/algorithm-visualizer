import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Timeline from './Timeline';
import RangeControl from './RangeControl';

describe('timeline controls', () => {
  it('lets a user jump to an exact one-based step', () => {
    const seek = vi.fn();
    render(
      <Timeline
        index={0}
        length={12}
        streaming={false}
        disabled={false}
        onSeek={seek}
        operation="any"
        onOperationChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Go to step'), {
      target: { value: '7' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Go' }));
    expect(seek).toHaveBeenCalledWith(6);
    expect(screen.getByLabelText('Go to step')).toHaveValue(null);
  });
  it('does not jump outside the received buffer', () => {
    const seek = vi.fn();
    render(
      <Timeline
        index={0}
        length={3}
        streaming
        disabled={false}
        onSeek={seek}
        operation="any"
        onOperationChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Go to step'), {
      target: { value: '4' },
    });
    expect(screen.getByRole('button', { name: 'Go' })).toBeDisabled();
    fireEvent.submit(screen.getByLabelText('Go to step').closest('form')!);
    expect(seek).not.toHaveBeenCalled();
    expect(screen.getByRole('slider')).toHaveAttribute(
      'aria-valuetext',
      '1 of 3 steps received so far',
    );
  });
  it('exposes readable range values and a reason for disabled zoom', () => {
    render(
      <RangeControl
        label="Zoom"
        value={1}
        min={0.5}
        max={2}
        displayValue="1.0×"
        valueText="100 percent"
        disabled
        disabledReason="Turn off Fit to screen to change zoom."
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('slider', { name: 'Zoom' })).toHaveAttribute(
      'aria-valuetext',
      '100 percent',
    );
    expect(screen.getByRole('slider')).toHaveAccessibleDescription(
      'Turn off Fit to screen to change zoom.',
    );
    expect(screen.getByText('1.0×')).toBeInTheDocument();
  });
});
