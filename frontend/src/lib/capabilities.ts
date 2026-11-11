import { LIMITS } from './input';
const CLIENT_CAPS = { ...LIMITS };
const fields = {
  array: 'max_array_size',
  rows: 'max_grid_rows',
  cols: 'max_grid_cols',
  nodes: 'max_graph_nodes',
  edges: 'max_graph_edges',
  steps: 'max_steps',
  bytes: 'max_trace_bytes',
} as const;

/** Servers may lower supported budgets; never raise this client's memory caps. */
export function applyCapabilities(value: unknown): void {
  if (
    !value ||
    typeof value !== 'object' ||
    !('limits' in value) ||
    !value.limits ||
    typeof value.limits !== 'object'
  )
    throw new Error('Invalid server capabilities.');
  const limits = value.limits as Record<string, unknown>;
  const next = { ...LIMITS };
  for (const [key, field] of Object.entries(fields)) {
    const limit = limits[field];
    if (typeof limit !== 'number' || !Number.isSafeInteger(limit) || limit < 1)
      throw new Error('Invalid server work limit.');
    next[key as keyof typeof LIMITS] = Math.min(
      CLIENT_CAPS[key as keyof typeof LIMITS],
      limit,
    );
  }
  Object.assign(LIMITS, next);
}
