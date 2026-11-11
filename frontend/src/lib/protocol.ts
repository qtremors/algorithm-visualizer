import type {
  AlgorithmMetadata,
  AlgorithmsData,
  ServerMessage,
} from '../types';
import { LIMITS } from './input';

const record = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const texts = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === 'string');
const cell = (value: unknown) =>
  Array.isArray(value) &&
  value.length === 2 &&
  value.every((v) => Number.isInteger(v) && v >= 0 && v < 50);
const node = (value: unknown) =>
  (typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value)) ||
  cell(value);
function metadata(value: unknown): value is AlgorithmMetadata {
  return (
    record(value) &&
    typeof value.name === 'string' &&
    typeof value.description === 'string' &&
    texts(value.pseudocode) &&
    texts(value.pros) &&
    texts(value.cons) &&
    ['list[int]', 'graph_grid'].includes(String(value.input_type)) &&
    ['bar_chart', 'grid_2d'].includes(String(value.visualizer)) &&
    record(value.complexity) &&
    typeof value.complexity.time === 'string' &&
    typeof value.complexity.space === 'string'
  );
}
export function parseAlgorithms(value: unknown): AlgorithmsData {
  if (
    !record(value) ||
    !Object.keys(value).length ||
    !Object.values(value).every(
      (category) => record(category) && Object.values(category).every(metadata),
    )
  )
    throw new Error('The server returned invalid algorithm metadata.');
  return value as AlgorithmsData;
}
export function parseMessage(text: string): ServerMessage {
  const value: unknown = JSON.parse(text);
  if (!record(value)) throw new Error('Invalid visualization message.');
  if (
    value.type === 'complete' &&
    Number.isInteger(value.steps) &&
    Number(value.steps) >= 0 &&
    Number(value.steps) <= LIMITS.steps
  )
    return value as ServerMessage;
  if (
    value.type === 'error' &&
    typeof value.message === 'string' &&
    typeof value.code === 'string'
  )
    return value as ServerMessage;
  if (
    ![
      'info',
      'compare',
      'swap',
      'sorted',
      'visit_node',
      'relax_edge',
      'found_path',
    ].includes(String(value.type)) ||
    typeof value.message !== 'string' ||
    !Number.isInteger(value.line) ||
    Number(value.line) < 1 ||
    !record(value.payload)
  )
    throw new Error('Invalid visualization step.');
  const p = value.payload;
  if (
    p.indices !== undefined &&
    (!Array.isArray(p.indices) ||
      !p.indices.every(
        (v) => Number.isInteger(v) && v >= 0 && v < LIMITS.array,
      ))
  )
    throw new Error('Invalid sorting indices.');
  for (const key of ['node', 'from', 'to'])
    if (p[key] !== undefined && !node(p[key]))
      throw new Error('Invalid path node.');
  if (p.path !== undefined && (!Array.isArray(p.path) || !p.path.every(node)))
    throw new Error('Invalid path.');
  if (
    p.dist !== undefined &&
    (typeof p.dist !== 'number' || !Number.isFinite(p.dist) || p.dist < 0)
  )
    throw new Error('Invalid distance.');
  const s = value.snapshot;
  if (Array.isArray(s)) {
    if (s.length > LIMITS.array || !s.every(Number.isSafeInteger))
      throw new Error('Invalid sorting snapshot.');
  } else if (record(s) && (s.type === 'grid' || s.type === 'graph')) {
    const validNode =
      s.type === 'grid'
        ? cell
        : (v: unknown) => typeof v === 'string' && node(v);
    if (
      (!Array.isArray(s.visited) && !Array.isArray(s.added)) ||
      !Array.isArray(s.path) ||
      (Array.isArray(s.visited) && s.visited.length > 2500) ||
      s.path.length > 2500 ||
      (Array.isArray(s.visited) && !s.visited.every(validNode)) ||
      !s.path.every(validNode)
    )
      throw new Error('Invalid pathfinding snapshot.');
  } else throw new Error('Invalid visualization snapshot.');
  if (record(s) && s.added !== undefined) {
    const validNode = s.type === 'grid' ? cell : (v: unknown) => typeof v === 'string' && node(v);
    if (!Number.isSafeInteger(value.sequence) || Number(value.sequence) < 0 ||
        !Array.isArray(s.added) || !Array.isArray(s.removed) ||
        s.added.length > 2500 || s.removed.length > 2500 ||
        !s.added.every(validNode) || !s.removed.every(validNode))
      throw new Error('Invalid visualization delta.');
  }
  if (value.learning !== undefined) {
    if (!record(value.learning)) throw new Error('Invalid learning state.');
    const learning = value.learning;
    if (learning.frontier !== undefined &&
        (!Array.isArray(learning.frontier) || learning.frontier.length > 80 || !learning.frontier.every(node)))
      throw new Error('Invalid frontier.');
    if (learning.frontier_count !== undefined &&
        (!Number.isSafeInteger(learning.frontier_count) || Number(learning.frontier_count) < 0))
      throw new Error('Invalid frontier count.');
    for (const field of ['distances', 'parents']) {
      if (learning[field] !== undefined && (!record(learning[field]) || Object.keys(learning[field]).length > 2500))
        throw new Error('Invalid learning table.');
    }
  }
  return value as unknown as ServerMessage;
}
