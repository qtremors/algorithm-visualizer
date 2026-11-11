import type { AlgorithmMetadata } from '../types';
import type {
  GraphInputData,
  GridInputData,
  InputData,
  TreeInputData,
} from '../types/input';
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
  if (data.kind === 'grid') {
    if (
      !data.grid.length ||
      data.grid.length > LIMITS.rows ||
      !data.grid[0]?.length ||
      data.grid[0].length > LIMITS.cols
    )
      return `Use a grid of at most ${LIMITS.rows} rows and ${LIMITS.cols} columns.`;
    const cols = data.grid[0].length;
    if (
      !data.grid.every(
        (row) =>
          row.length === cols && row.every((cell) => [0, 1, 5].includes(cell)),
      )
    )
      return 'Use a rectangular grid with valid cells.';
    for (const point of [data.start, data.end])
      if (
        !integerInRange(point.row, 0, data.grid.length - 1) ||
        !integerInRange(point.col, 0, cols - 1) ||
        data.grid[point.row][point.col] === 1
      )
        return 'Choose endpoints inside open grid cells.';
  }
  if (data.kind === 'graph') {
    if (
      Object.keys(data.nodes).length > LIMITS.nodes ||
      Object.values(data.adjacency).reduce(
        (sum, neighbors) => sum + Object.keys(neighbors).length,
        0,
      ) > LIMITS.edges
    )
      return `Use at most ${LIMITS.nodes} nodes and ${LIMITS.edges} directed edges.`;
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

export const createTree = (): TreeInputData => ({
  kind: 'tree',
  values: [30, 20, 40, 10, 25, 35, 50],
  operations: [],
  traversal: 'inorder',
});

export function algorithmInputError(
  data: InputData | null,
  algorithm?: AlgorithmMetadata,
): string | null {
  const problem = inputError(data);
  if (problem) return problem;
  if (data && !Array.isArray(data) && data.kind === 'tree' && data.invalid)
    return 'Correct the tree input before visualizing.';
  if (
    data &&
    !Array.isArray(data) &&
    data.kind === 'graph' &&
    algorithm?.supports_negative !== true &&
    Object.values(data.adjacency).some((neighbors) =>
      Object.values(neighbors).some((weight) => weight < 0),
    )
  )
    return 'Negative edges require Bellman–Ford. Choose it or edit the edge weights.';
  return null;
}
