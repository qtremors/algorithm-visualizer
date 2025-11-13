import type { GraphInputData, GridInputData, InputData } from '../types/input';
export const LIMITS = {
  array: 100,
  rows: 50,
  cols: 50,
  nodes: 50,
  edges: 500,
  steps: 12000,
  bytes: 16 * 1024 * 1024,
};
export const integerInRange = (value: number, min: number, max: number) =>
  Number.isSafeInteger(value) && value >= min && value <= max;
export const createArray = () =>
  Array.from({ length: 15 }, () => Math.floor(Math.random() * 91) + 10);
export function createGrid(rows = 15, cols = 30): GridInputData {
  if (
    !integerInRange(rows, 1, LIMITS.rows) ||
    !integerInRange(cols, 1, LIMITS.cols)
  )
    throw new Error('Choose whole-number grid dimensions between 1 and 50.');
  return {
    kind: 'grid',
    grid: Array.from({ length: rows }, () => Array<number>(cols).fill(0)),
    start: { row: Math.floor(rows / 2), col: Math.floor(cols / 4) },
    end: { row: Math.floor(rows / 2), col: Math.floor(cols * 0.75) },
  };
}
export const createGraph = (): GraphInputData => ({
  kind: 'graph',
  nodes: {},
  adjacency: {},
});
export function parseArray(text: string): number[] {
  if (!text.trim()) throw new Error('Enter at least one integer.');
  const tokens = text.split(',');
  if (tokens.length > LIMITS.array)
    throw new Error(`Use at most ${LIMITS.array} values.`);
  if (tokens.some((token) => !/^[+-]?\d+$/.test(token.trim())))
    throw new Error('Use whole integers separated by commas.');
  const values = tokens.map((token) => Number(token.trim()));
  if (!values.every(Number.isSafeInteger))
    throw new Error('Values must be safe integers.');
  return values;
}
export function inputError(data: InputData | null): string | null {
  if (data === null) return 'Enter valid input before visualizing.';
  if (Array.isArray(data))
    return data.length &&
      data.length <= LIMITS.array &&
      data.every(Number.isSafeInteger)
      ? null
      : 'Enter 1–100 safe integers.';
  if (data.kind === 'graph') {
    if (!Object.keys(data.nodes).length)
      return 'Add graph nodes and choose a start and end.';
    if (
      !data.start ||
      !data.end ||
      !Object.hasOwn(data.nodes, data.start) ||
      !Object.hasOwn(data.nodes, data.end)
    )
      return 'Choose an existing start and end node.';
  }
  return null;
}
