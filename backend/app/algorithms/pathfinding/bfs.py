from typing import Dict, Any, Generator, List
from collections import deque
from app.algorithms.pathfinding.base_pathfinding import BasePathfindingAlgorithm
from app.registry import registry

@registry.register("pathfinding", "bfs")
class BFS(BasePathfindingAlgorithm):
    metadata = {
        "name": "Breadth-First Search (BFS)",
        "pseudocode": [
            "procedure BFS(G, start_v)",
            "  let Q be a queue",
            "  label start_v as visited",
            "  Q.enqueue(start_v)",
            "  while Q is not empty",
            "    v := Q.dequeue()",
            "    if v is goal then return v",
            "    for all edges from v to w in G.adjacentEdges(v) do",
            "      if w is not labeled as visited then",
            "        label w as visited",
            "        Q.enqueue(w)",
            "      end if",
            "  end while",
            "end procedure"
        ],
        "input_type": "graph_grid",
        "visualizer": "grid_2d",
        "description": "BFS explores all neighbor nodes at the present depth before moving to the next level.",
        "complexity": { "time": "O(V + E)", "space": "O(V)" },
        "pros": ["Guarantees shortest path on unweighted graphs.", "Simple to implement."],
        "cons": ["High memory usage (stores all nodes at depth).", "Doesn't work for weighted graphs."]
    }

    def run(self) -> Generator[Dict[str, Any], None, None]:
        # Validation handled by base class
        queue = deque([self.start])
        visited = {self.start}
        came_from = {}
        
        yield { "type": "info", "payload": {}, "snapshot": self.get_snapshot(visited, []), "message": "Starting BFS...", "line": 1 }

        while queue:
            curr = queue.popleft()
            
            yield { "type": "visit_node", "payload": {"node": curr}, "snapshot": self.get_snapshot(visited, []), "message": f"Processing {curr}", "line": 6 }

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

            for neighbor, _ in self.get_neighbors(curr):
                if neighbor not in visited:
                    visited.add(neighbor)
                    came_from[neighbor] = curr
                    queue.append(neighbor)
                    yield { "type": "visit_node", "payload": {"node": neighbor}, "snapshot": self.get_snapshot(visited, []), "message": f"Enqueuing {neighbor}", "line": 11 }

        yield { "type": "info", "payload": {}, "snapshot": self.get_snapshot(visited, []), "message": "No path found.", "line": 14 }