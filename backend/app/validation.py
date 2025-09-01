"""Validate untrusted input before generating any algorithm steps."""

import math
import re
from typing import Any
from app.config import limits

MAX_SAFE_INTEGER = 2**53 - 1
WEIGHT_TILE = 5


def validate_array(data: Any) -> list[int]:
    if not isinstance(data, list) or len(data) > limits.max_array_size:
        raise ValueError(
            f"Input must be a list of at most {limits.max_array_size} integers."
        )
    if any(type(value) is not int or abs(value) > MAX_SAFE_INTEGER for value in data):
        raise ValueError(
            "Every array value must be a safe integer, not a boolean or decimal."
        )
    return data.copy()


def finite_number(value: Any, minimum: float, maximum: float) -> bool:
    return (
        type(value) in (int, float)
        and minimum <= value <= maximum
        and math.isfinite(value)
    )


def validate_pathfinding(data: Any) -> dict:
    if not isinstance(data, dict):
        raise ValueError("Pathfinding input must be an object.")
    if ("grid" in data) == ("adjacency" in data):
        raise ValueError("Provide either a grid or a graph.")
    return validate_graph(data) if "adjacency" in data else validate_grid(data)


def validate_grid(data: dict) -> dict:
    grid = data["grid"]
    if data.get("kind", "grid") != "grid":
        raise ValueError("The input kind must match its grid data.")
    if not isinstance(grid, list) or not 1 <= len(grid) <= limits.max_grid_rows:
        raise ValueError(f"Grid must have 1–{limits.max_grid_rows} rows.")
    if not isinstance(grid[0], list) or not 1 <= len(grid[0]) <= limits.max_grid_cols:
        raise ValueError(f"Grid must have 1–{limits.max_grid_cols} columns.")
    cols = len(grid[0])
    for row in grid:
        if not isinstance(row, list) or len(row) != cols:
            raise ValueError("Grid rows must all have the same length.")
        if any(
            type(cell) is not int or cell not in (0, 1, WEIGHT_TILE) for cell in row
        ):
            raise ValueError("Grid cells must be 0 (open), 1 (wall), or 5 (weight).")
    points = {}
    for name in ("start", "end"):
        point = data.get(name)
        if not isinstance(point, dict):
            raise ValueError(f"Grid {name} must have integer row and col coordinates.")
        r, c = point.get("row"), point.get("col")
        if (
            type(r) is not int
            or type(c) is not int
            or not (0 <= r < len(grid) and 0 <= c < cols)
        ):
            raise ValueError(f"Grid {name} must be inside the grid.")
        if grid[r][c] == 1:
            raise ValueError(f"Grid {name} cannot be a wall.")
        points[name] = {"row": r, "col": c}
    return {"kind": "grid", "grid": [row.copy() for row in grid], **points}


def validate_graph(data: dict) -> dict:
    adjacency = data["adjacency"]
    if data.get("kind", "graph") != "graph" or not isinstance(adjacency, dict):
        raise ValueError("Graph adjacency must be an object matching its input kind.")
    nodes = data.get("nodes")
    if nodes is not None and not isinstance(nodes, dict):
        raise ValueError("Graph nodes must be an object.")
    ids = set(nodes if nodes is not None else adjacency)
    if not 1 <= len(ids) <= limits.max_graph_nodes:
        raise ValueError(f"Graph must contain 1–{limits.max_graph_nodes} nodes.")
    if any(
        not isinstance(node, str)
        or not re.fullmatch(r"[A-Za-z0-9_-]{1,64}", node)
        or node in {"__proto__", "constructor", "prototype"}
        for node in ids
    ):
        raise ValueError(
            "Node IDs must be short letters, numbers, underscores, or hyphens."
        )
    if set(adjacency) != ids:
        raise ValueError("Every graph node must have an adjacency entry.")
    if nodes is not None:
        for position in nodes.values():
            if not isinstance(position, dict) or any(
                not finite_number(position.get(axis), 0, 10_000) for axis in ("x", "y")
            ):
                raise ValueError(
                    "Node positions must be finite coordinates between 0 and 10000."
                )
    edges = 0
    for neighbors in adjacency.values():
        if not isinstance(neighbors, dict) or not set(neighbors).issubset(ids):
            raise ValueError("Every edge must reference an existing graph node.")
        edges += len(neighbors)
        if edges > limits.max_graph_edges:
            raise ValueError(
                f"Graph may contain at most {limits.max_graph_edges} directed edges."
            )
        if any(
            not finite_number(weight, 0, 1_000_000) for weight in neighbors.values()
        ):
            raise ValueError(
                "Edge weights must be finite numbers between 0 and 1000000."
            )
    for name in ("start", "end"):
        if not isinstance(data.get(name), str) or data[name] not in ids:
            raise ValueError(f"Choose an existing graph node as {name}.")
    return {
        "kind": "graph",
        "adjacency": {u: neighbors.copy() for u, neighbors in adjacency.items()},
        "nodes": {u: position.copy() for u, position in (nodes or {}).items()},
        "start": data["start"],
        "end": data["end"],
    }
