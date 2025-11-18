from typing import Dict, Any, Generator, List
from ...base_algorithm import BaseAlgorithm
from collections import deque

class BFS(BaseAlgorithm):
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
        "description": "BFS explores layer by layer. Great for unweighted grids or social network connections.",
        "complexity": { "time": "O(V + E)", "space": "O(V)" },
        "pros": ["Guarantees shortest path in unweighted graphs.", "Complete."],
        "cons": ["Does not consider edge weights.", "High memory usage on large graphs."]
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
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < self.rows and 0 <= nc < self.cols:
                    if self.grid[nr][nc] != 1: # 1 is Wall
                        neighbors.append((nr, nc))
        return neighbors

    def get_snapshot(self, visited, path):
        if self.mode == "graph":
            return { "type": "graph", "visited": list(visited), "path": list(path) }
        return { "type": "grid", "visited": list(visited), "path": list(path), "grid": self.grid }

    def run(self) -> Generator[Dict[str, Any], None, None]:
        if self.mode == "grid" and not self.grid: return
        if self.mode == "graph" and not self.adjacency: return

        queue = deque([self.start])
        visited = {self.start}
        came_from = {} 
        
        yield { "type": "info", "payload": {}, "snapshot": self.get_snapshot(visited, []), "message": "Starting BFS...", "line": 2 }

        while queue:
            curr = queue.popleft()
            
            yield { "type": "visit_node", "payload": {"node": curr}, "snapshot": self.get_snapshot(visited, []), "message": f"Visiting {curr}", "line": 6 }

            if curr == self.end:
                path = []
                temp = curr
                while temp in came_from:
                    path.append(temp)
                    temp = came_from[temp]
                path.append(self.start)
                path.reverse()
                yield { "type": "found_path", "payload": {"path": path}, "snapshot": self.get_snapshot(visited, path), "message": "Target found!", "line": 7 }
                return

            for neighbor in self.get_neighbors(curr):
                if neighbor not in visited:
                    visited.add(neighbor)
                    came_from[neighbor] = curr
                    queue.append(neighbor)
                    yield { "type": "visit_node", "payload": {"node": neighbor}, "snapshot": self.get_snapshot(visited, []), "message": f"Queuing {neighbor}", "line": 10 }

        yield { "type": "info", "payload": {}, "snapshot": self.get_snapshot(visited, []), "message": "No path found.", "line": 14 }