import { useCallback, useState } from 'react';
import type {
  ConnectionLine,
  GraphInputData,
  GraphInteraction,
  GraphTool,
} from '../types/input';
import { changeWeight, editGraph } from '../lib/graphEditor';

export function useGraphEditor(
  graph: GraphInputData,
  busy: boolean,
  update: (data: GraphInputData) => void,
) {
  const [tool, setTool] = useState<GraphTool>('node');
  const [directed, setDirected] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [line, setLine] = useState<ConnectionLine | null>(null);
  const [edge, setEdge] = useState<{
    source: string;
    target: string;
    weight: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clearGesture = useCallback(() => {
    setSource(null);
    setLine(null);
  }, []);
  const interact = (action: GraphInteraction) => {
    if (action.type === 'connectCancel') {
      clearGesture();
      return;
    }
    if (busy) return;
    try {
      if (action.type === 'connectStart' && tool === 'edge')
        setSource(action.nodeId);
      else if (action.type === 'connectMove' && source && graph.nodes[source])
        setLine({ start: graph.nodes[source], end: action.point });
      else {
        const next = editGraph(graph, action, tool, directed, source);
        if (next !== graph) {
          update(next);
          setError(null);
        }
        if (action.type === 'connectEnd') clearGesture();
      }
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : 'Cannot edit graph.',
      );
      clearGesture();
    }
  };
  const weightClick = (source: string, target: string, weight: number) => {
    if (busy) return;
    if (tool === 'delete') update(changeWeight(graph, source, target, null));
    else setEdge({ source, target, weight });
  };
  const saveWeight = (weight: number) => {
    if (busy || !edge) return;
    try {
      update(changeWeight(graph, edge.source, edge.target, weight));
      setEdge(null);
      setError(null);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Invalid weight.');
    }
  };
  return {
    tool,
    directed,
    setDirected,
    source,
    line,
    edge,
    error,
    setError,
    clearGesture,
    interact,
    weightClick,
    saveWeight,
    closeWeight: () => setEdge(null),
    setTool: (next: GraphTool) => {
      clearGesture();
      setTool(next);
    },
  };
}
