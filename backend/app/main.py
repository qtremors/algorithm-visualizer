"""Metadata, readiness, and bounded single-execution WebSocket streaming."""

import asyncio
import json
from time import monotonic
from uuid import uuid4
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketState
from app.admission import admission
from app.config import allowed_origins, limits
from app.registry import registry
from app.observability import run_logger

# Import modules to execute their registry decorators.
import app.algorithms.sorting.bubble_sort  # noqa: F401
import app.algorithms.sorting.selection_sort  # noqa: F401
import app.algorithms.sorting.insertion_sort  # noqa: F401
import app.algorithms.pathfinding.dijkstra  # noqa: F401
import app.algorithms.pathfinding.bfs  # noqa: F401
import app.algorithms.pathfinding.dfs  # noqa: F401

logger = run_logger()
api = FastAPI()
api.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@api.get("/api/health")
async def health():
    return {"status": "ok", "protocol": 2}


@api.get("/api/algorithms")
async def get_algorithms_api():
    """Return metadata for all registered algorithms."""
    return {
        category: {name: cls.metadata for name, cls in algorithms.items()}
        for category, algorithms in registry.get_algorithms().items()
    }


async def finish(
    socket: WebSocket,
    code: int,
    message: str | None = None,
    error_code: str = "execution_failed",
) -> None:
    """Send a terminal error if connected, then close at most once."""
    if socket.application_state != WebSocketState.CONNECTED:
        return
    try:
        async with asyncio.timeout(1):
            if message:
                await socket.send_json(
                    {"type": "error", "code": error_code, "message": message}
                )
            await socket.close(code=code)
    except (WebSocketDisconnect, OSError, TimeoutError):
        pass


def reject_constant(_: str):
    raise ValueError("Numbers must be finite.")


@api.websocket("/ws/visualize/{category}/{algorithm_name}")
async def websocket_endpoint(websocket: WebSocket, category: str, algorithm_name: str):
    origin = websocket.headers.get("origin")
    if "*" not in allowed_origins and origin not in allowed_origins:
        await websocket.close(code=1008)
        return
    address = websocket.client.host if websocket.client else "unknown"
    if not admission.acquire(address):
        await websocket.close(code=1013)
        return
    run_id = uuid4().hex
    started = monotonic()
    count = trace_bytes = 0
    try:
        await websocket.accept()
        algorithm_class = registry.get_algorithm(category, algorithm_name)
        if algorithm_class is None:
            raise ValueError("Algorithm not found.")
        raw = await asyncio.wait_for(
            websocket.receive_text(), timeout=limits.input_timeout
        )
        if len(raw.encode("utf-8")) > limits.max_input_bytes:
            raise ValueError("Input is too large. Use a smaller input.")
        algorithm = algorithm_class(json.loads(raw, parse_constant=reject_constant))
        async with asyncio.timeout(limits.execution_timeout):
            for step in algorithm.run():
                count += 1
                # Geometry is static and already held by the client.
                snapshot = step["snapshot"]
                if isinstance(snapshot, dict) and snapshot.get("type") == "grid":
                    step = {
                        **step,
                        "snapshot": {k: v for k, v in snapshot.items() if k != "grid"},
                    }
                encoded = json.dumps(step, separators=(",", ":"), allow_nan=False)
                trace_bytes += len(encoded.encode("utf-8"))
                if count > limits.max_steps or trace_bytes > limits.max_trace_bytes:
                    await finish(
                        websocket,
                        1009,
                        "This visualization is too large. Use a smaller input.",
                        "limit_exceeded",
                    )
                    return
                await websocket.send_text(encoded)
                # Successful sends need not suspend. Allow other requests and
                # disconnect events to run between bounded algorithm steps.
                await asyncio.sleep(0)
            await websocket.send_json({"type": "complete", "steps": count})
        await finish(websocket, 1000)
    except WebSocketDisconnect:
        logger.info("visualization_disconnected", extra={"run_id": run_id})
    except TimeoutError:
        await finish(
            websocket,
            1008,
            "Visualization timed out. Retry with a smaller input.",
            "timeout",
        )
    except (ValueError, RecursionError) as error:
        await finish(websocket, 1003, str(error)[:500], "invalid_input")
    except Exception:
        logger.exception(
            "visualization_failed",
            extra={"run_id": run_id, "category": category, "algorithm": algorithm_name},
        )
        await finish(websocket, 1011, "Visualization failed. Please retry.")
    finally:
        admission.release(address)
        logger.info(
            "visualization_finished",
            extra={
                "run_id": run_id,
                "steps": count,
                "trace_bytes": trace_bytes,
                "seconds": monotonic() - started,
            },
        )
