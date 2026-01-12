import { useState } from 'react';
import { Circle, Share2, PlayCircle, Flag, Trash2 } from 'lucide-react';
import type { GraphInputData, GraphTool, Point } from '../../types/input';
import { createGraph, integerInRange, LIMITS } from '../../lib/input';
import ToolButton from '../core/ToolButton';

type Props = {
  onSubmit: (data: GraphInputData) => void;
  mode: GraphTool;
  setMode: (mode: GraphTool) => void;
  currentData: GraphInputData;
  disabled: boolean;
};
export default function GraphInput({
  onSubmit,
  mode,
  setMode,
  currentData,
  disabled,
}: Props) {
  const [nodeCount, setNodeCount] = useState(10);
  const [density, setDensity] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const generate = (tree: boolean) => {
    if (disabled) return;
    if (
      !integerInRange(nodeCount, 1, LIMITS.nodes) ||
      !integerInRange(density, 1, 8)
    ) {
      setError('Use 1–50 nodes and 1–8 neighbors.');
      return;
    }
    const data = createGraph();
    const keys = Array.from({ length: nodeCount }, (_, i) =>
      i < 26 ? String.fromCharCode(65 + i) : String.fromCharCode(97 + i - 26),
    );
    const cols = Math.ceil(Math.sqrt(nodeCount));
    const rows = Math.ceil(nodeCount / cols);
    keys.forEach((id, i) => {
      // A bounded grid layout keeps labels separated without an O(n²) solver.
      const position: Point = tree
        ? {
            x:
              500 +
              (i -
                (2 ** Math.floor(Math.log2(i + 1)) - 1) -
                (2 ** Math.floor(Math.log2(i + 1)) - 1) / 2) *
                (800 / 2 ** Math.floor(Math.log2(i + 1))),
            y: 50 + Math.floor(Math.log2(i + 1)) * 95,
          }
        : {
            x: ((i % cols) + 0.5) * (1000 / cols),
            y: (Math.floor(i / cols) + 0.5) * (720 / rows),
          };
      data.nodes[id] = position;
      data.adjacency[id] = {};
    });
    if (tree)
      keys.slice(1).forEach((id, offset) => {
        data.adjacency[keys[Math.floor(offset / 2)]][id] =
          1 + Math.floor(Math.random() * 10);
      });
    else {
      let edges = 0;
      keys.forEach((u, index) => {
        // A ring ensures connectivity; extra local connections add variety.
        for (let d = 1; d <= Math.min(density, keys.length - 1); d++) {
          const v = keys[(index + d) % keys.length];
          if (Object.hasOwn(data.adjacency[u], v) || edges + 2 > LIMITS.edges)
            continue;
          const weight = 1 + Math.floor(Math.random() * 10);
          data.adjacency[u][v] = data.adjacency[v][u] = weight;
          edges += 2;
        }
      });
    }
    data.start =
      currentData.start && Object.hasOwn(data.nodes, currentData.start)
        ? currentData.start
        : keys[0];
    data.end =
      currentData.end && Object.hasOwn(data.nodes, currentData.end)
        ? currentData.end
        : keys.at(-1);
    setError(null);
    onSubmit(data);
  };
  return (
    <fieldset
      disabled={disabled}
      className="w-full flex flex-wrap gap-3 items-center disabled:opacity-60"
    >
      <legend className="sr-only">Graph input</legend>
      <div className="flex gap-2 items-center bg-gray-900 border border-gray-700 p-2 rounded-lg">
        <label className="text-xs flex items-center gap-1">
          Nodes
          <input
            aria-label="Node count"
            type="number"
            min="1"
            max="50"
            value={nodeCount}
            onChange={(e) => setNodeCount(Number(e.target.value))}
            className="w-12 bg-transparent"
          />
        </label>
        <label className="text-xs flex items-center gap-1">
          Neighbors
          <input
            aria-label="Neighbors per node"
            type="number"
            min="1"
            max="8"
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="w-10 bg-transparent"
          />
        </label>
        <button
          type="button"
          onClick={() => generate(true)}
          className="text-purple-400 text-xs px-2"
        >
          Tree
        </button>
        <button
          type="button"
          onClick={() => generate(false)}
          className="text-blue-400 text-xs px-2"
        >
          Mesh
        </button>
        <button
          type="button"
          onClick={() => {
            setError(null);
            onSubmit(createGraph());
          }}
          aria-label="Clear graph"
          title="Clear"
          className="p-1"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div
        role="group"
        aria-label="Graph tools"
        className="flex flex-wrap gap-1 bg-gray-900 p-1 rounded-lg"
      >
        <ToolButton
          active={mode === 'node'}
          onClick={() => setMode('node')}
          icon={<Circle size={14} />}
          label="Node"
          color="text-blue-400"
        />
        <ToolButton
          active={mode === 'edge'}
          onClick={() => setMode('edge')}
          icon={<Share2 size={14} />}
          label="Connect"
          color="text-yellow-400"
        />
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
          active={mode === 'delete'}
          onClick={() => setMode('delete')}
          icon={<Trash2 size={14} />}
          label="Delete"
          color="text-red-400"
        />
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-400 w-full">
          {error}
        </p>
      )}
    </fieldset>
  );
}
