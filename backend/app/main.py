"""Metadata, capabilities, and bounded single-execution WebSocket streaming."""

import asyncio
import hmac
import json
import os
from dataclasses import asdict
from time import monotonic
from uuid import uuid4
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Response, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketState
from app.admission import admission
from app.config import allowed_origins, limits
from app.registry import registry
from app.observability import run_logger
from app.contracts import AlgorithmMetadata, Capabilities, SUPPORTED_PROTOCOLS
from app.trace import TraceEncoder
from app.transport import receive_input
from app.metrics import RunMetrics, service_metrics

import app.algorithms.sorting.bubble_sort  # noqa: F401
import app.algorithms.sorting.selection_sort  # noqa: F401
import app.algorithms.sorting.insertion_sort  # noqa: F401
import app.algorithms.pathfinding.dijkstra  # noqa: F401
import app.algorithms.pathfinding.bfs  # noqa: F401
import app.algorithms.pathfinding.dfs  # noqa: F401

import app.algorithms.sorting.merge_sort  # noqa: F401
import app.algorithms.sorting.quick_sort  # noqa: F401
import app.algorithms.pathfinding.astar  # noqa: F401
import app.algorithms.pathfinding.bellman_ford  # noqa: F401

import app.algorithms.trees.search_tree  # noqa: F401

logger = run_logger()
APP_VERSION = "0.1.5"
REVISION = os.getenv("VERCEL_GIT_COMMIT_SHA", os.getenv("APP_REVISION", "development"))
api = FastAPI(title="AlgoVisualizer", version=APP_VERSION)
api.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@api.get("/api/health")
async def health():
    return {"status": "ok", "protocol": 3, "version": APP_VERSION, "revision": REVISION}


@api.get("/api/capabilities", response_model=Capabilities)
async def capabilities():
    return Capabilities(limits=asdict(limits), version=APP_VERSION, revision=REVISION)


@api.get("/api/algorithms", response_model=dict[str, dict[str, AlgorithmMetadata]])
async def get_algorithms_api(response: Response):
    response.headers["Cache-Control"] = "public, max-age=300"
    return {
        category: {name: cls.metadata for name, cls in algorithms.items()}
        for category, algorithms in registry.get_algorithms().items()
    }


@api.get("/api/metrics", include_in_schema=False)
async def metrics(authorization: str | None = Header(default=None)):
    token = os.getenv("METRICS_TOKEN")
    if not token or not hmac.compare_digest((authorization or "").encode("utf-8"), f"Bearer {token}".encode("utf-8")):
        raise HTTPException(404)
    return Response(service_metrics.render(), media_type="text/plain")


async def finish(socket, code, message=None, error_code="execution_failed"):
    if socket.application_state != WebSocketState.CONNECTED:
        return
    try:
        async with asyncio.timeout(1):
            if message:
                await socket.send_json({"type": "error", "code": error_code, "message": message})
            await socket.close(code=code)
    except (WebSocketDisconnect, OSError, TimeoutError):
        pass


@api.websocket("/ws/visualize/{category}/{algorithm_name}")
async def websocket_endpoint(websocket: WebSocket, category: str, algorithm_name: str):
    origin = websocket.headers.get("origin")
    if "*" not in allowed_origins and origin not in allowed_origins:
        service_metrics.record("origin_rejected", 0, 0, 0)
        await websocket.close(code=1008)
        return
    # ASGI client is supplied by Uvicorn. Trust forwarded headers only from an
    # explicitly configured ingress; never parse arbitrary X-Forwarded-For here.
    address = websocket.client.host if websocket.client else "unknown"
    if not admission.acquire(address):
        service_metrics.record("rate_rejected", 0, 0, 0)
        await websocket.close(code=1013)
        return
    run_id = uuid4().hex
    started = monotonic()
    count = trace_bytes = 0
    outcome = "failed"
    error_code = None
    try:
        await websocket.accept()
        protocol = int(websocket.query_params.get("protocol", "2"))
        if protocol not in SUPPORTED_PROTOCOLS:
            raise ValueError("Unsupported protocol. Refresh the application.")
        encoder = TraceEncoder(protocol)
        algorithm_class = registry.get_algorithm(category, algorithm_name)
        if algorithm_class is None:
            raise ValueError("Algorithm not found.")
        data = await receive_input(websocket, timeout=limits.input_timeout, max_bytes=limits.max_input_bytes)
        algorithm = algorithm_class(data)
        run_metrics = RunMetrics()
        async with asyncio.timeout(limits.execution_timeout):
            for step in algorithm.run():
                count += 1
                run_metrics.observe(step)
                encoded = json.dumps(encoder.encode(step), separators=(",", ":"), allow_nan=False)
                trace_bytes += len(encoded.encode("utf-8"))
                if count > limits.max_steps or trace_bytes > limits.max_trace_bytes:
                    outcome = error_code = "limit_exceeded"
                    await finish(websocket, 1009, "This visualization is too large. Use a smaller input.", error_code)
                    return
                await websocket.send_text(encoded)
                await asyncio.sleep(0)
            completion = {"type": "complete", "steps": count}
            if protocol == 3:
                completion["metrics"] = run_metrics.summary()
            await websocket.send_json(completion)
        await finish(websocket, 1000)
        outcome = "completed"
    except TimeoutError:
        outcome = error_code = "timeout"
        await finish(websocket, 1008, "Visualization timed out. Retry with a smaller input.", error_code)
    except (WebSocketDisconnect, OSError):
        outcome = "cancelled"
    except (ValueError, RecursionError) as error:
        outcome = error_code = "invalid_input"
        await finish(websocket, 1003, str(error)[:500], error_code)
    except Exception:
        error_code = "execution_failed"
        logger.exception("visualization_failed", extra={"run_id": run_id, "category": category, "algorithm": algorithm_name})
        await finish(websocket, 1011, "Visualization failed. Please retry.")
    finally:
        admission.release(address)
        seconds = monotonic() - started
        service_metrics.record(outcome, count, trace_bytes, seconds)
        logger.info("visualization_finished", extra={
            "run_id": run_id, "category": category, "algorithm": algorithm_name,
            "steps": count, "trace_bytes": trace_bytes, "seconds": seconds,
            "outcome": outcome, "error_code": error_code,
        })
