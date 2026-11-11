import type {
  GraphInputData,
  GraphInteraction,
  GraphTool,
} from '../types/input';
import { LIMITS } from './input';

export function changeWeight(
  graph: GraphInputData,
  source: string,
  target: string,
  weight: number | null,
): GraphInputData {
  if (!Object.hasOwn(graph.adjacency[source] || {}, target)) return graph;
  if (
    weight !== null &&
    (!Number.isFinite(weight) || Math.abs(weight) > 1000000)
  )
    throw new Error('Use a finite weight between -1000000 and 1000000.');
  const data = structuredClone(graph);
  const symmetric =
    Object.hasOwn(data.adjacency[target] || {}, source) &&
    data.adjacency[target][source] === data.adjacency[source][target];
  if (weight === null) {
    delete data.adjacency[source][target];
    if (symmetric) delete data.adjacency[target][source];
  } else {
    data.adjacency[source][target] = weight;
    if (symmetric) data.adjacency[target][source] = weight;
  }
  return data;
}

export function editGraph(
  graph: GraphInputData,
  action: GraphInteraction,
  tool: GraphTool,
  directed: boolean,
  source: string | null,
): GraphInputData {
  const data = structuredClone(graph);
  if (action.type === 'addNode' && tool === 'node') {
    if (Object.keys(data.nodes).length >= LIMITS.nodes)
      throw new Error('Use at most 50 nodes.');
    let id = 1;
    while (Object.hasOwn(data.nodes, String(id))) id++;
    data.nodes[String(id)] = action.point;
    data.adjacency[String(id)] = {};
  } else if (action.type === 'moveNode' && tool === 'move') {
    if (!Object.hasOwn(data.nodes, action.nodeId)) return graph;
    data.nodes[action.nodeId] = {
      x: Math.max(20, Math.min(980, action.point.x)),
      y: Math.max(20, Math.min(700, action.point.y)),
    };
  } else if (action.type === 'nodeClick') {
    if (!Object.hasOwn(data.nodes, action.nodeId)) return graph;
    if (tool === 'delete') {
      delete data.nodes[action.nodeId];
      delete data.adjacency[action.nodeId];
      Object.values(data.adjacency).forEach(
        (neighbors) => delete neighbors[action.nodeId],
      );
      if (data.start === action.nodeId) delete data.start;
      if (data.end === action.nodeId) delete data.end;
    } else if (tool === 'start') data.start = action.nodeId;
    else if (tool === 'end') data.end = action.nodeId;
    else return graph;
  } else if (
    action.type === 'connectEnd' &&
    tool === 'edge' &&
    source &&
    source !== action.nodeId
  ) {
    if (
      !Object.hasOwn(data.nodes, source) ||
      !Object.hasOwn(data.nodes, action.nodeId)
    )
      return graph;
    if (Object.hasOwn(data.adjacency[source], action.nodeId)) return graph;
    // Undirected editing must not silently replace a reverse directed edge.
    if (!directed && Object.hasOwn(data.adjacency[action.nodeId], source))
      return graph;
    const edges = Object.values(data.adjacency).reduce(
      (sum, neighbors) => sum + Object.keys(neighbors).length,
      0,
    );
    if (edges + (directed ? 1 : 2) > LIMITS.edges)
      throw new Error('Use fewer graph connections.');
    data.adjacency[source][action.nodeId] = 1;
    if (!directed) data.adjacency[action.nodeId][source] = 1;
  } else return graph;
  return data;
}
