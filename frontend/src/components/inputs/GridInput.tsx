import { useId, useState } from 'react';
import { Ban, Flag, PlayCircle, Shuffle, RefreshCw } from 'lucide-react';
import type { GridInputData, GridTool } from '../../types/input';
import { createGrid, integerInRange } from '../../lib/input';
import { generateMaze } from '../../lib/maze';
import { seededRandom } from '../../lib/random';
import ToolButton from '../core/ToolButton';

type Props = {
  onSubmit: (data: GridInputData) => void;
  mode: GridTool;
  setMode: (mode: GridTool) => void;
  currentData: GridInputData;
  disabled: boolean;
  seed?: string;
};
export default function GridInput({
  onSubmit,
  mode,
  setMode,
  currentData,
  disabled,
  seed = 'algoviz',
}: Props) {
  const id = useId();
  const [rows, setRows] = useState(currentData.grid.length);
  const [cols, setCols] = useState(currentData.grid[0]?.length || 1);
  const [density, setDensity] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const generate = (random: boolean) => {
    if (disabled) return;
    try {
      const data = createGrid(rows, cols);
      const randomValue = seededRandom(seed);
      if (random) {
        if (!integerInRange(density, 0, 90))
          throw new Error('Wall density must be a whole number from 0 to 90.');
        const cells = rows * cols;
        if (cells < 2)
          throw new Error('Randomization needs at least two cells.');
        const start = Math.floor(randomValue() * cells);
        // Select uniformly from the other cells without a retry loop.
        let end = Math.floor(randomValue() * (cells - 1));
        if (end >= start) end++;
        data.start = { row: Math.floor(start / cols), col: start % cols };
        data.end = { row: Math.floor(end / cols), col: end % cols };
        data.grid = data.grid.map((row) =>
          row.map(() => (randomValue() < density / 100 ? 1 : 0)),
        );
        data.grid[data.start.row][data.start.col] = data.grid[data.end.row][
          data.end.col
        ] = 0;
      }
      setError(null);
      onSubmit(data);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Invalid grid.');
    }
  };
  const updateCoordinate = (
    type: 'start' | 'end',
    axis: 'row' | 'col',
    value: number,
  ) => {
    if (disabled) return;
    const bound =
      axis === 'row' ? currentData.grid.length : currentData.grid[0].length;
    if (!integerInRange(value, 0, bound - 1)) {
      setError(
        `Use a whole ${axis} between 0 and ${bound - 1} for the current grid.`,
      );
      return;
    }
    const data = structuredClone(currentData);
    data[type][axis] = value;
    data.grid[data[type].row][data[type].col] = 0;
    setError(null);
    onSubmit(data);
  };
  return (
    <fieldset
      disabled={disabled}
      className="w-full flex flex-col gap-2 disabled:opacity-60"
    >
      <legend className="sr-only">Grid input</legend>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 bg-gray-900 max-w-full p-2 rounded-lg border border-gray-700">
          <label htmlFor={`${id}-rows`} className="text-xs">
            Rows
          </label>
          <input
            id={`${id}-rows`}
            type="number"
            min="1"
            max="50"
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
            className="w-12 bg-transparent"
          />
          <label htmlFor={`${id}-cols`} className="text-xs">
            Columns
          </label>
          <input
            id={`${id}-cols`}
            type="number"
            min="1"
            max="50"
            value={cols}
            onChange={(e) => setCols(Number(e.target.value))}
            className="w-12 bg-transparent"
          />
          <label htmlFor={`${id}-density`} className="text-xs">
            Walls %
          </label>
          <input
            id={`${id}-density`}
            type="number"
            min="0"
            max="90"
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="w-12 bg-transparent"
          />
          <button
            type="button"
            onClick={() => generate(false)}
            title="Clear Grid"
            aria-label="Clear Grid"
            className="p-1 text-gray-300"
          >
            <RefreshCw size={16} />
          </button>
          <button
            type="button"
            onClick={() => generate(true)}
            title="Randomize Walls"
            aria-label="Randomize Walls"
            className="p-1 text-purple-400"
          >
            <Shuffle size={16} />
          </button>
        </div>
        <div
          className="flex flex-wrap gap-1 bg-gray-900 p-1 rounded-lg"
          role="group"
          aria-label="Grid tools"
        >
          <ToolButton
            active={mode === 'start'}
            onClick={() => setMode('start')}
            icon={<PlayCircle size={14} />}
            label="Start"
            color="text-green-400"
          />
          <ToolButton
            active={mode === 'end'}
            onClick={() => setMode('end')}
            icon={<Flag size={14} />}
            label="End"
            color="text-red-400"
          />
          <ToolButton
            active={mode === 'wall'}
            onClick={() => setMode('wall')}
            icon={<Ban size={14} />}
            label="Wall"
            color="text-gray-300"
          />
          <ToolButton
            active={mode === 'weight'}
            onClick={() => setMode('weight')}
            icon={<span>5</span>}
            label="Weight"
            color="text-purple-400"
          />
          <ToolButton
            active={mode === 'erase'}
            onClick={() => setMode('erase')}
            icon={<span>×</span>}
            label="Erase"
            color="text-gray-300"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="action-secondary"
            onClick={() => {
              try {
                onSubmit(generateMaze(rows, cols, seed, 'backtracker'));
                setError(null);
              } catch (problem) {
                setError(String(problem));
              }
            }}
          >
            Backtracker maze
          </button>
          <button
            type="button"
            className="action-secondary"
            onClick={() => {
              try {
                onSubmit(generateMaze(rows, cols, seed, 'prim'));
                setError(null);
              } catch (problem) {
                setError(String(problem));
              }
            }}
          >
            Prim maze
          </button>
        </div>
        {(['start', 'end'] as const).map((type) => (
          <div key={type} className="flex gap-1 text-xs items-center">
            <span className="capitalize">{type}:</span>
            {(['row', 'col'] as const).map((axis) => (
              <label key={axis} className="flex gap-1 items-center">
                <span className="sr-only">
                  {type} {axis}
                </span>
                <input
                  type="number"
                  aria-label={`${type} ${axis}`}
                  min="0"
                  max={
                    (axis === 'row'
                      ? currentData.grid.length
                      : currentData.grid[0].length) - 1
                  }
                  value={currentData[type][axis]}
                  onChange={(e) =>
                    updateCoordinate(type, axis, Number(e.target.value))
                  }
                  className="w-12 bg-gray-900 p-1 rounded"
                />
              </label>
            ))}
          </div>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-red-400 text-xs">
          {error}
        </p>
      )}
    </fieldset>
  );
}
