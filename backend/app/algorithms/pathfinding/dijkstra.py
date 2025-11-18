from typing import Dict, Any, Generator, List, Tuple
from ...base_algorithm import BaseAlgorithm
import heapq

class Dijkstra(BaseAlgorithm):
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
        "description": "Dijkstra's algorithm finds the shortest path between nodes. It supports both Grids (weighted tiles) and Network Graphs (weighted edges).",
        "complexity": { "time": "O(V + E log V)", "space": "O(V)" },
        "pros": ["Guarantees shortest path.", "Handles weighted edges/nodes."],
        "cons": ["Slower than BFS on unweighted graphs.", "Can be computationally expensive on dense graphs."]
    }

    def __init__(self, data: Any):
        super().__init__(data)
        self.mode = "grid"
        
        # Detect Input Type
        if "adjacency" in data:
            # --- GRAPH MODE ---
            self.mode = "graph"
            self.adjacency = data["adjacency"] # Dict[NodeID, Dict[NeighborID, Weight]]
            self.start = data["start"]         # String ID
            self.end = data["end"]             # String ID
            self.nodes = data.get("nodes", {}) # Metadata for viz (x,y coords)
        else:
            # --- GRID MODE ---
            self.mode = "grid"
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

    def get_neighbors(self, node) -> List[Tuple[Any, int]]:
        """
        Returns a list of (neighbor, weight) tuples.
        Abstracts away the difference between Grid and Graph.
        """
        neighbors = []
        
        if self.mode == "graph":
            # Graph Mode: Neighbors are in the adjacency list
            if node in self.adjacency:
                for neighbor_id, weight in self.adjacency[node].items():
                    neighbors.append((neighbor_id, weight))
        
        else:
            # Grid Mode: Calculate 4-directional neighbors
            r, c = node
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < self.rows and 0 <= nc < self.cols:
                    cell_val = self.grid[nr][nc]
                    # 1 = Wall (Skip)
                    if cell_val == 1: continue
                    # 0 = Path (Cost 1), 5 = Weight (Cost 5)
                    move_cost = 5 if cell_val == 5 else 1
                    neighbors.append(((nr, nc), move_cost))
                    
        return neighbors

    def get_snapshot(self, visited, path):
        if self.mode == "graph":
            return { 
                "type": "graph",
                "visited": list(visited), 
                "path": list(path) 
            }
        else:
            return { 
                "type": "grid",
                "visited": list(visited), 
                "path": list(path), 
                "grid": self.grid 
            }

    def run(self) -> Generator[Dict[str, Any], None, None]:
        # Validate start
        if self.mode == "grid" and not self.grid: return
        if self.mode == "graph" and not self.adjacency: return

        pq = [(0, self.start)] # (distance, node_id)
        distances = {self.start: 0} # Track distances for all nodes
        previous_nodes = {}
        visited = set()

        yield { 
            "type": "info", 
            "payload": {"node": self.start}, 
            "snapshot": self.get_snapshot(visited, []), 
            "message": f"Starting Dijkstra at {self.start}", 
            "line": 1 
        }

        while pq:
            dist, curr = heapq.heappop(pq)
            
            if curr in visited: continue
            visited.add(curr)
            
            yield { 
                "type": "visit_node", 
                "payload": {"node": curr}, 
                "snapshot": self.get_snapshot(visited, []), 
                "message": f"Visiting {curr} (Dist: {dist})", 
                "line": 9 
            }
            
            if curr == self.end:
                path = []
                temp = curr
                while temp in previous_nodes:
                    path.append(temp)
                    temp = previous_nodes[temp]
                path.append(self.start)
                path.reverse()
                
                yield { 
                    "type": "found_path", 
                    "payload": {"path": path}, 
                    "snapshot": self.get_snapshot(visited, path), 
                    "message": f"Path Found! Total Cost: {dist}", 
                    "line": 16 
                }
                return

            # Polymorphic Neighbor Fetching
            for neighbor, weight in self.get_neighbors(curr):
                if neighbor in visited: continue
                
                new_dist = dist + weight
                
                # If found a shorter path to this neighbor (or first time seeing it)
                if new_dist < distances.get(neighbor, float('inf')):
                    distances[neighbor] = new_dist
                    previous_nodes[neighbor] = curr
                    heapq.heappush(pq, (new_dist, neighbor))
                    
                    yield { 
                        "type": "update_neighbor", 
                        "payload": {"node": neighbor, "distance": new_dist}, 
                        "snapshot": self.get_snapshot(visited, []), 
                        "message": f"Updating {neighbor} to Dist {new_dist}", 
                        "line": 14 
                    }

        yield { "type": "info", "payload": {}, "snapshot": self.get_snapshot(visited, []), "message": "No path found.", "line": 16 }