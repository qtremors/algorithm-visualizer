import { GitGraph, Network } from 'lucide-react';

export default function CanvasEmptyState({ kind }: { kind: 'graph' | 'tree' }) {
  const graph = kind === 'graph';
  const Icon = graph ? GitGraph : Network;
  return (
    <div className="canvas-empty-state">
      <Icon size={32} aria-hidden="true" />
      <h3>{graph ? 'Build your graph' : 'Your tree starts here'}</h3>
      <p>
        {graph
          ? 'Generate a Tree or Mesh above, or use the Node tool to place your first node.'
          : 'Set the initial values and operations above, then choose Visualize to build the tree step by step.'}
      </p>
      <span>
        {graph
          ? 'Keyboard: focus the canvas, move with arrows, then press Enter.'
          : 'Try the same values with BST and AVL to see how balancing changes the shape.'}
      </span>
    </div>
  );
}
