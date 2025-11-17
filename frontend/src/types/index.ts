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
 * A single, generic step from the WebSocket
 */
export interface AlgorithmStep {
  type: string;
  payload: any;
  snapshot: any;
  message: string;
  line: number;
}