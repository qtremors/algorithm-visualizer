from typing import Dict, Any, Generator, List
from app.algorithms.pathfinding.base_pathfinding import BasePathfindingAlgorithm
from app.registry import registry

@registry.register("pathfinding", "dfs")
class DFS(BasePathfindingAlgorithm):
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

    def run(self) -> Generator[Dict[str, Any], None, None]:
        # Validation handled by base class
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

            for neighbor, _ in self.get_neighbors(curr):
                if neighbor not in processed and neighbor not in visited:
                    visited.add(neighbor)
                    came_from[neighbor] = curr
                    stack.append(neighbor)
                    yield { "type": "visit_node", "payload": {"node": neighbor}, "snapshot": self.get_snapshot(processed, []), "message": f"Pushing {neighbor}", "line": 6 }

        yield { "type": "info", "payload": {}, "snapshot": self.get_snapshot(processed, []), "message": "No path found.", "line": 9 }