import type { Cell } from './input';

export interface AlgorithmMetadata {
  name: string;
  pseudocode: string[];
  input_type: 'list[int]' | 'graph_grid';
  visualizer: 'bar_chart' | 'grid_2d';
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
  type:
    | 'info'
    | 'compare'
    | 'swap'
    | 'sorted'
    | 'visit_node'
    | 'relax_edge'
    | 'found_path';
  payload: StepPayload;
  snapshot: SortingSnapshot | GridSnapshot | GraphSnapshot;
  message: string;
  line: number;
}
export type ServerMessage =
  | AlgorithmStep
  | { type: 'complete'; steps: number }
  | { type: 'error'; code: string; message: string };
export type RunStatus = 'idle' | 'running' | 'completed' | 'failed';
