import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GridVisualizer from './GridVisualizer';
import { createGrid } from '../../lib/input';

describe('grid keyboard boundaries', () => {
  function setup() {
    render(
      <GridVisualizer
        step={null}
        initialData={createGrid(2, 3)}
        mode="wall"
        onUpdate={vi.fn()}
        isInteracting
        zoom={1}
        isFitToScreen={false}
      />,
    );
    return screen.getAllByRole('button');
  }
  it('does not wrap horizontally from the last column into another row', () => {
    const cells = setup();
    cells[2].focus();
    fireEvent.keyDown(cells[2], { key: 'ArrowRight' });
    expect(cells[2]).toHaveFocus();
  });
  it('retains the column when moving down at the bottom boundary', () => {
    const cells = setup();
    cells[3].focus();
    fireEvent.keyDown(cells[3], { key: 'ArrowDown' });
    expect(cells[3]).toHaveFocus();
  });
  it('moves to the matching column in the next row', () => {
    const cells = setup();
    cells[1].focus();
    fireEvent.keyDown(cells[1], { key: 'ArrowDown' });
    expect(cells[4]).toHaveFocus();
  });
});
