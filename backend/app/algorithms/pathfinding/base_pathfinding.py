from typing import Any, List, Tuple
from app.base_algorithm import BaseAlgorithm
from app.validation import validate_pathfinding, WEIGHT_TILE


class BasePathfindingAlgorithm(BaseAlgorithm):
    """
    Abstract base class for pathfinding algorithms to share common logic.
    Supports both Grid and Graph modes.
    """

    def __init__(self, data: Any):
        data = validate_pathfinding(data)
        super().__init__(data)
        self.mode = data["kind"]
        if self.mode == "graph":
            self.adjacency = data["adjacency"]
            self.start, self.end = data["start"], data["end"]
            self.nodes = data["nodes"]
        else:
            self.grid = data["grid"]
            self.start = (data["start"]["row"], data["start"]["col"])
            self.end = (data["end"]["row"], data["end"]["col"])
            self.rows, self.cols = len(self.grid), len(self.grid[0])

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
                    if cell_val == 1:
                        continue  # Wall
                    # 5 = Weight tile, default cost is 1
                    move_cost = WEIGHT_TILE if cell_val == WEIGHT_TILE else 1
                    neighbors.append(((nr, nc), move_cost))

        return neighbors

    def get_snapshot(self, visited, path):
        """Standardized snapshot format for pathfinding visualizers."""
        if self.mode == "graph":
            return {"type": "graph", "visited": list(visited), "path": list(path)}
        else:
            return {
                "type": "grid",
                "visited": list(visited),
                "path": list(path),
                "grid": self.grid,
            }
