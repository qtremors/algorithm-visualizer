/// <reference types="node" />
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const css = readFileSync('src/styles/theme.css', 'utf8');
import { colorTokens, contrast } from './contrast';
const tokens = colorTokens(css);
const token = (name: string) => {
  const value = tokens[`--${name}`];
  if (!value) throw new Error(`Missing semantic color ${name}`);
  return value;
};
describe('OLED contrast requirements', () => {
  it('uses the WCAG luminance formula without rounding threshold results', () => {
    expect(contrast('#fff', '#000')).toBe(21);
    expect(contrast('#123456', '#123456')).toBe(1);
    expect(contrast('#777777', '#ffffff')).toBeLessThan(4.5);
    expect(contrast('#767676', '#ffffff')).toBeGreaterThan(4.5);
  });
  it('keeps the page and panel backgrounds pure black', () => {
    expect(token('ui-background')).toBe('#000000');
    expect(token('ui-surface')).toBe('#000000');
  });
  it.each([
    'text',
    'text-muted',
    'text-subtle',
    'disabled-text',
    'accent',
    'success',
    'danger',
    'warning',
  ])('%s text exceeds 4.5:1 on OLED black', (name) => {
    expect(
      contrast(token(`ui-${name}`), token('ui-background')),
    ).toBeGreaterThanOrEqual(4.5);
  });
  it.each(['control-border', 'focus'])(
    '%s stays distinguishable at 3:1 on black',
    (name) => {
      expect(
        contrast(token(`ui-${name}`), token('ui-background')),
      ).toBeGreaterThanOrEqual(3);
    },
  );
  it.each(['primary', 'primary-hover'])(
    'primary button labels meet 4.5:1 on %s',
    (name) => {
      expect(
        contrast(token('ui-primary-text'), token(`ui-${name}`)),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );
  it('keeps selected and hover controls readable', () => {
    expect(
      contrast(token('ui-accent'), token('ui-selected-surface')),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(token('ui-text'), token('ui-hover-surface')),
    ).toBeGreaterThanOrEqual(4.5);
  });
  it.each(['wall', 'start', 'end', 'visited', 'path', 'weight'])(
    'grid glyphs are readable on %s cells',
    (name) => {
      expect(
        contrast(token('viz-glyph'), token(`viz-${name}`)),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );
  it('keeps open grid cells visible against black', () => {
    expect(
      contrast(token('viz-open-border'), token('ui-background')),
    ).toBeGreaterThanOrEqual(3);
  });
});
