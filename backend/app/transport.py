"""Read one bounded JSON text input and distinguish malformed frames from faults."""

import asyncio
import json
from starlette.websockets import WebSocket, WebSocketDisconnect


def reject_constant(_: str):
    raise ValueError("Numbers must be finite.")


async def receive_input(socket: WebSocket, *, timeout: float, max_bytes: int):
    message = await asyncio.wait_for(socket.receive(), timeout=timeout)
    if message["type"] == "websocket.disconnect":
        raise WebSocketDisconnect(message.get("code", 1000))
    raw = message.get("text")
    if not isinstance(raw, str):
        raise ValueError("Send input as a JSON text message, not a binary frame.")
    if len(raw.encode("utf-8")) > max_bytes:
        raise ValueError("Input is too large. Use a smaller input.")
    return json.loads(raw, parse_constant=reject_constant)
