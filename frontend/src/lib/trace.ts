import type { AlgorithmStep, NodeId } from '../types';

type Delta = { added: NodeId[]; removed: NodeId[] };
const key = (node: NodeId) => JSON.stringify(node);

/** Keep one shared checkpoint per block, reconstruct only the displayed frame. */
export class TraceDecoder {
  private base: NodeId[] | null = null;
  private pending: Delta[] = [];
  private sequence = 0;
  private kind: string | null = null;

  decode(step: AlgorithmStep): AlgorithmStep {
    const snapshot = step.snapshot;
    if (
      Array.isArray(snapshot) ||
      snapshot.type === 'tree' ||
      !('added' in snapshot)
    )
      return step;
    const delta = snapshot as typeof snapshot & Delta;
    if (step.sequence !== this.sequence++)
      throw new Error('Missing or reordered visualization frame.');
    if (this.kind && this.kind !== snapshot.type)
      throw new Error('The visualization changed type.');
    this.kind = snapshot.type;
    if (Array.isArray(snapshot.visited)) {
      this.base = snapshot.visited;
      this.pending = [];
    } else {
      if (!this.base) throw new Error('Missing visualization checkpoint.');
      this.pending = [
        ...this.pending,
        { added: delta.added, removed: delta.removed },
      ];
      if (this.pending.length >= 128)
        throw new Error('Missing periodic visualization checkpoint.');
    }
    const base = this.base;
    const changes = this.pending;
    const result = { type: snapshot.type, path: snapshot.path };
    Object.defineProperty(result, 'visited', {
      enumerable: true,
      get() {
        const nodes = new Map(base?.map((node) => [key(node), node]));
        for (const change of changes) {
          for (const node of change.removed) nodes.delete(key(node));
          for (const node of change.added) nodes.set(key(node), node);
        }
        // A caller can mutate its own array without corrupting earlier frames.
        return [...nodes.values()];
      },
    });
    return { ...step, snapshot: result as AlgorithmStep['snapshot'] };
  }
}
