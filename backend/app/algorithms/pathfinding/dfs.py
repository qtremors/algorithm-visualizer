from typing import Dict, Any, Generator, List
from ...base_algorithm import BaseAlgorithm

class DFS(BaseAlgorithm):
    metadata = {
        "name": "Depth-First Search (DFS)",
        "pseudocode": [
            "procedure DFS(G, v)",
            "  label v as discovered",
            "  if v is goal then return true",
            "  for all neighbors w of v do",
            "    if w is not discovered then",
            "      recursively call DFS(G, w)",
            "    end if",
            "  end for",
            "end procedure"
        ],
        "input_type": "graph_grid",
        "visualizer": "grid_2d",
        "description": "DFS explores as far as possible along each branch before backtracking.",
        "complexity": { "time": "O(V + E)", "space": "O(V)" },
        "pros": ["Memory efficient.", "Good for maze solving."],
        "cons": ["Does not guarantee shortest path.", "Can get lost in deep paths."]
    }

    def __init__(self, data: Any):
        super().__init__(data)
        self.mode = "grid"
        if "adjacency" in data:
            self.mode = "graph"
            self.adjacency = data["adjacency"]
            self.start = data["start"]
            self.end = data["end"]
        else:
            self.mode = "grid"
            if data and "grid" in data:
                self.grid = data["grid"]
                self.start = (data["start"]["row"], data["start"]["col"])
                self.end = (data["end"]["row"], data["end"]["col"])
                self.rows = len(self.grid)
                self.cols = len(self.grid[0]) if self.rows > 0 else 0
            else:
                self.grid = []

    def get_neighbors(self, node) -> List[Any]:
        neighbors = []
        if self.mode == "graph":
            if node in self.adjacency:
                neighbors = list(self.adjacency[node].keys())
        else:
            r, c = node
            # Order: Up, Left, Down, Right (Stack reverses visual order)
            for dr, dc in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < self.rows and 0 <= nc < self.cols:
                    if self.grid[nr][nc] != 1:
                        neighbors.append((nr, nc))
        return neighbors

    def get_snapshot(self, processed, path):
        if self.mode == "graph":
            return { "type": "graph", "visited": list(processed), "path": list(path) }
        return { "type": "grid", "visited": list(processed), "path": list(path), "grid": self.grid }

    def run(self) -> Generator[Dict[str, Any], None, None]:
        if self.mode == "grid" and not self.grid: return
        if self.mode == "graph" and not self.adjacency: return

        stack = [self.start]
        visited = set()
        processed = set()
        came_from = {}
        
        yield { "type": "info", "payload": {}, "snapshot": self.get_snapshot(processed, []), "message": "Starting DFS...", "line": 1 }

        while stack:
            curr = stack.pop()
            if curr in processed: continue
            processed.add(curr)
            
            yield { "type": "visit_node", "payload": {"node": curr}, "snapshot": self.get_snapshot(processed, []), "message": f"Processing {curr}", "line": 2 }

            if curr == self.end:
                path = []
                temp = curr
                while temp in came_from:
                    path.append(temp)
                    temp = came_from[temp]
                path.append(self.start)
                path.reverse()
                yield { "type": "found_path", "payload": {"path": path}, "snapshot": self.get_snapshot(processed, path), "message": "Target found!", "line": 3 }
                return

            for neighbor in self.get_neighbors(curr):
                if neighbor not in processed and neighbor not in visited:
                    visited.add(neighbor)
                    came_from[neighbor] = curr
                    stack.append(neighbor)
                    yield { "type": "visit_node", "payload": {"node": neighbor}, "snapshot": self.get_snapshot(processed, []), "message": f"Pushing {neighbor}", "line": 6 }

        yield { "type": "info", "payload": {}, "snapshot": self.get_snapshot(processed, []), "message": "No path found.", "line": 9 }