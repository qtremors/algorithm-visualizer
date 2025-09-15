"""Cross-check final behavior against a small independent shortest-path oracle."""

from collections import deque
import heapq
import random
from app.algorithms.pathfinding.bfs import BFS
from app.algorithms.pathfinding.dfs import DFS
from app.algorithms.pathfinding.dijkstra import Dijkstra
from app.algorithms.sorting.bubble_sort import BubbleSort
from app.algorithms.sorting.insertion_sort import InsertionSort
from app.algorithms.sorting.selection_sort import SelectionSort


def shortest(adjacency, start, end, weighted):
    queue = [(0, start)]
    distances = {start: 0}
    while queue:
        cost, node = heapq.heappop(queue)
        if cost != distances[node]:
            continue
        if node == end:
            return cost
        for neighbor, weight in adjacency[node].items():
            distance = cost + (weight if weighted else 1)
            if distance < distances.get(neighbor, float("inf")):
                distances[neighbor] = distance
                heapq.heappush(queue, (distance, neighbor))
    return None


def test_sorts_against_python_sort():
    randomizer = random.Random(81)
    for _ in range(100):
        values = [
            randomizer.randrange(-10, 11) for _ in range(randomizer.randrange(16))
        ]
        for algorithm in (BubbleSort, InsertionSort, SelectionSort):
            assert deque(algorithm(values).run(), maxlen=1)[0]["snapshot"] == sorted(
                values
            )


def test_random_directed_graphs_with_zero_weights():
    randomizer = random.Random(91)
    for _ in range(100):
        ids = [str(i) for i in range(randomizer.randrange(1, 10))]
        adjacency = {
            u: {
                v: randomizer.randrange(6)
                for v in ids
                if v != u and randomizer.random() < 0.3
            }
            for u in ids
        }
        start, end = randomizer.choice(ids), randomizer.choice(ids)
        for algorithm in (BFS, DFS, Dijkstra):
            steps = list(
                algorithm({"adjacency": adjacency, "start": start, "end": end}).run()
            )
            result = steps[-1]
            expected = shortest(adjacency, start, end, algorithm is Dijkstra)
            assert (result["type"] == "found_path") == (expected is not None)
            if expected is not None:
                path = result["payload"]["path"]
                assert path[0] == start and path[-1] == end
                assert all(v in adjacency[u] for u, v in zip(path, path[1:]))
                if algorithm is BFS:
                    assert len(path) - 1 == expected
                if algorithm is Dijkstra:
                    assert result["payload"]["dist"] == expected


def test_random_weighted_grids_against_graph_reference():
    randomizer = random.Random(109)
    for _ in range(100):
        rows, cols = randomizer.randrange(1, 9), randomizer.randrange(1, 9)
        grid = [randomizer.choices([0, 1, 5], [6, 3, 1], k=cols) for _ in range(rows)]
        start = (randomizer.randrange(rows), randomizer.randrange(cols))
        end = (randomizer.randrange(rows), randomizer.randrange(cols))
        grid[start[0]][start[1]] = grid[end[0]][end[1]] = 0
        adjacency = {}
        for r in range(rows):
            for c in range(cols):
                if grid[r][c] == 1:
                    continue
                neighbors = {}
                for nr, nc in ((r - 1, c), (r + 1, c), (r, c - 1), (r, c + 1)):
                    if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != 1:
                        neighbors[(nr, nc)] = 5 if grid[nr][nc] == 5 else 1
                adjacency[(r, c)] = neighbors
        data = {"grid": grid, "start": {"row": start[0], "col": start[1]}, "end": {"row": end[0], "col": end[1]}}
        for algorithm in (BFS, DFS, Dijkstra):
            result = deque(algorithm(data).run(), maxlen=1)[0]
            expected = shortest(adjacency, start, end, algorithm is Dijkstra)
            assert (result["type"] == "found_path") == (expected is not None)
            if expected is not None:
                path = result["payload"]["path"]
                assert path[0] == start and path[-1] == end
                assert all(v in adjacency[u] for u, v in zip(path, path[1:]))
                if algorithm is BFS:
                    assert len(path) - 1 == expected
                if algorithm is Dijkstra:
                    assert result["payload"]["dist"] == expected
