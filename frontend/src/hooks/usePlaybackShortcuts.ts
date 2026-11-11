import { useEffect } from 'react';

interface Options {
  length: number;
  playing: boolean;
  failed?: boolean;
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  first: () => void;
  last: () => void;
  reset: () => void;
  undo?: () => void;
  redo?: () => void;
  canEdit?: boolean;
}

export function isEditingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    !!target.closest(
      'input, textarea, select, button, a, [role="button"], [role="tab"], [contenteditable]',
    )
  );
}

/** Native controls and dialogs keep their own keyboard behavior. */
export function usePlaybackShortcuts(options: Options) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        isEditingTarget(event.target) ||
        document.querySelector('dialog[open]')
      )
        return;
      if (event.ctrlKey || event.metaKey) {
        if (!options.canEdit) return;
        if (
          event.code === 'KeyZ' &&
          (event.shiftKey ? options.redo : options.undo)
        ) {
          event.preventDefault();
          if (event.shiftKey) options.redo?.();
          else options.undo?.();
        } else if (event.code === 'KeyY' && options.redo) {
          event.preventDefault();
          options.redo();
        }
        return;
      }
      if (event.code === 'KeyR') {
        event.preventDefault();
        options.reset();
        return;
      }
      if (!options.length || options.failed) return;
      if (event.code === 'Space') {
        event.preventDefault();
        if (options.playing) options.pause();
        else options.play();
      } else if (!options.playing) {
        const navigation: Record<string, () => void> = {
          ArrowRight: options.next,
          ArrowLeft: options.previous,
          Home: options.first,
          End: options.last,
        };
        const action = navigation[event.code];
        if (action) {
          event.preventDefault();
          action();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [options]);
}
