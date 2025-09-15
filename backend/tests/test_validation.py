from copy import deepcopy
import pytest
from app.algorithms.pathfinding.bfs import BFS
from app.algorithms.pathfinding.dfs import DFS
from app.algorithms.pathfinding.dijkstra import Dijkstra
from app.algorithms.sorting.bubble_sort import BubbleSort
from app.algorithms.sorting.selection_sort import SelectionSort
from app.algorithms.sorting.insertion_sort import InsertionSort
from app.config import limits, parse_origins

GRID = {
    "grid": [[0, 0], [0, 0]],
    "start": {"row": 0, "col": 0},
    "end": {"row": 1, "col": 1},
}
GRAPH = {
    "adjacency": {"A": {"B": 0, "C": 5}, "B": {"C": 1}, "C": {}},
    "start": "A",
    "end": "C",
}


@pytest.mark.parametrize("algorithm", [BFS, DFS, Dijkstra])
@pytest.mark.parametrize(
    "change",
    [
        {"grid": []},
        {"grid": [[0, 0], [0]]},
        {"grid": [[True, 0], [0, 0]]},
        {"grid": [[0, 3], [0, 0]]},
        {"grid": [[1, 0], [0, 0]]},
        {"start": {"row": -1, "col": 0}},
        {"start": {"row": 0.5, "col": 0}},
        {"end": {"row": 0, "col": 2}},
        {"start": None},
        {"grid": [[0]] * (limits.max_grid_rows + 1)},
    ],
)
def test_invalid_grids_rejected_before_execution(algorithm, change):
    with pytest.raises(ValueError):
        algorithm({**deepcopy(GRID), **change})


@pytest.mark.parametrize("algorithm", [BFS, DFS, Dijkstra])
@pytest.mark.parametrize(
    "change",
    [
        {"start": None},
        {"end": "missing"},
        {"adjacency": {}},
        {"adjacency": {"A": {"B": -1}, "B": {}, "C": {}}},
        {"adjacency": {"A": {"B": float("inf")}, "B": {}, "C": {}}},
        {"adjacency": {"A": {"B": True}, "B": {}, "C": {}}},
        {"adjacency": {"A": {"ghost": 1}, "B": {}, "C": {}}},
        {"nodes": {"A": {"x": 0, "y": 0}}},
    ],
)
def test_invalid_graphs_rejected_before_execution(algorithm, change):
    with pytest.raises(ValueError):
        algorithm({**deepcopy(GRAPH), **change})


@pytest.mark.parametrize("algorithm", [BubbleSort, SelectionSort, InsertionSort])
def test_sorting_snapshots_are_stable_and_input_is_not_mutated(algorithm):
    data = [3, -2, 1, 0]
    steps = list(algorithm(data).run())
    assert data == [3, -2, 1, 0]
    assert steps[0]["snapshot"] == data
    assert steps[-1]["snapshot"] == [-2, 0, 1, 3]
    assert steps[0]["snapshot"] is not steps[-1]["snapshot"]
    assert list(algorithm([]).run())[-1]["snapshot"] == []


@pytest.mark.parametrize("algorithm", [BubbleSort, SelectionSort, InsertionSort])
@pytest.mark.parametrize(
    "data", [[True], [1.5], [2**53], list(range(limits.max_array_size + 1)), "1,2"]
)
def test_sorting_rejects_invalid_or_excessive_inputs(algorithm, data):
    with pytest.raises(ValueError):
        algorithm(data)


@pytest.mark.parametrize("algorithm", [BFS, DFS, Dijkstra])
def test_pathfinding_valid_inputs_and_unreachable_target(algorithm):
    found = list(algorithm(deepcopy(GRID)).run())[-1]
    assert found["type"] == "found_path"
    assert found["payload"]["path"][0] == (0, 0)
    blocked = {**deepcopy(GRID), "grid": [[0, 1], [1, 0]]}
    assert list(algorithm(blocked).run())[-1]["message"] == "No path found."
    assert list(algorithm({**deepcopy(GRID), "end": {"row": 0, "col": 0}}).run())[-1][
        "payload"
    ]["path"] == [(0, 0)]


def test_dijkstra_zero_weights_and_cheaper_indirect_path():
    result = list(Dijkstra(deepcopy(GRAPH)).run())[-1]
    assert result["payload"] == {"path": ["A", "B", "C"], "dist": 1}


def test_origins_are_trimmed_and_empty_configuration_uses_default():
    assert parse_origins(None) == parse_origins("") == parse_origins(" , ") == ["*"]
    assert parse_origins(" https://a.example, https://b.example, ") == [
        "https://a.example",
        "https://b.example",
    ]
