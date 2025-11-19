import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import LogList from './LogList';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('fills tall viewports through the final message while keeping the DOM bounded', () => {
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(1600);
  vi.stubGlobal('ResizeObserver', class {
    callback: () => void;
    constructor(callback: () => void) { this.callback = callback; }
    observe() { this.callback(); }
    disconnect() {}
  });
  render(<LogList messages={Array.from({ length: 1000 }, (_, i) => `Message ${i + 1}`)} />);
  fireEvent.scroll(screen.getByRole('list'), { target: { scrollTop: 32000 - 1600 } });
  expect(screen.getByText('Message 1000')).toBeVisible();
  expect(screen.getAllByRole('listitem').length).toBeLessThan(60);
});
