import type { GraphInputData } from '../types/input';
export function graphEdges(data: GraphInputData, path: string[] = []) {
  const pathEdges = new Set(
    path.slice(1).map((node, i) => JSON.stringify([path[i], node])),
  );
  return Object.entries(data.adjacency).flatMap(([source, neighbors]) =>
    Object.entries(neighbors).flatMap(([target, weight]) => {
      if (!data.nodes[source] || !data.nodes[target]) return [];
      const undirected =
        Object.hasOwn(data.adjacency[target] || {}, source) &&
        data.adjacency[target][source] === weight;
      if (undirected && source.localeCompare(target) > 0) return [];
      return [
        {
          source,
          target,
          weight,
          directed: !undirected,
          isPath:
            pathEdges.has(JSON.stringify([source, target])) ||
            (undirected && pathEdges.has(JSON.stringify([target, source]))),
        },
      ];
    }),
  );
}
export function svgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  const point = new DOMPoint(clientX, clientY).matrixTransform(
    matrix.inverse(),
  );
  if (point.x < 0 || point.y < 0 || point.x > 1000 || point.y > 720)
    return null;
  return { x: point.x, y: point.y };
}
