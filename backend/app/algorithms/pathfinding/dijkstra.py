from typing import Dict, Any, Generator, List, Tuple
import heapq
from app.algorithms.pathfinding.base_pathfinding import BasePathfindingAlgorithm

class Dijkstra(BasePathfindingAlgorithm):
    metadata = {
        "name": "Dijkstra's Algorithm",
        "pseudocode": [
            "procedure Dijkstra(G, s)",
            "  for each vertex v in G",
            "    dist[v] := infinity",
            "    prev[v] := undefined",
            "  dist[s] := 0",
            "  PQ := {s}",
            "  while PQ is not empty",
            "    u := PQ.extract_min()",
            "    for each neighbor v of u",
            "      alt := dist[u] + weight(u, v)",
            "      if alt < dist[v]",
            "        dist[v] := alt",
            "        prev[v] := u",
            "        PQ.push(v, alt)",
            "      end if",
            "    end for",
            "  end while",
            "end procedure"
        ],
        "input_type": "graph_grid",
        "visualizer": "grid_2d",
        "description": "Dijkstra's algorithm finds the shortest path between nodes in a graph.",
        "complexity": { "time": "O((V+E) log V)", "space": "O(V)" },
        "pros": ["Always finds shortest path.", "Works with weighted graphs."],
        "cons": ["Slower than BFS/DFS.", "Doesn't work with negative weights."]
    }

    def run(self) -> Generator[Dict[str, Any], None, None]:
        # Validation is handled by BasePathfindingAlgorithm.__init__
        pq = [(0, self.start)] # (distance, node_id)
        distances = {self.start: 0} # Track distances for all nodes
        came_from = {}
        visited = set()
        
        yield { "type": "info", "payload": {}, "snapshot": self.get_snapshot(visited, []), "message": "Starting Dijkstra...", "line": 5 }

        while pq:
            curr_dist, curr_node = heapq.heappop(pq)

            if curr_node in visited: continue
            visited.add(curr_node)
            
            yield { "type": "visit_node", "payload": {"node": curr_node, "dist": curr_dist}, "snapshot": self.get_snapshot(visited, []), "message": f"Processing {curr_node} (dist: {curr_dist})", "line": 8 }

            if curr_node == self.end:
                path = []
                temp = curr_node
                while temp in came_from:
                    path.append(temp)
                    temp = came_from[temp]
                path.append(self.start)
                path.reverse()
                yield { "type": "found_path", "payload": {"path": path, "dist": curr_dist}, "snapshot": self.get_snapshot(visited, path), "message": f"Shortest path found! Distance: {curr_dist}", "line": 18 }
                return

            for neighbor, weight in self.get_neighbors(curr_node):
                if neighbor in visited: continue
                
                new_dist = curr_dist + weight
                if neighbor not in distances or new_dist < distances[neighbor]:
                    distances[neighbor] = new_dist
                    came_from[neighbor] = curr_node
                    heapq.heappush(pq, (new_dist, neighbor))
                    
                    yield { "type": "relax_edge", "payload": {"from": curr_node, "to": neighbor, "dist": new_dist}, "snapshot": self.get_snapshot(visited, []), "message": f"Relaxing {neighbor} (new dist: {new_dist})", "line": 14 }

        yield { "type": "info", "payload": {}, "snapshot": self.get_snapshot(visited, []), "message": "No path found.", "line": 16 }