import type { GridInputData } from '../types/input';
import { createGrid } from './input';
import { seededRandom } from './random';

type Cell = [number, number];
export type MazeAlgorithm = 'backtracker' | 'prim';
const directions: Cell[] = [
  [-2, 0],
  [2, 0],
  [0, -2],
  [0, 2],
];

/** Both generators carve a spanning tree, replacing existing walls and weights. */
export function generateMaze(
  rows: number,
  cols: number,
  seed: string,
  algorithm: MazeAlgorithm,
): GridInputData {
  const data = createGrid(rows, cols);
  const random = seededRandom(seed);
  data.grid = data.grid.map((row) => row.map(() => 1));
  const first: Cell = [Math.min(1, rows - 1), Math.min(1, cols - 1)];
  const last: Cell = [
    rows > 2 ? (rows - 2) | 1 : first[0],
    cols > 2 ? (cols - 2) | 1 : first[1],
  ];
  const seen = new Set<string>();
  const key = ([r, c]: Cell) => `${r},${c}`;
  const neighbors = ([r, c]: Cell): Cell[] =>
    directions
      .map(([dr, dc]): Cell => [r + dr, c + dc])
      .filter(
        ([nr, nc]) =>
          nr >= first[0] && nc >= first[1] && nr < rows && nc < cols,
      );
  const carve = (from: Cell, to: Cell) => {
    data.grid[to[0]][to[1]] = 0;
    data.grid[(from[0] + to[0]) / 2][(from[1] + to[1]) / 2] = 0;
    seen.add(key(to));
  };
  carve(first, first);
  if (algorithm === 'backtracker') {
    const stack = [first];
    while (stack.length) {
      const current = stack[stack.length - 1];
      const next = neighbors(current).filter((cell) => !seen.has(key(cell)));
      if (!next.length) {
        stack.pop();
        continue;
      }
      const chosen = next[Math.floor(random() * next.length)];
      carve(current, chosen);
      stack.push(chosen);
    }
  } else {
    const frontier: [Cell, Cell][] = neighbors(first).map((cell) => [
      first,
      cell,
    ]);
    while (frontier.length) {
      const index = Math.floor(random() * frontier.length);
      const [from, to] = frontier[index];
      frontier[index] = frontier[frontier.length - 1];
      frontier.pop();
      if (seen.has(key(to))) continue;
      carve(from, to);
      for (const cell of neighbors(to))
        if (!seen.has(key(cell))) frontier.push([to, cell]);
    }
  }
  data.start = { row: first[0], col: first[1] };
  data.end = { row: last[0], col: last[1] };
  data.grid[last[0]][last[1]] = 0;
  return data;
}
