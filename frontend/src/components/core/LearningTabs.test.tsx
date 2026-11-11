import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LearningTabs from './LearningTabs';

describe('learning panels', () => {
  it('keeps one active panel and supports arrow-key tab navigation', () => {
    render(
      <LearningTabs
        code={['procedure Sort(A)', 'return A']}
        steps={[]}
        index={0}
        algorithm="sorting"
        messages={['Ready.']}
      />,
    );
    const code = screen.getByRole('tab', { name: 'Pseudocode' });
    expect(code).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(code, { key: 'ArrowRight' });
    const state = screen.getByRole('tab', { name: 'State' });
    expect(state).toHaveAttribute('aria-selected', 'true');
    expect(state).toHaveFocus();
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    expect(
      screen.getByRole('heading', { name: 'Why this step?' }),
    ).toBeInTheDocument();
    fireEvent.keyDown(state, { key: 'ArrowLeft' });
    expect(code).toHaveAttribute('aria-selected', 'true');
    expect(code).toHaveFocus();
  });
});
