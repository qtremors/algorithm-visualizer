"""Validated per-worker limits and HTTP/WebSocket origin policy."""

import os
from dataclasses import dataclass


def positive_int(name: str, default: int) -> int:
    value = int(os.getenv(name, str(default)))
    if value <= 0:
        raise ValueError(f"{name} must be a positive integer")
    return value


def parse_origins(value: str | None) -> list[str]:
    origins = [origin.strip() for origin in (value or "").split(",") if origin.strip()]
    return ["*"] if not origins or "*" in origins else origins


@dataclass(frozen=True)
class Limits:
    max_array_size: int = positive_int("MAX_ARRAY_SIZE", 100)
    max_grid_rows: int = positive_int("MAX_GRID_ROWS", 50)
    max_grid_cols: int = positive_int("MAX_GRID_COLS", 50)
    max_graph_nodes: int = positive_int("MAX_GRAPH_NODES", 50)
    max_graph_edges: int = positive_int("MAX_GRAPH_EDGES", 500)
    max_input_bytes: int = positive_int("MAX_INPUT_BYTES", 65_536)
    max_steps: int = positive_int("MAX_STEPS", 12_000)
    max_trace_bytes: int = positive_int("MAX_TRACE_BYTES", 16 * 1024 * 1024)
    input_timeout: int = positive_int("INPUT_TIMEOUT_SECONDS", 5)
    execution_timeout: int = positive_int("EXECUTION_TIMEOUT_SECONDS", 10)
    max_connections: int = positive_int("MAX_CONNECTIONS", 8)
    max_connections_per_ip: int = positive_int("MAX_CONNECTIONS_PER_IP", 2)
    connections_per_minute: int = positive_int("CONNECTIONS_PER_MINUTE", 20)


limits = Limits()
allowed_origins = parse_origins(os.getenv("ALLOWED_ORIGINS"))
