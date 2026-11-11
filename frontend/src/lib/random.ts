/** Reproducible generators make comparisons and shared examples repeatable. */
export function seededRandom(seed: string): () => number {
  let state = 2166136261;
  for (const character of seed)
    state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export type ArrayPreset =
  | 'random'
  | 'sorted'
  | 'reversed'
  | 'nearly_sorted'
  | 'duplicates'
  | 'signed';
export function arrayPreset(
  preset: ArrayPreset,
  size: number,
  seed: string,
  min = 10,
  max = 100,
): number[] {
  if (!Number.isInteger(size) || size < 1 || size > 100)
    throw new Error('Use 1–100 values.');
  if (
    !Number.isSafeInteger(min) ||
    !Number.isSafeInteger(max) ||
    min > max ||
    !Number.isSafeInteger(max - min + 1)
  )
    throw new Error('Use a safe integer range with min ≤ max.');
  const random = seededRandom(seed);
  const data = Array.from(
    { length: size },
    () => Math.floor(random() * (max - min + 1)) + min,
  );
  if (
    preset === 'sorted' ||
    preset === 'reversed' ||
    preset === 'nearly_sorted'
  )
    data.sort((a, b) => a - b);
  if (preset === 'reversed') data.reverse();
  if (preset === 'nearly_sorted' && size > 1)
    [data[0], data[1]] = [data[1], data[0]];
  if (preset === 'duplicates')
    return data.map((_, i) => min + (i % Math.min(3, max - min + 1)));
  if (preset === 'signed')
    return data.map((value, i) => (i % 2 ? -Math.abs(value) : Math.abs(value)));
  return data;
}
