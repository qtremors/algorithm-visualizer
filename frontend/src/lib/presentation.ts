import type { GraphTool, GridTool } from '../types/input';

export const categoryNames: Record<string, string> = {
  sorting: 'Sorting',
  pathfinding: 'Pathfinding',
  trees: 'Search trees',
};
export const categoryDescriptions: Record<string, string> = {
  sorting:
    'Choose an input, follow comparisons and writes, and replay each change.',
  pathfinding:
    'Shape the input and follow how the algorithm reaches its destination.',
  trees: 'Build, edit, and explore the structure one operation at a time.',
};
const gridHints: Record<GridTool, string> = {
  wall: 'Wall tool: drag across cells to paint walls. Endpoints stay open.',
  weight: 'Weight tool: paint cells with an entry cost of 5.',
  erase: 'Erase tool: turn walls and weighted cells back into open space.',
  start: 'Start tool: choose the cell where the search begins.',
  end: 'End tool: choose the destination cell.',
};
const graphHints: Record<GraphTool, string> = {
  node: 'Node tool: select an empty position on the canvas to add a node.',
  edge: 'Connect tool: drag from one node to another, or activate both nodes with the keyboard.',
  move: 'Move tool: drag a node, or focus it and use the arrow keys.',
  start: 'Start tool: select the node where the search begins.',
  end: 'End tool: select the destination node.',
  delete: 'Delete tool: select a node or an edge weight to remove it.',
};
export function editorHint(
  view: 'grid' | 'graph',
  gridTool: GridTool,
  graphTool: GraphTool,
  busy: boolean,
): string {
  if (busy)
    return 'Input editing is locked during a run or playback. Pause after reception finishes to edit, or use Reset.';
  return view === 'grid' ? gridHints[gridTool] : graphHints[graphTool];
}

export function comparisonCategory(pathname: string): string {
  const category = pathname.split('/').filter(Boolean).at(-1) || '';
  return Object.hasOwn(categoryNames, category) ? category : 'sorting';
}
