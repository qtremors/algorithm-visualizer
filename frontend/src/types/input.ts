export type Point = { x: number; y: number };
export type Cell = [number, number];
export type GridInputData = {
  kind: 'grid';
  grid: number[][];
  start: { row: number; col: number };
  end: { row: number; col: number };
};
export type GraphInputData = {
  kind: 'graph';
  nodes: Record<string, Point>;
  adjacency: Record<string, Record<string, number>>;
  start?: string;
  end?: string;
};
export type ArrayInputData = number[];
export type InputData = GridInputData | GraphInputData | ArrayInputData;
export type GridTool = 'wall' | 'start' | 'end';
export type GraphTool = 'node' | 'edge' | 'start' | 'end' | 'delete';
export type GraphInteraction =
  | { type: 'addNode'; point: Point }
  | { type: 'nodeClick'; nodeId: string }
  | { type: 'connectStart'; nodeId: string }
  | { type: 'connectMove'; point: Point }
  | { type: 'connectEnd'; nodeId: string }
  | { type: 'connectCancel' };
export type ConnectionLine = { start: Point; end: Point };
