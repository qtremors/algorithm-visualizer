import type {
  GraphInputData,
  GridInputData,
  TreeInputData,
} from '../types/input';
import {
  createArray,
  createGraph,
  createGrid,
  createTree,
  LIMITS,
} from './input';

export const SESSION_KEY = 'algoviz.session.v1';
export const SESSION_BYTES = 65536;
const URL_BYTES = 90000;
export interface Session {
  version: 1;
  category: string;
  selection: string;
  view: 'grid' | 'graph';
  seed: string;
  drafts: {
    array: number[] | null;
    grid: GridInputData;
    graph: GraphInputData;
    tree: TreeInputData;
  };
}
export const defaultSession = (category = 'sorting'): Session => ({
  version: 1,
  category,
  selection: '',
  view: 'grid',
  seed: 'algoviz',
  drafts: {
    array: createArray(),
    grid: createGrid(),
    graph: createGraph(),
    tree: createTree(),
  },
});
const record = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const id = (v: string) =>
  /^[A-Za-z0-9_-]{1,64}$/.test(v) &&
  !['__proto__', 'prototype', 'constructor'].includes(v);
const integer = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;

export function validateGrid(value: unknown): asserts value is GridInputData {
  if (
    !record(value) ||
    value.kind !== 'grid' ||
    !Array.isArray(value.grid) ||
    !value.grid.length ||
    value.grid.length > LIMITS.rows
  )
    throw new Error('Invalid session grid.');
  const grid = value.grid;
  const cols = Array.isArray(grid[0]) ? grid[0].length : 0;
  if (
    !cols ||
    cols > LIMITS.cols ||
    !grid.every(
      (row) =>
        Array.isArray(row) &&
        row.length === cols &&
        row.every((cell) => [0, 1, 5].includes(cell)),
    )
  )
    throw new Error(
      'Grid must be rectangular with open, wall, or weight cells.',
    );
  for (const name of ['start', 'end']) {
    const point = value[name];
    if (
      !record(point) ||
      !integer(point.row, 0, grid.length - 1) ||
      !integer(point.col, 0, cols - 1) ||
      grid[point.row][point.col] === 1
    )
      throw new Error('Grid endpoints must be inside open cells.');
  }
}

export function validateGraph(value: unknown): asserts value is GraphInputData {
  if (
    !record(value) ||
    value.kind !== 'graph' ||
    !record(value.nodes) ||
    !record(value.adjacency)
  )
    throw new Error('Invalid session graph.');
  const nodes = value.nodes;
  const adjacency = value.adjacency;
  const ids = Object.keys(nodes);
  if (
    ids.length > LIMITS.nodes ||
    ids.some((node) => !id(node)) ||
    Object.keys(adjacency).length !== ids.length
  )
    throw new Error('Graph node IDs or count are invalid.');
  let edges = 0;
  for (const node of ids) {
    const point = nodes[node];
    if (
      !record(point) ||
      !['x', 'y'].every(
        (axis) =>
          typeof point[axis] === 'number' &&
          Number.isFinite(point[axis]) &&
          Number(point[axis]) >= 0 &&
          Number(point[axis]) <= 10000,
      )
    )
      throw new Error('Graph coordinates must be finite and bounded.');
    const neighbors = adjacency[node];
    if (!record(neighbors))
      throw new Error('Each node needs an adjacency entry.');
    for (const [target, weight] of Object.entries(neighbors)) {
      if (
        !Object.hasOwn(nodes, target) ||
        typeof weight !== 'number' ||
        !Number.isFinite(weight) ||
        Math.abs(weight) > 1000000
      )
        throw new Error(
          'Graph edges must reference existing nodes and finite weights.',
        );
      edges++;
    }
  }
  if (edges > LIMITS.edges) throw new Error('Too many graph edges.');
  for (const name of ['start', 'end'])
    if (
      value[name] !== undefined &&
      (typeof value[name] !== 'string' ||
        !Object.hasOwn(nodes, value[name] as string))
    )
      throw new Error('Graph endpoints must reference existing nodes.');
}

export function parseSession(text: string): Session {
  if (new TextEncoder().encode(text).length > SESSION_BYTES)
    throw new Error('Session exceeds 64 KiB.');
  const value: unknown = JSON.parse(text);
  if (!record(value) || value.version !== 1)
    throw new Error('Unsupported session version.');
  if (
    !['sorting', 'pathfinding', 'trees'].includes(String(value.category)) ||
    typeof value.selection !== 'string' ||
    value.selection.length > 64 ||
    !['grid', 'graph'].includes(String(value.view)) ||
    typeof value.seed !== 'string' ||
    value.seed.length > 128 ||
    !record(value.drafts)
  )
    throw new Error('Invalid session settings.');
  const array = value.drafts.array;
  if (
    array !== null &&
    (!Array.isArray(array) ||
      !array.length ||
      array.length > LIMITS.array ||
      !array.every(Number.isSafeInteger))
  )
    throw new Error('Invalid session array.');
  validateGrid(value.drafts.grid);
  validateGraph(value.drafts.graph);
  const tree = value.drafts.tree || createTree();
  validateTree(tree);
  // Explicit construction discards unknown fields and prototype-like keys.
  return {
    version: 1,
    category: String(value.category),
    selection: value.selection,
    view: value.view as Session['view'],
    seed: value.seed,
    drafts: structuredClone({
      array: array as number[] | null,
      grid: value.drafts.grid,
      graph: value.drafts.graph,
      tree,
    }),
  };
}

export function serializeSession(session: Session): string {
  const text = JSON.stringify(session);
  parseSession(text);
  return text;
}
export function shareUrl(session: Session): string {
  const bytes = new TextEncoder().encode(serializeSession(session));
  const encoded = btoa(
    Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''),
  )
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
  const url = new URL(window.location.href);
  url.pathname = `/${session.category}`;
  url.search = '';
  url.hash = `session=${encoded}`;
  if (url.href.length > URL_BYTES)
    throw new Error(
      'Session is too large to share as a URL. Export a file instead.',
    );
  return url.href;
}
export function sessionFromUrl(hash: string): Session | null {
  if (!hash.startsWith('#session=')) return null;
  if (hash.length > URL_BYTES)
    throw new Error('Shared session URL is too large.');
  const binary = atob(hash.slice(9).replaceAll('-', '+').replaceAll('_', '/'));
  return parseSession(
    new TextDecoder('utf-8', { fatal: true }).decode(
      Uint8Array.from(binary, (char) => char.charCodeAt(0)),
    ),
  );
}
export function initialSession(category: string): {
  session: Session;
  notice: string | null;
} {
  try {
    const shared = sessionFromUrl(window.location.hash);
    const saved =
      shared ||
      (localStorage.getItem(SESSION_KEY)
        ? parseSession(localStorage.getItem(SESSION_KEY)!)
        : null);
    if (saved)
      return {
        session: {
          ...saved,
          category,
          selection: saved.category === category ? saved.selection : '',
        },
        notice: null,
      };
  } catch (error) {
    return {
      session: defaultSession(category),
      notice:
        error instanceof Error ? error.message : 'Cannot restore session.',
    };
  }
  return { session: defaultSession(category), notice: null };
}

export function parseSessionText(text: string): Session {
  if (/^https?:\/\//.test(text.trim())) {
    const url = new URL(text.trim());
    const session = sessionFromUrl(url.hash);
    if (!session) throw new Error('The link does not contain a session.');
    return session;
  }
  return parseSession(text);
}

export function validateTree(value: unknown): asserts value is TreeInputData {
  if (
    !record(value) ||
    value.kind !== 'tree' ||
    value.invalid === true ||
    !Array.isArray(value.values) ||
    value.values.length > 40 ||
    !value.values.every(Number.isSafeInteger) ||
    !Array.isArray(value.operations) ||
    value.operations.length > 40 ||
    !['inorder', 'preorder', 'postorder'].includes(String(value.traversal))
  )
    throw new Error(
      'Invalid tree input. Use at most 40 values and 40 operations.',
    );
  const ids = new Set(value.values);
  for (const op of value.operations) {
    if (
      !record(op) ||
      !['insert', 'delete', 'search'].includes(String(op.type)) ||
      !Number.isSafeInteger(op.value)
    )
      throw new Error('Invalid tree operation.');
    if (op.type === 'insert') ids.add(op.value);
  }
  if (ids.size > 50) throw new Error('Use at most 50 distinct tree values.');
}
