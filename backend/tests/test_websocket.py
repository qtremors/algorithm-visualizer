import asyncio
import json
from dataclasses import replace
import pytest
from starlette.websockets import WebSocket
import app.main as main
from app.admission import Admission


async def execute(
    data="[2,1]", category="sorting", algorithm="bubble_sort", disconnect=False
):
    incoming = iter(
        [
            {"type": "websocket.connect"},
            {"type": "websocket.disconnect", "code": 1000}
            if disconnect
            else {"type": "websocket.receive", "text": data},
        ]
    )
    sent = []

    async def receive():
        return next(incoming)

    async def send(event):
        sent.append(event)

    scope = {
        "type": "websocket",
        "path": f"/ws/visualize/{category}/{algorithm}",
        "headers": [(b"origin", b"https://client.example")],
        "client": ("test", 1),
    }
    await main.websocket_endpoint(WebSocket(scope, receive, send), category, algorithm)
    return sent


@pytest.fixture(autouse=True)
def isolated_admission(monkeypatch):
    monkeypatch.setattr(main, "admission", Admission())
    monkeypatch.setattr(main, "allowed_origins", ["*"])


@pytest.mark.asyncio
async def test_success_has_terminal_message_and_single_close():
    sent = await execute()
    messages = [json.loads(e["text"]) for e in sent if e["type"] == "websocket.send"]
    assert messages[0]["snapshot"] == [2, 1]
    assert messages[-2]["type"] == "sorted"
    assert messages[-1] == {"type": "complete", "steps": len(messages) - 1}
    assert [e["code"] for e in sent if e["type"] == "websocket.close"] == [1000]
    assert not main.admission.active


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "data", ['"bad"', "{invalid", "[NaN]", "[true]", json.dumps(list(range(101)))]
)
async def test_invalid_input_has_error_without_partial_steps_or_double_close(data):
    sent = await execute(data)
    messages = [json.loads(e["text"]) for e in sent if e["type"] == "websocket.send"]
    assert len(messages) == 1
    assert messages[0]["type"] == "error"
    assert messages[0]["code"] == "invalid_input"
    assert [e["code"] for e in sent if e["type"] == "websocket.close"] == [1003]
    assert not main.admission.active


@pytest.mark.asyncio
async def test_step_budget_emits_error_not_success(monkeypatch):
    monkeypatch.setattr(main, "limits", replace(main.limits, max_steps=1))
    sent = await execute()
    types = [
        json.loads(e["text"])["type"] for e in sent if e["type"] == "websocket.send"
    ]
    assert types == ["info", "error"]
    assert sent[-1]["code"] == 1009


@pytest.mark.asyncio
async def test_trace_budget_and_input_budget(monkeypatch):
    monkeypatch.setattr(main, "limits", replace(main.limits, max_trace_bytes=1))
    assert (await execute())[-1]["code"] == 1009
    monkeypatch.setattr(main, "limits", replace(main.limits, max_input_bytes=1))
    assert (await execute())[-1]["code"] == 1003


@pytest.mark.asyncio
async def test_grid_geometry_is_not_repeated_on_wire():
    grid = {"grid": [[0]], "start": {"row": 0, "col": 0}, "end": {"row": 0, "col": 0}}
    sent = await execute(json.dumps(grid), "pathfinding", "bfs")
    frames = [json.loads(e["text"]) for e in sent if e["type"] == "websocket.send"]
    assert all("grid" not in frame.get("snapshot", {}) for frame in frames)
    assert frames[-1]["type"] == "complete"


@pytest.mark.asyncio
async def test_origin_restriction_and_client_disconnect(monkeypatch):
    monkeypatch.setattr(main, "allowed_origins", ["https://allowed.example"])
    assert await execute() == [{"type": "websocket.close", "code": 1008, "reason": ""}]
    monkeypatch.setattr(main, "allowed_origins", ["*"])
    await execute(disconnect=True)
    assert not main.admission.active


@pytest.mark.asyncio
async def test_unknown_algorithm_and_unexpected_failure(monkeypatch):
    assert (await execute(algorithm="unknown"))[-1]["code"] == 1003

    class Broken:
        def __init__(self, _):
            pass

        def run(self):
            raise RuntimeError("internal details")

    monkeypatch.setattr(main.registry, "get_algorithm", lambda *_: Broken)
    sent = await execute()
    assert sent[-1]["code"] == 1011
    assert "internal details" not in str(sent)


def test_admission_bounds_concurrency_rate_and_cache():
    gate = Admission()
    assert gate.acquire("a") and gate.acquire("a")
    assert not gate.acquire("a")
    gate.release("a")
    assert gate.acquire("a")
    for _ in range(30):
        gate.acquire("b")
    assert not gate.acquire("b")
    assert len(gate.attempts["b"]) <= 20
    for i in range(1100):
        gate.acquire(str(i))
    assert len(gate.attempts) <= 1024


@pytest.mark.asyncio
async def test_execution_timeout_has_explicit_error_and_releases_admission(monkeypatch):
    monkeypatch.setattr(main, "limits", replace(main.limits, execution_timeout=0))
    sent = await execute()
    messages = [
        json.loads(event["text"]) for event in sent if event["type"] == "websocket.send"
    ]
    assert messages[-1]["code"] == "timeout"
    assert not any(message["type"] == "complete" for message in messages)
    assert not main.admission.active


@pytest.mark.asyncio
async def test_idle_socket_times_out_and_releases_admission(monkeypatch):
    monkeypatch.setattr(main, "limits", replace(main.limits, input_timeout=0.001))
    first = True
    sent = []

    async def receive():
        nonlocal first
        if first:
            first = False
            return {"type": "websocket.connect"}
        await asyncio.sleep(1)
        return {"type": "websocket.receive", "text": "[1]"}

    async def send(event):
        sent.append(event)

    socket = WebSocket(
        {"type": "websocket", "path": "/", "headers": [], "client": ("idle", 1)},
        receive,
        send,
    )
    await main.websocket_endpoint(socket, "sorting", "bubble_sort")
    assert sent[-1]["code"] == 1008
    assert json.loads(sent[-2]["text"])["code"] == "timeout"
    assert not main.admission.active
