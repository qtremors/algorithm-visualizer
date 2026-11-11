"""A* with admissible grid heuristics and zero heuristic for arbitrary graphs."""

import heapq
import math
from app.algorithms.pathfinding.base_pathfinding import BasePathfindingAlgorithm
from app.registry import registry


@registry.register("pathfinding", "astar")
class AStar(BasePathfindingAlgorithm):
    metadata = {
        "name": "A* Search", "input_type": "graph_grid", "visualizer": "grid_2d",
        "pseudocode": [
            "procedure AStar(G, start, goal)",
            "  g[start] := 0; push start with priority h(start)",
            "  while priority queue is not empty",
            "    u := extract minimum g + h; skip stale entries",
            "    if u = goal: return reconstruct_path(u)",
            "    for each edge (u, v, weight)",
            "      candidate := g[u] + weight",
            "      if candidate < g[v]",
            "        g[v] := candidate; parent[v] := u",
            "        push v with priority g[v] + h(v)",
            "  return no_path",
        ],
        "description": "Use an admissible estimate of remaining distance to direct a minimum-cost search toward the goal.",
        "complexity": {"time": "O((V + E) log V)", "space": "O(V + E)"},
        "pros": ["Can explore fewer grid cells than Dijkstra.", "Zero heuristic behaves like Dijkstra."],
        "cons": ["Requires an admissible heuristic for optimality.", "Arbitrary graph coordinates do not imply edge costs."],
        "heuristics": ["manhattan", "euclidean", "zero"],
    }

    def __init__(self, data):
        super().__init__(data)
        self.heuristic = data.get("heuristic", "manhattan" if self.mode == "grid" else "zero")
        if self.heuristic not in self.metadata["heuristics"]:
            raise ValueError("Choose manhattan, euclidean, or zero as the heuristic.")
        if self.mode == "graph" and self.heuristic != "zero":
            raise ValueError("Arbitrary graphs require the zero heuristic to preserve optimality.")

    def estimate(self, node):
        if self.heuristic == "zero":
            return 0
        dr, dc = abs(node[0] - self.end[0]), abs(node[1] - self.end[1])
        return dr + dc if self.heuristic == "manhattan" else math.hypot(dr, dc)

    def run(self):
        distances = {self.start: 0}
        parent = {}
        visited = set()
        queue = [(self.estimate(self.start), 0, self.start)]
        yield self.step("info", visited, [], "Starting A*...", 2, frontier=[self.start])
        while queue:
            _, distance, node = heapq.heappop(queue)
            if node in visited or distance != distances.get(node):
                continue
            visited.add(node)
            yield self.step("visit_node", visited, [], f"Processing {node}, cost {distance}", 4, node=node, dist=distance,
                            frontier=[entry[2] for entry in queue], distances=distances, parents=parent)
            if node == self.end:
                path = self.reconstruct(parent, node)
                yield self.step("found_path", visited, path, f"Shortest path found! Distance: {distance}", 5, path=path, dist=distance)
                return
            for neighbor, weight in self.get_neighbors(node):
                candidate = distance + weight
                if candidate < distances.get(neighbor, math.inf):
                    distances[neighbor] = candidate
                    parent[neighbor] = node
                    heapq.heappush(queue, (candidate + self.estimate(neighbor), candidate, neighbor))
                    yield self.step("relax_edge", visited, [], f"Improve {neighbor} to {candidate}", 10,
                                    **{"from": node, "to": neighbor, "dist": candidate}, distances=distances, parents=parent)
        yield self.step("info", visited, [], "No path found.", 11)
