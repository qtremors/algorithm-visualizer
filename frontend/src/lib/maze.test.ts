import { describe, expect, it } from 'vitest';
import { generateMaze, type MazeAlgorithm } from './maze';
import { arrayPreset, seededRandom } from './random';
import { validateGrid } from './session';

describe('seeded generators', () => {
  it('repeats the same seed and produces different streams for different seeds', () => {
    const a = seededRandom('same'),
      b = seededRandom('same'),
      c = seededRandom('different');
    const values = Array.from({ length: 100 }, () => a());
    expect(values).toEqual(Array.from({ length: 100 }, () => b()));
    expect(values).not.toEqual(Array.from({ length: 100 }, () => c()));
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
  });
  it('creates useful sorting presets without changing sizes', () => {
    expect(arrayPreset('sorted', 10, 'a')).toEqual(
      [...arrayPreset('random', 10, 'a')].sort((a, b) => a - b),
    );
    expect(arrayPreset('reversed', 10, 'a')).toEqual(
      [...arrayPreset('sorted', 10, 'a')].reverse(),
    );
    expect(
      new Set(arrayPreset('duplicates', 20, 'a')).size,
    ).toBeLessThanOrEqual(3);
    expect(arrayPreset('signed', 10, 'a').some((value) => value < 0)).toBe(
      true,
    );
    expect(() => arrayPreset('random', 101, 'a')).toThrow();
  });
  for (const algorithm of ['backtracker', 'prim'] as MazeAlgorithm[]) {
    it.each([
      [1, 1],
      [2, 2],
      [3, 3],
      [10, 12],
      [15, 30],
      [50, 50],
    ])(
      `${algorithm} guarantees reachable endpoints for %s×%s`,
      (rows, cols) => {
        const data = generateMaze(rows, cols, 'reproducible', algorithm);
        validateGrid(data);
        expect(data).toEqual(
          generateMaze(rows, cols, 'reproducible', algorithm),
        );
        const queue = [[data.start.row, data.start.col]];
        const seen = new Set(queue.map(String));
        for (let i = 0; i < queue.length; i++) {
          const [r, c] = queue[i];
          for (const [dr, dc] of [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
          ]) {
            const nr = r + dr,
              nc = c + dc;
            if (
              nr < 0 ||
              nc < 0 ||
              nr >= rows ||
              nc >= cols ||
              data.grid[nr][nc] === 1 ||
              seen.has(String([nr, nc]))
            )
              continue;
            seen.add(String([nr, nc]));
            queue.push([nr, nc]);
          }
        }
        expect(seen.has(String([data.end.row, data.end.col]))).toBe(true);
        expect(data.grid.flat().every((cell) => cell === 0 || cell === 1)).toBe(
          true,
        );
      },
    );
  }
});
