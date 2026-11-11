/** WCAG relative luminance, using unrounded sRGB values for threshold checks. */
type RGB = readonly [number, number, number];
export function fromHex(value: string): RGB {
  const hex = value.replace(/^#/, '');
  const expanded = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  if (!/^[0-9a-f]{6}$/i.test(expanded))
    throw new Error('Expected an sRGB hex color.');
  return [0, 2, 4].map((offset) =>
    parseInt(expanded.slice(offset, offset + 2), 16),
  ) as unknown as RGB;
}
function luminance(color: RGB): number {
  const linear = color.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
export function contrast(foreground: string, background: string): number {
  const a = luminance(fromHex(foreground)),
    b = luminance(fromHex(background));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
export function colorTokens(css: string): Record<string, string> {
  return Object.fromEntries(
    [...css.matchAll(/(--(?:ui|viz)-[\w-]+):\s*(#[\da-f]{6})\s*;/gi)].map(
      (match) => [match[1], match[2]],
    ),
  );
}
