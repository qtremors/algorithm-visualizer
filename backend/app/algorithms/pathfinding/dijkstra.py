from typing import Dict, Any, Generator
from ...base_algorithm import BaseAlgorithm
import heapq

class Dijkstra(BaseAlgorithm):
    """
    Implements Dijkstra's algorithm for visualization on a grid.
    """

    # --- Metadata ---
    metadata = {
        "name": "Dijkstra's Algorithm",
        "pseudocode": [
            "function Dijkstra(Graph, source):",
            "  create vertex set Q",
            "  for each vertex v in Graph:",
            "    dist[v] = INFINITY",
            "    prev[v] = UNDEFINED",
            "    add v to Q",
            "  dist[source] = 0",
            "  while Q is not empty:",
            "    u = vertex in Q with min dist[u]",
            "    remove u from Q",
            "    for each neighbor v of u:",
            "      alt = dist[u] + length(u, v)",
            "      if alt < dist[v]:",
            "        dist[v] = alt",
            "        prev[v] = u",
            "  return dist[], prev[]"
        ],
        "input_type": "graph_grid",
        "visualizer": "grid_2d",
        "description": "Dijkstra's algorithm is a popular search algorithm used to find the shortest path between nodes in a graph.",
        "complexity": {
            "time": "O(V + E log V)",
            "space": "O(V)"
        },
        "pros": [
            "Guarantees the shortest path.",
            "Widely used in routing protocols."
        ],
        "cons": [
            "Slower than BFS for unweighted graphs.",
            "Does not work with negative edge weights."
        ]
    }

    def __init__(self, data: Any):
        if not isinstance(data, dict) or "grid" not in data:
             # Fallback for initial empty state if needed, or raise error
             pass
             
        super().__init__(data)
        # specific init logic
        if data and "grid" in data:
            self.grid = data["grid"]
            self.start = (data["start"]["row"], data["start"]["col"])
            self.end = (data["end"]["row"], data["end"]["col"])
            self.rows = len(self.grid)
            self.cols = len(self.grid[0]) if self.rows > 0 else 0
        else:
            self.grid = []
            self.rows = 0
            self.cols = 0

    def run(self) -> Generator[Dict[str, Any], None, None]:
        if not self.grid:
            return

        # A simple snapshot representation for a grid
        def get_snapshot(visited_nodes, path_nodes):
            return { "visited": list(visited_nodes), "path": list(path_nodes), "grid": self.grid }

        pq = [(0, self.start[0], self.start[1])]
        distances = { (r, c): float('inf') for r in range(self.rows) for c in range(self.cols) }
        distances[self.start] = 0
        previous_nodes = {}
        visited = set()

        yield {
            "type": "info", "payload": {"node": self.start}, "snapshot": get_snapshot(visited, []),
            "message": f"Starting Dijkstra at {self.start}", "line": 1
        }

        while pq:
            dist, r, c = heapq.heappop(pq)
            
            if (r, c) in visited:
                continue
            
            visited.add((r,c))
            
            yield {
                "type": "visit_node",
                "payload": {"node": (r, c)},
                "snapshot": get_snapshot(visited, []),
                "message": f"Visiting node ({r}, {c}) with distance {dist}",
                "line": 9
            }
            
            if (r, c) == self.end:
                path = []
                curr = self.end
                while curr in previous_nodes:
                    path.append(curr)
                    curr = previous_nodes[curr]
                path.append(self.start)
                path.reverse()
                
                yield {
                    "type": "found_path",
                    "payload": {"path": path},
                    "snapshot": get_snapshot(visited, path),
                    "message": f"Found path with length {dist}!",
                    "line": 16
                }
                return

            neighbors = [(r-1, c), (r+1, c), (r, c-1), (r, c+1)]
            for nr, nc in neighbors:
                if 0 <= nr < self.rows and 0 <= nc < self.cols and self.grid[nr][nc] == 0:
                    if (nr, nc) not in visited:
                        new_dist = dist + 1
                        if new_dist < distances[(nr, nc)]:
                            distances[(nr, nc)] = new_dist
                            previous_nodes[(nr, nc)] = (r, c)
                            heapq.heappush(pq, (new_dist, nr, nc))
                            
                            yield {
                                "type": "update_neighbor",
                                "payload": {"node": (nr, nc), "distance": new_dist},
                                "snapshot": get_snapshot(visited, []),
                                "message": f"Updating neighbor ({nr}, {nc}) to distance {new_dist}",
                                "line": 14
                            }

        yield {
            "type": "info", "payload": {}, "snapshot": get_snapshot(visited, []),
            "message": "Path not found.", "line": 16
        }