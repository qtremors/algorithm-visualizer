import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import SessionToolbar from './SessionToolbar';
import { defaultSession } from '../../lib/session';
const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
afterEach(() => {
  if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard);
  else Reflect.deleteProperty(navigator, 'clipboard');
  vi.restoreAllMocks();
});
it('offers a usable share link when clipboard permissions are unavailable', async () => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) },
  });
  render(
    <SessionToolbar
      session={defaultSession()}
      onImport={vi.fn()}
      undo={vi.fn()}
      redo={vi.fn()}
      canUndo={false}
      canRedo={false}
      disabled={false}
      setSeed={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Share session' }));
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('Share link ready'),
  );
  expect(
    (screen.getByLabelText('Session text') as HTMLTextAreaElement).value,
  ).toContain('#session=');
  expect(
    screen.getByText('Import or copy a session').closest('details'),
  ).toHaveAttribute('open');
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
