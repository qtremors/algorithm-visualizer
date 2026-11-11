"""Bellman–Ford with explicit reachable-negative-cycle outcomes."""

import math
from app.algorithms.pathfinding.base_pathfinding import BasePathfindingAlgorithm
from app.registry import registry


@registry.register("pathfinding", "bellman_ford")
class BellmanFord(BasePathfindingAlgorithm):
    supports_negative = True
    metadata = {
        "name": "Bellman–Ford", "input_type": "graph_grid", "visualizer": "grid_2d",
        "pseudocode": [
            "procedure BellmanFord(G, start, goal)",
            "  distance[start] := 0; other distances := infinity",
            "  repeat at most |V| - 1 times",
            "    changed := false",
            "    for each edge (u, v, weight) reachable from start",
            "      if distance[u] + weight < distance[v]",
            "        distance[v] := distance[u] + weight; parent[v] := u",
            "        changed := true",
            "    if not changed: break",
            "  if a reachable edge can improve: report negative_cycle",
            "  if goal is reachable: return reconstruct_path(goal)",
            "  return no_path",
        ],
        "description": "Relax every edge repeatedly; support negative edges and detect cycles reachable from the start with negative total cost.",
        "complexity": {"time": "O(VE)", "space": "O(V + E)"},
        "pros": ["Supports negative edge weights.", "Detects reachable negative cycles."],
        "cons": ["Slower than Dijkstra on nonnegative inputs.", "Reports a reachable negative cycle even when a separate route to the goal exists."],
        "supports_negative": True,
    }

    def run(self):
        nodes = list(self.adjacency) if self.mode == "graph" else [
            (r, c) for r in range(self.rows) for c in range(self.cols) if self.grid[r][c] != 1
        ]
        edges = [(u, v, weight) for u in nodes for v, weight in self.get_neighbors(u)]
        distances = {self.start: 0}
        parent = {}
        visited = {self.start}
        yield self.step("info", visited, [], "Starting Bellman–Ford...", 2)
        for iteration in range(max(0, len(nodes) - 1)):
            changed = False
            for u, v, weight in edges:
                if u not in distances:
                    continue
                candidate = distances[u] + weight
                if candidate < distances.get(v, math.inf):
                    distances[v] = candidate
                    parent[v] = u
                    visited.add(v)
                    changed = True
                    yield self.step("relax_edge", visited, [], f"Pass {iteration + 1}: improve {v} to {candidate}", 7,
                                    **{"from": u, "to": v, "dist": candidate}, distances=distances, parents=parent)
            if not changed:
                break
        for u, v, weight in edges:
            if u in distances and distances[u] + weight < distances.get(v, math.inf):
                yield self.step("negative_cycle", visited, [], "Reachable negative cycle detected. A finite shortest-path result is unavailable.", 10)
                return
        if self.end in distances:
            path = self.reconstruct(parent, self.end)
            yield self.step("found_path", visited, path, f"Shortest path found! Distance: {distances[self.end]}", 11,
                            path=path, dist=distances[self.end], distances=distances, parents=parent)
        else:
            yield self.step("info", visited, [], "No path found.", 12)
