from typing import Dict, Any, Generator
from ...base_algorithm import BaseAlgorithm

class DFS(BaseAlgorithm):
    """
    Implements Depth-First Search (DFS).
    """

    metadata = {
        "name": "Depth-First Search (DFS)",
        "pseudocode": [
            "procedure DFS(G, v)",
            "  label v as discovered",
            "  if v is goal then return true",
            "  for all directed edges from v to w that are in G.adjacentEdges(v) do",
            "    if vertex w is not labeled as discovered then",
            "      recursively call DFS(G, w)",
            "    end if",
            "  end for",
            "end procedure"
        ],
        "input_type": "graph_grid",
        "visualizer": "grid_2d",
        "description": "DFS algorithm explores as far as possible along each branch before backtracking.",
        "complexity": {
            "time": "O(V + E)",
            "space": "O(V)"
        },
        "pros": [
            "Requires less memory than BFS.",
            "Can find a solution without exploring the whole search space."
        ],
        "cons": [
            "Does NOT guarantee the shortest path.",
            "Can get stuck in infinite loops if not careful (requires visited tracking)."
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
        stack = [self.start]
        visited = set() 
        processed = set() 
        came_from = {}
        
        def get_snapshot(current_processed, path_nodes):
            return { "visited": list(current_processed), "path": list(path_nodes), "grid": self.grid }

        yield { "type": "info", "payload": {}, "snapshot": get_snapshot(processed, []), "message": "Starting DFS...", "line": 1 }

        while stack:
            curr = stack.pop()
            if curr in processed: continue
            processed.add(curr)
            
            yield { "type": "visit_node", "payload": {"node": curr}, "snapshot": get_snapshot(processed, []), "message": f"Processing node {curr}", "line": 2 }

            if curr == self.end:
                path = []
                temp = curr
                while temp in came_from:
                    path.append(temp)
                    temp = came_from[temp]
                path.append(self.start)
                path.reverse()
                yield { "type": "found_path", "payload": {"path": path}, "snapshot": get_snapshot(processed, path), "message": "Target found!", "line": 3 }
                return

            # Order: Up, Left, Down, Right (Stack reverses this)
            for dr, dc in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
                nr, nc = curr[0] + dr, curr[1] + dc
                if 0 <= nr < self.rows and 0 <= nc < self.cols:
                    if (nr, nc) not in processed and (nr, nc) not in visited and self.grid[nr][nc] == 0:
                        visited.add((nr, nc)) 
                        came_from[(nr, nc)] = curr
                        stack.append((nr, nc))
                        yield { "type": "visit_node", "payload": {"node": (nr, nc)}, "snapshot": get_snapshot(processed, []), "message": f"Pushing neighbor {(nr, nc)}", "line": 6 }

        yield { "type": "info", "payload": {}, "snapshot": get_snapshot(processed, []), "message": "No path found.", "line": 9 }