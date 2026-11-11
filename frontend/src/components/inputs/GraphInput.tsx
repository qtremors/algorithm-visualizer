import { useState } from 'react';
import { Circle, Share2, PlayCircle, Flag, Trash2 } from 'lucide-react';
import type { GraphInputData, GraphTool, Point } from '../../types/input';
import { createGraph, integerInRange, LIMITS } from '../../lib/input';
import { seededRandom } from '../../lib/random';
import ToolButton from '../core/ToolButton';

type Props = {
  onSubmit: (data: GraphInputData) => void;
  mode: GraphTool;
  setMode: (mode: GraphTool) => void;
  currentData: GraphInputData;
  disabled: boolean;
  seed?: string;
  directed?: boolean;
  onDirectedChange?: (value: boolean) => void;
};
export default function GraphInput({
  onSubmit,
  mode,
  setMode,
  currentData,
  disabled,
  seed = 'algoviz',
  directed = false,
  onDirectedChange,
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
    const random = seededRandom(seed);
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
          1 + Math.floor(random() * 10);
      });
    else {
      let edges = 0;
      keys.forEach((u, index) => {
        // A ring ensures connectivity; extra local connections add variety.
        for (let d = 1; d <= Math.min(density, keys.length - 1); d++) {
          const v = keys[(index + d) % keys.length];
          if (Object.hasOwn(data.adjacency[u], v) || edges + 2 > LIMITS.edges)
            continue;
          const weight = 1 + Math.floor(random() * 10);
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
    <fieldset disabled={disabled} className="grid-editor disabled:opacity-60">
      <legend className="sr-only">Graph input</legend>
      <div className="graph-generator">
        <label className="control-field">
          <span>Nodes</span>
          <input
            aria-label="Node count"
            type="number"
            min={1}
            max={50}
            value={nodeCount}
            onChange={(e) => setNodeCount(Number(e.target.value))}
            className="control-input"
          />
        </label>
        <label className="control-field">
          <span>Neighbors</span>
          <input
            aria-label="Neighbors per node"
            type="number"
            min={1}
            max={8}
            value={density}
            onChange={(e) => setDensity(Number(e.target.value))}
            className="control-input"
          />
        </label>
        <button
          type="button"
          onClick={() => generate(true)}
          className="action-secondary"
        >
          Tree
        </button>
        <button
          type="button"
          onClick={() => generate(false)}
          className="action-secondary"
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
          title="Clear graph"
          className="control-icon"
        >
          <Trash2 size={17} />
        </button>
        <label className="playback-speed">
          <input
            type="checkbox"
            checked={directed}
            disabled={disabled}
            onChange={(e) => onDirectedChange?.(e.target.checked)}
          />
          Directed connections
        </label>
      </div>
      <div role="group" aria-label="Graph tools" className="tool-group">
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
        <ToolButton
          active={mode === 'move'}
          onClick={() => setMode('move')}
          icon={<span>↔</span>}
          label="Move"
          color="text-blue-300"
        />
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </fieldset>
  );
}
