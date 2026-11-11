"""Independent results and invariants for the expanded algorithm catalog."""

from collections import Counter
import random
import pytest
from app.algorithms.sorting.merge_sort import MergeSort
from app.algorithms.sorting.quick_sort import QuickSort
from app.algorithms.pathfinding.astar import AStar
from app.algorithms.pathfinding.bellman_ford import BellmanFord
from app.algorithms.pathfinding.dijkstra import Dijkstra
from app.algorithms.pathfinding.bfs import BFS
from app.algorithms.pathfinding.dfs import DFS
from app.algorithms.trees.search_tree import BST, AVL, validate_tree


@pytest.mark.parametrize("algorithm", [MergeSort, QuickSort])
@pytest.mark.parametrize("data", [[], [1], [3, -2, 0, 3, -2], list(range(30)), list(range(30, 0, -1)), [4] * 30])
def test_new_sorts_match_reference_and_preserve_earlier_snapshots(algorithm, data):
    original = data.copy()
    steps = list(algorithm(data).run())
    assert steps[0]["snapshot"] == original
    assert steps[-1]["snapshot"] == sorted(original)
    assert data == original
    assert all(1 <= step["line"] <= len(algorithm.metadata["pseudocode"]) for step in steps)
    if algorithm is QuickSort:
        assert all(Counter(step["snapshot"]) == Counter(original) for step in steps)


@pytest.mark.parametrize("algorithm", [MergeSort, QuickSort])
def test_sort_worst_case_stays_inside_step_budget(algorithm):
    steps = list(algorithm(list(range(100, 0, -1))).run())
    assert len(steps) < 12000
    assert steps[-1]["snapshot"] == list(range(1, 101))


def distance(algorithm, data):
    steps = list(algorithm(data).run())
    paths = [step for step in steps if step["type"] == "found_path"]
    return paths[-1]["payload"]["dist"] if paths else None


@pytest.mark.parametrize("heuristic", ["manhattan", "euclidean", "zero"])
@pytest.mark.parametrize("seed", range(5))
def test_astar_grid_cost_matches_dijkstra(heuristic, seed):
    rng = random.Random(seed)
    grid = [[rng.choices([0, 1, 5], [7, 2, 1])[0] for _ in range(8)] for _ in range(8)]
    grid[0][0] = grid[7][7] = 0
    data = {"grid": grid, "start": {"row": 0, "col": 0}, "end": {"row": 7, "col": 7}, "heuristic": heuristic}
    assert distance(AStar, data) == distance(Dijkstra, data)


def test_astar_graph_uses_admissible_zero_heuristic():
    data = {"adjacency": {"A": {"B": 0, "C": 8}, "B": {"C": 1}, "C": {}}, "start": "A", "end": "C"}
    assert distance(AStar, data) == 1
    with pytest.raises(ValueError, match="zero heuristic"):
        AStar({**data, "heuristic": "manhattan"})
    with pytest.raises(ValueError, match="heuristic"):
        AStar({**data, "heuristic": "bad"})


def test_bellman_ford_negative_edges_do_not_weaken_other_algorithms():
    data = {"adjacency": {"A": {"B": 4, "C": 8}, "B": {"C": -6}, "C": {}}, "start": "A", "end": "C"}
    assert distance(BellmanFord, data) == -2
    for algorithm in [AStar, Dijkstra, BFS, DFS]:
        with pytest.raises(ValueError, match="negative"):
            algorithm(data)


def test_bellman_ford_reports_reachable_cycles_and_ignores_unreachable_cycles():
    data = {"adjacency": {"A": {"B": 1}, "B": {"C": -3}, "C": {"B": 1}}, "start": "A", "end": "C"}
    steps = list(BellmanFord(data).run())
    assert steps[-1]["type"] == "negative_cycle"
    assert not any(step["type"] == "found_path" for step in steps)
    separate = {"adjacency": {"A": {"D": 2}, "D": {}, "B": {"C": -3}, "C": {"B": 1}}, "start": "A", "end": "D"}
    assert distance(BellmanFord, separate) == 2


@pytest.mark.parametrize("seed", range(6))
def test_bellman_ford_matches_dijkstra_for_nonnegative_graphs(seed):
    rng = random.Random(seed)
    ids = [str(i) for i in range(8)]
    graph = {u: {v: rng.randrange(8) for v in ids if v != u and rng.random() < .3} for u in ids}
    data = {"adjacency": graph, "start": "0", "end": "7"}
    assert distance(BellmanFord, data) == distance(Dijkstra, data)


def assert_tree(snapshot, balanced):
    nodes = {node["id"]: node for node in snapshot["nodes"]}
    seen = set()

    def check(key, low=float("-inf"), high=float("inf")):
        if key is None:
            return 0
        assert key not in seen
        seen.add(key)
        node = nodes[key]
        assert low < node["value"] < high
        assert node["count"] >= 1
        left = check(node["left"], low, node["value"])
        right = check(node["right"], node["value"], high)
        assert node["height"] == max(left, right) + 1
        if balanced:
            assert abs(left - right) <= 1
        return node["height"]

    check(snapshot["root"])
    assert seen == set(nodes)


@pytest.mark.parametrize("algorithm", [BST, AVL])
@pytest.mark.parametrize("seed", range(5))
def test_tree_edits_preserve_order_counts_heights_and_snapshots(algorithm, seed):
    rng = random.Random(seed)
    values = [rng.randrange(-10, 10) for _ in range(20)]
    operations = [{"type": rng.choice(["insert", "delete", "search"]), "value": rng.randrange(-10, 10)} for _ in range(20)]
    expected = Counter(values)
    for operation in operations:
        if operation["type"] == "insert":
            expected[operation["value"]] += 1
        elif operation["type"] == "delete" and expected[operation["value"]]:
            expected[operation["value"]] -= 1
    steps = list(algorithm({"kind": "tree", "values": values, "operations": operations}).run())
    assert steps[0]["snapshot"]["nodes"] == []
    for step in steps:
        assert_tree(step["snapshot"], algorithm is AVL)
        assert 1 <= step["line"] <= len(algorithm.metadata["pseudocode"])
    actual = Counter({node["value"]: node["count"] for node in steps[-1]["snapshot"]["nodes"]})
    assert +actual == +expected
    visited = [int(key) for key in steps[-1]["snapshot"]["visited"]]
    assert visited == sorted(visited)


@pytest.mark.parametrize("values", [[3, 2, 1], [1, 2, 3], [3, 1, 2], [1, 3, 2]])
def test_avl_single_and_double_rotations(values):
    steps = list(AVL({"kind": "tree", "values": values}).run())
    assert steps[-1]["snapshot"]["root"] == "2"
    assert any("rotation" in step["message"] for step in steps)


@pytest.mark.parametrize("order, expected", [("inorder", [1, 2, 3]), ("preorder", [2, 1, 3]), ("postorder", [1, 3, 2])])
def test_explicit_traversal_order(order, expected):
    steps = list(BST({"kind": "tree", "values": [2, 1, 3], "traversal": order}).run())
    assert list(map(int, steps[-1]["snapshot"]["visited"])) == expected


@pytest.mark.parametrize("data", [None, {"kind": "tree", "values": [True]}, {"kind": "tree", "values": list(range(41))}, {"kind": "tree", "values": [1], "operations": [{"type": "drop", "value": 1}]}, {"kind": "tree", "values": [1], "traversal": "random"}])
def test_tree_validation_rejects_unsafe_inputs(data):
    with pytest.raises(ValueError):
        validate_tree(data)
