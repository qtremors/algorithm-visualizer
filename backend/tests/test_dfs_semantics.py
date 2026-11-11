"""DFS must produce a depth-first tree, not just a reachable path."""

import random
import pytest
from app.algorithms.pathfinding.dfs import DFS


def recursive_reference(adjacency, start, goal):
    visited = set()
    order = []
    path = []

    def visit(node):
        visited.add(node)
        order.append(node)
        path.append(node)
        if node == goal:
            return True
        for child in adjacency[node]:
            if child not in visited and visit(child):
                return True
        path.pop()
        return False

    found = visit(start)
    return order, path if found else []


def test_triangle_descends_into_sibling_via_first_branch():
    adjacency = {"A": {"B": 1, "C": 1}, "B": {"A": 1, "C": 1}, "C": {"A": 1, "B": 1}}
    steps = list(DFS({"adjacency": adjacency, "start": "A", "end": "C"}).run())
    assert steps[-1]["payload"]["path"] == ["A", "B", "C"]


@pytest.mark.parametrize("seed", range(12))
def test_iterative_dfs_matches_recursive_enter_order_and_path(seed):
    rng = random.Random(seed)
    ids = [str(i) for i in range(20)]
    adjacency = {u: {v: 1 for v in ids if v != u and rng.random() < 0.15} for u in ids}
    expected_order, expected_path = recursive_reference(adjacency, "0", "19")
    steps = list(DFS({"adjacency": adjacency, "start": "0", "end": "19"}).run())
    order = [step["payload"]["node"] for step in steps if step["type"] == "visit_node"]
    paths = [step["payload"]["path"] for step in steps if step["type"] == "found_path"]
    assert order == expected_order
    assert (paths[0] if paths else []) == expected_path
    assert all(1 <= step["line"] <= len(DFS.metadata["pseudocode"]) for step in steps)


def test_deep_corridor_does_not_depend_on_python_recursion():
    data = {"grid": [[0] * 50 for _ in range(50)],
            "start": {"row": 0, "col": 0}, "end": {"row": 49, "col": 49}}
    steps = list(DFS(data).run())
    assert steps[-1]["type"] == "found_path"
    assert len(steps[-1]["payload"]["path"]) > 1000
