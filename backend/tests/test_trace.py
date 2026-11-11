"""Protocol reconstruction, checkpoint isolation, and realistic work budgets."""

import json
import pytest
from app.trace import TraceEncoder, TraceDecoder
from app.algorithms.pathfinding.bfs import BFS
from app.algorithms.pathfinding.dfs import DFS
from app.algorithms.pathfinding.dijkstra import Dijkstra
from app.config import limits


def grid(size):
    return {"grid": [[0] * size for _ in range(size)],
            "start": {"row": 0, "col": 0}, "end": {"row": size - 1, "col": size - 1}}


@pytest.mark.parametrize("algorithm", [BFS, DFS, Dijkstra])
@pytest.mark.parametrize("size", [1, 5])
def test_delta_roundtrip_preserves_every_snapshot(algorithm, size):
    encoder = TraceEncoder()
    decoder = TraceDecoder()
    byte_count = 0
    count = 0
    final = None
    for original in algorithm(grid(size)).run():
        wire = json.loads(json.dumps(encoder.encode(original)))
        byte_count += len(json.dumps(wire, separators=(",", ":")).encode())
        restored = decoder.decode(wire)
        expected = json.loads(json.dumps(original["snapshot"]))
        expected.pop("grid", None)
        assert set(map(str, restored["snapshot"]["visited"])) == set(map(str, expected["visited"]))
        assert restored["snapshot"]["path"] == expected["path"]
        final = restored
        count += 1
    assert byte_count < limits.max_trace_bytes
    assert count <= limits.max_steps
    assert final["type"] == "found_path"


def test_checkpoints_and_removals_are_self_contained():
    encoder = TraceEncoder(interval=2)
    decoder = TraceDecoder()
    snapshots = []
    frames = []
    for nodes in [["A"], ["A", "B"], ["B"], ["B", "C"]]:
        step = {"snapshot": {"type": "graph", "visited": nodes, "path": []}}
        frame = encoder.encode(step)
        frames.append(frame)
        snapshots.append(decoder.decode(frame))
    assert "visited" in frames[0]["snapshot"]
    assert "visited" not in frames[1]["snapshot"]
    assert frames[2]["snapshot"]["visited"] == ["B"]
    assert snapshots[0]["snapshot"]["visited"] == ["A"]
    assert snapshots[-1]["snapshot"]["visited"] == ["B", "C"]


def test_reordered_and_missing_initial_frames_are_rejected():
    decoder = TraceDecoder()
    with pytest.raises(ValueError, match="reordered"):
        decoder.decode({"sequence": 1, "snapshot": {"type": "graph", "added": [], "removed": [], "path": []}})
    with pytest.raises(ValueError, match="checkpoint"):
        decoder.decode({"sequence": 0, "snapshot": {"type": "graph", "added": [], "removed": [], "path": []}})


def test_protocol_two_keeps_complete_snapshots_and_strips_geometry():
    step = next(BFS(grid(2)).run())
    wire = TraceEncoder(2).encode(step)
    assert "visited" in wire["snapshot"]
    assert "added" not in wire["snapshot"]
    assert "grid" not in wire["snapshot"]
    assert "grid" in step["snapshot"]


def test_sorting_frames_are_unchanged():
    step = {"snapshot": [3, 2, 1], "type": "compare"}
    assert TraceEncoder().encode(step) == step


def test_grid_wire_budget_is_substantially_smaller_than_full_snapshots():
    encoder = TraceEncoder()
    old = new = 0
    for step in BFS(grid(30)).run():
        old += len(json.dumps(TraceEncoder(2).encode(step)))
        new += len(json.dumps(encoder.encode(step)))
    assert new < old / 5


@pytest.mark.parametrize("algorithm", [BFS, DFS, Dijkstra])
@pytest.mark.parametrize("size", [30, 50])
def test_large_grids_finish_within_delta_work_budgets(algorithm, size):
    encoder = TraceEncoder()
    byte_count = 0
    count = 0
    last = None
    for step in algorithm(grid(size)).run():
        frame = encoder.encode(step)
        byte_count += len(json.dumps(frame, separators=(",", ":")).encode())
        if frame["sequence"] % 128 == 0:
            assert len(frame["snapshot"]["visited"]) == len(step["snapshot"]["visited"])
        count += 1
        last = step
    assert last["type"] == "found_path"
    assert byte_count < limits.max_trace_bytes
    assert count < limits.max_steps
