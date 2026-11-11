import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePlaybackShortcuts } from './usePlaybackShortcuts';
function setup(overrides = {}) {
  const options = {
    length: 5,
    playing: false,
    play: vi.fn(),
    pause: vi.fn(),
    next: vi.fn(),
    previous: vi.fn(),
    first: vi.fn(),
    last: vi.fn(),
    reset: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canEdit: true,
    ...overrides,
  };
  return { ...renderHook(() => usePlaybackShortcuts(options)), options };
}
const key = (code: string, extras: KeyboardEventInit = {}) =>
  window.dispatchEvent(
    new KeyboardEvent('keydown', {
      code,
      bubbles: true,
      cancelable: true,
      ...extras,
    }),
  );
afterEach(() => {
  document
    .querySelectorAll('[data-shortcut-test]')
    .forEach((element) => element.remove());
});
describe('workspace keyboard commands', () => {
  it.each([
    ['Home', 'first'],
    ['End', 'last'],
    ['ArrowRight', 'next'],
    ['ArrowLeft', 'previous'],
  ])('%s navigates the paused timeline', (code, action) => {
    const { options } = setup();
    key(code);
    expect(options[action as 'first']).toHaveBeenCalledOnce();
  });
  it('does not step a playing timeline and toggles pause on Space', () => {
    const { options } = setup({ playing: true });
    key('ArrowRight');
    key('Space');
    expect(options.next).not.toHaveBeenCalled();
    expect(options.pause).toHaveBeenCalledOnce();
  });
  it('keeps native text-editing shortcuts inside inputs', () => {
    const { options } = setup();
    const input = document.createElement('input');
    input.dataset.shortcutTest = '';
    document.body.append(input);
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        code: 'KeyZ',
        ctrlKey: true,
        bubbles: true,
      }),
    );
    expect(options.undo).not.toHaveBeenCalled();
  });
  it('supports undo and both common redo shortcuts outside editors', () => {
    const { options } = setup();
    key('KeyZ', { ctrlKey: true });
    key('KeyZ', { metaKey: true, shiftKey: true });
    key('KeyY', { ctrlKey: true });
    expect(options.undo).toHaveBeenCalledOnce();
    expect(options.redo).toHaveBeenCalledTimes(2);
  });
  it('keeps Reset available after failure while blocking playback', () => {
    const { options } = setup({ failed: true });
    key('Space');
    key('KeyR');
    expect(options.play).not.toHaveBeenCalled();
    expect(options.reset).toHaveBeenCalledOnce();
  });
  it('suspends shortcuts while a native dialog is open', () => {
    const { options } = setup();
    const dialog = document.createElement('dialog');
    dialog.open = true;
    dialog.dataset.shortcutTest = '';
    document.body.append(dialog);
    key('KeyR');
    expect(options.reset).not.toHaveBeenCalled();
  });
  it('removes its listener when the workspace is unmounted', () => {
    const { options, unmount } = setup();
    unmount();
    key('KeyR');
    expect(options.reset).not.toHaveBeenCalled();
  });
});
