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
    <fieldset disabled={disabled} className="grid-editor">
      <legend className="sr-only">Grid input</legend>
      <div className="grid-editor-row">
        <div className="grid-dimensions">
          <label className="control-field" htmlFor={`${id}-rows`}>
            <span>Rows</span>
            <input
              id={`${id}-rows`}
              type="number"
              min={1}
              max={50}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
              className="control-input"
            />
          </label>
          <label className="control-field" htmlFor={`${id}-cols`}>
            <span>Columns</span>
            <input
              id={`${id}-cols`}
              type="number"
              min={1}
              max={50}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
              className="control-input"
            />
          </label>
          <label className="control-field" htmlFor={`${id}-density`}>
            <span>Walls %</span>
            <input
              id={`${id}-density`}
              type="number"
              min={0}
              max={90}
              value={density}
              onChange={(e) => setDensity(Number(e.target.value))}
              className="control-input"
            />
          </label>
          <button
            type="button"
            onClick={() => generate(false)}
            title="Clear Grid"
            aria-label="Clear Grid"
            className="control-icon"
          >
            <RefreshCw size={17} />
          </button>
          <button
            type="button"
            onClick={() => generate(true)}
            title="Randomize Walls"
            aria-label="Randomize Walls"
            className="control-icon"
          >
            <Shuffle size={17} />
          </button>
        </div>
        <div className="tool-group" role="group" aria-label="Grid tools">
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
      </div>
      <div className="grid-editor-row">
        {(['start', 'end'] as const).map((type) => (
          <div key={type} className="coordinate-group">
            {(['row', 'col'] as const).map((axis) => (
              <label key={axis} className="control-field">
                <span className="capitalize">
                  {type} {axis}
                </span>
                <input
                  type="number"
                  aria-label={`${type} ${axis}`}
                  min={0}
                  max={
                    (axis === 'row'
                      ? currentData.grid.length
                      : currentData.grid[0].length) - 1
                  }
                  value={currentData[type][axis]}
                  onChange={(e) =>
                    updateCoordinate(type, axis, Number(e.target.value))
                  }
                  className="control-input"
                />
              </label>
            ))}
          </div>
        ))}
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
      {error && (
        <p role="alert" className="text-red-400 text-xs">
          {error}
        </p>
      )}
    </fieldset>
  );
}
