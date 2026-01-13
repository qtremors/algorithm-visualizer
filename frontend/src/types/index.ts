/**
 * Metadata for a single algorithm
 */
export interface AlgorithmMetadata {
  name: string;
  pseudocode: string[];
  input_type: 'list[int]' | 'graph_grid' | string;
  visualizer: 'bar_chart' | 'grid_2d' | string;
  description: string;
  complexity: {
    time: string;
    space: string;
  };
  pros: string[];
  cons: string[];
}

/**
 * The full data structure from /api/algorithms
 */
export interface AlgorithmsData {
  [category: string]: {
    [name: string]: AlgorithmMetadata;
  };
}

/**
 * Specific payloads for different algorithm categories
 */
export interface SortingPayload {
  comparision?: [number, number]; // legacy support if needed
  comparing?: [number, number];
  swapped?: boolean;
  indices?: number[];
}

export interface PathfindingPayload {
  current?: [number, number] | string;
  neighbors?: ([number, number] | string)[];
  weight?: number;
  start?: { row: number, col: number };
  end?: { row: number, col: number };
  node?: string;
  indices?: number[]; // For generic handling
}

/**
 * Snapshots for different visualizers
 */
export type SortingSnapshot = number[];

export interface GridSnapshot {
  grid: number[][];
  visited: [number, number][];
  path: [number, number][];
}

export interface GraphSnapshot {
  visited: string[];
  path: string[];
  type?: 'graph';
}

/**
 * A single, generic step from the WebSocket
 */
export interface AlgorithmStep {
  type: string;
  payload: SortingPayload | PathfindingPayload | null;
  snapshot: SortingSnapshot | GridSnapshot | GraphSnapshot;
  message: string;
  line: number;
}