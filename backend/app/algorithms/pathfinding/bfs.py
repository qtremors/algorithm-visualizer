from typing import Dict, Any, Generator
from ...base_algorithm import BaseAlgorithm
from collections import deque

class BFS(BaseAlgorithm):
    """
    Implements Breadth-First Search (BFS) for unweighted grids.
    """

    metadata = {
        "name": "Breadth-First Search (BFS)",
        "pseudocode": [
            "procedure BFS(G, start_node)",
            "  let Q be a queue",
            "  Q.enqueue(start_node)",
            "  mark start_node as visited",
            "  while Q is not empty do",
            "    v = Q.dequeue()",
            "    if v is the goal then return v",
            "    for all neighbors w of v do",
            "      if w is not visited then",
            "        Q.enqueue(w)",
            "        mark w as visited",
            "      end if",
            "    end for",
            "  end while",
            "end procedure"
        ],
        "input_type": "graph_grid",
        "visualizer": "grid_2d",
        "description": "BFS works by exploring all the neighbor nodes at the present depth prior to moving on to the nodes at the next depth level.",
        "complexity": {
            "time": "O(V + E)",
            "space": "O(V)"
        },
        "pros": [
            "Guarantees the shortest path in unweighted graphs.",
            "Complete: Finds a solution if one exists."
        ],
        "cons": [
            "Requires more memory than DFS (stores all nodes at current level).",
            "Slower than heuristic searches (like A*) for pathfinding."
        ]
    }

    def __init__(self, data: Any):
        super().__init__(data)
        self.grid = data["grid"]
        self.start = (data["start"]["row"], data["start"]["col"])
        self.end = (data["end"]["row"], data["end"]["col"])
        self.rows = len(self.grid)
        self.cols = len(self.grid[0])

    def run(self) -> Generator[Dict[str, Any], None, None]:
        queue = deque([self.start])
        visited = {self.start}
        came_from = {} 
        
        def get_snapshot(current_visited, path_nodes):
            return { "visited": list(current_visited), "path": list(path_nodes), "grid": self.grid }

        yield { "type": "info", "payload": {}, "snapshot": get_snapshot(visited, []), "message": "Starting BFS...", "line": 2 }

        while queue:
            curr = queue.popleft()
            
            yield { "type": "visit_node", "payload": {"node": curr}, "snapshot": get_snapshot(visited, []), "message": f"Visiting node {curr}", "line": 6 }

            if curr == self.end:
                path = []
                temp = curr
                while temp in came_from:
                    path.append(temp)
                    temp = came_from[temp]
                path.append(self.start)
                path.reverse()
                yield { "type": "found_path", "payload": {"path": path}, "snapshot": get_snapshot(visited, path), "message": "Target found!", "line": 7 }
                return

            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = curr[0] + dr, curr[1] + dc
                if 0 <= nr < self.rows and 0 <= nc < self.cols:
                    if (nr, nc) not in visited and self.grid[nr][nc] == 0:
                        visited.add((nr, nc))
                        came_from[(nr, nc)] = curr
                        queue.append((nr, nc))
                        yield { "type": "visit_node", "payload": {"node": (nr, nc)}, "snapshot": get_snapshot(visited, []), "message": f"Queuing neighbor {(nr, nc)}", "line": 10 }

        yield { "type": "info", "payload": {}, "snapshot": get_snapshot(visited, []), "message": "No path found.", "line": 14 }