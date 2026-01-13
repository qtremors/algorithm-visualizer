from typing import Dict, Any, Generator, List, Tuple
from app.base_algorithm import BaseAlgorithm

class BasePathfindingAlgorithm(BaseAlgorithm):
    """
    Abstract base class for pathfinding algorithms to share common logic.
    Supports both Grid and Graph modes.
    """
    def __init__(self, data: Any):
        if not isinstance(data, dict):
            raise ValueError("Input data must be a dictionary.")
            
        super().__init__(data)
        self.mode = "grid"
        
        # Detect Input Type
        if "adjacency" in data:
            # --- GRAPH MODE ---
            self.mode = "graph"
            required_fields = ["adjacency", "start", "end"]
            for field in required_fields:
                if field not in data:
                    raise ValueError(f"Missing required field '{field}' for graph mode.")
            
            self.adjacency = data["adjacency"]
            self.start = data["start"]
            self.end = data["end"]
            self.nodes = data.get("nodes", {})
        else:
            # --- GRID MODE ---
            self.mode = "grid"
            required_fields = ["grid", "start", "end"]
            for field in required_fields:
                if field not in data:
                    raise ValueError(f"Missing required field '{field}' for grid mode.")
            
            self.grid = data["grid"]
            try:
                self.start = (data["start"]["row"], data["start"]["col"])
                self.end = (data["end"]["row"], data["end"]["col"])
            except (KeyError, TypeError):
                raise ValueError("Invalid start/end format for grid mode. Expected {row: int, col: int}")
                
            self.rows = len(self.grid)
            self.cols = len(self.grid[0]) if self.rows > 0 else 0

    def get_neighbors(self, node) -> List[Tuple[Any, int]]:
        """
        Returns a list of (neighbor, weight) tuples.
        Abstracts away the difference between Grid and Graph.
        Note: BFS/DFS might only need the neighbor ID, but Dijkstra needs weight.
        """
        neighbors = []
        
        if self.mode == "graph":
            if node in self.adjacency:
                for neighbor_id, weight in self.adjacency[node].items():
                    neighbors.append((neighbor_id, weight))
        else:
            r, c = node
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < self.rows and 0 <= nc < self.cols:
                    cell_val = self.grid[nr][nc]
                    if cell_val == 1: continue # Wall
                    # 5 = Weight tile, default cost is 1
                    move_cost = 5 if cell_val == 5 else 1
                    neighbors.append(((nr, nc), move_cost))
                    
        return neighbors

    def get_snapshot(self, visited, path):
        """Standardized snapshot format for pathfinding visualizers."""
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
