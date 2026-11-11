"""Iterator stack DFS: enter one child at a time, exactly as recursive DFS."""

from app.algorithms.pathfinding.base_pathfinding import BasePathfindingAlgorithm
from app.registry import registry


@registry.register("pathfinding", "dfs")
class DFS(BasePathfindingAlgorithm):
    metadata = {
        "name": "Depth-First Search (DFS)",
        "pseudocode": [
            "procedure DFS(G, start, goal)",
            "  discover start; push (start, neighbors(start))",
            "  while stack is not empty",
            "    u, remaining := stack.top",
            "    if u = goal: return reconstruct_path(u)",
            "    if remaining is empty: pop stack; continue",
            "    v := next remaining neighbor",
            "    if v is undiscovered",
            "      discover v; parent[v] := u",
            "      push (v, neighbors(v))",
            "  return no_path",
        ],
        "input_type": "graph_grid",
        "visualizer": "grid_2d",
        "description": "Descend through one unvisited neighbor at a time, then backtrack when a branch is exhausted.",
        "complexity": {"time": "O(V + E)", "space": "O(V)"},
        "pros": ["Explores deep branches directly.", "Avoids Python recursion limits."],
        "cons": ["Does not minimize hops or weighted cost.", "Neighbor order affects the result."],
    }

    def run(self):
        visited = {self.start}
        parent = {}
        stack = [(self.start, iter(self.get_neighbors(self.start)))]
        yield self.step("info", visited, [], "Starting DFS...", 2, frontier=[self.start])
        yield self.step("visit_node", visited, [], f"Processing {self.start}", 4, node=self.start)
        while stack:
            node, neighbors = stack[-1]
            if node == self.end:
                path = self.reconstruct(parent, node)
                yield self.step("found_path", visited, path, "Target found!", 5, path=path)
                return
            neighbor = next(neighbors, None)
            if neighbor is None:
                stack.pop()
                yield self.step(
                    "info", visited, [], f"Backtracking from {node}", 6,
                    frontier=[entry[0] for entry in stack],
                )
                continue
            child, _ = neighbor
            if child in visited:
                continue
            visited.add(child)
            parent[child] = node
            stack.append((child, iter(self.get_neighbors(child))))
            yield self.step(
                "visit_node", visited, [], f"Descending from {node} to {child}", 10,
                node=child, frontier=[entry[0] for entry in stack],
            )
        yield self.step("info", visited, [], "No path found.", 11)
