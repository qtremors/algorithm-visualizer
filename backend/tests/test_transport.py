"""Malformed transport frames must fail without masquerading as algorithm errors."""

import asyncio
import pytest
from starlette.websockets import WebSocket, WebSocketDisconnect
from app.transport import receive_input


def socket_with(message):
    events = iter([{"type": "websocket.connect"}, message])

    async def receive():
        return next(events)

    async def send(_):
        pass

    return WebSocket({"type": "websocket", "path": "/", "headers": []}, receive, send)


@pytest.mark.asyncio
@pytest.mark.parametrize("raw", ["[NaN]", "[Infinity]", "[-Infinity]", "{bad"])
async def test_invalid_json_and_nonfinite_numbers_fail_before_execution(raw):
    socket = socket_with({"type": "websocket.receive", "text": raw})
    await socket.accept()
    with pytest.raises(ValueError):
        await receive_input(socket, timeout=1, max_bytes=100)


@pytest.mark.asyncio
async def test_utf8_budget_counts_bytes_not_characters():
    socket = socket_with({"type": "websocket.receive", "text": '"λ"'})
    await socket.accept()
    with pytest.raises(ValueError, match="too large"):
        await receive_input(socket, timeout=1, max_bytes=3)


@pytest.mark.asyncio
async def test_disconnect_keeps_the_close_code():
    socket = socket_with({"type": "websocket.disconnect", "code": 1001})
    await socket.accept()
    with pytest.raises(WebSocketDisconnect) as error:
        await receive_input(socket, timeout=1, max_bytes=100)
    assert error.value.code == 1001


@pytest.mark.asyncio
async def test_waiting_for_input_has_a_deadline():
    async def receive():
        await asyncio.sleep(1)
        return {"type": "websocket.receive", "text": "[]"}

    async def send(_):
        pass

    socket = WebSocket({"type": "websocket"}, receive, send)
    with pytest.raises(TimeoutError):
        await receive_input(socket, timeout=0.001, max_bytes=100)
