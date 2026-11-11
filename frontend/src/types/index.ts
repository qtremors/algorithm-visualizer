import type { Cell } from './input';

export interface AlgorithmMetadata {
  name: string;
  pseudocode: string[];
  input_type: 'list[int]' | 'graph_grid' | 'tree';
  visualizer: 'bar_chart' | 'grid_2d' | 'tree';
  supports_negative?: boolean;
  heuristics?: string[];
  description: string;
  complexity: { time: string; space: string };
  pros: string[];
  cons: string[];
}
export type AlgorithmsData = Record<string, Record<string, AlgorithmMetadata>>;
export type NodeId = string | Cell;
export interface StepPayload {
  indices?: number[];
  node?: NodeId;
  from?: NodeId;
  to?: NodeId;
  dist?: number;
  path?: NodeId[];
}
export type SortingSnapshot = number[];
export interface GridSnapshot {
  type: 'grid';
  visited: Cell[];
  path: Cell[];
}
export interface GraphSnapshot {
  type: 'graph';
  visited: string[];
  path: string[];
}
export interface AlgorithmStep {
  sequence?: number;
  learning?: LearningState;
  type:
    | 'info'
    | 'compare'
    | 'swap'
    | 'sorted'
    | 'write'
    | 'negative_cycle'
    | 'tree_update'
    | 'visit_node'
    | 'relax_edge'
    | 'found_path';
  payload: StepPayload;
  snapshot: SortingSnapshot | GridSnapshot | GraphSnapshot | TreeSnapshot;
  message: string;
  line: number;
}
export type ServerMessage =
  | AlgorithmStep
  | {
      type: 'complete';
      steps: number;
      metrics?: Record<string, number | string>;
    }
  | { type: 'error'; code: string; message: string };
export type RunStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface LearningState {
  frontier?: NodeId[];
  frontier_count?: number;
  distances?: Record<string, number>;
  parents?: Record<string, NodeId>;
  boundary?: number[];
  explanation?: string;
}

export interface TreeNode {
  id: string;
  value: number;
  count: number;
  left: string | null;
  right: string | null;
  height: number;
}
export interface TreeSnapshot {
  type: 'tree';
  root: string | null;
  nodes: TreeNode[];
  visited: string[];
}
