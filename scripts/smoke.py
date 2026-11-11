"""Verify an explicitly selected deployment; print only public result metadata."""

import argparse
import asyncio
import json
from urllib.parse import urlsplit, urlunsplit
from urllib.request import Request, urlopen

import websockets


def get_json(base, path):
    with urlopen(Request(base.rstrip("/") + path), timeout=20) as response:
        return json.load(response)


def socket_url(base, path):
    parts = urlsplit(base)
    if parts.scheme not in ("http", "https"):
        raise ValueError("Use an HTTP(S) service URL.")
    return urlunsplit(("wss" if parts.scheme == "https" else "ws", parts.netloc,
                       parts.path.rstrip("/") + path, "protocol=3", ""))


async def run(base, origin):
    url = socket_url(base, "/ws/visualize/sorting/bubble_sort")
    async with websockets.connect(url, origin=origin, open_timeout=20) as socket:
        await socket.send("[3,1,2]")
        count = 0
        final = None
        async for text in socket:
            message = json.loads(text)
            if message["type"] == "error":
                raise RuntimeError(message["message"])
            if message["type"] == "complete":
                assert message["steps"] == count
                assert final == [1, 2, 3]
                break
            final = message["snapshot"]
            count += 1
        else:
            raise RuntimeError("Connection closed without terminal completion.")
    async with websockets.connect(url, origin=origin, open_timeout=20) as socket:
        await socket.send("[true]")
        error = json.loads(await socket.recv())
        assert error["type"] == "error" and error["code"] == "invalid_input"
    async with websockets.connect(url, origin=origin, open_timeout=20) as socket:
        await socket.send(json.dumps(list(range(100, 0, -1))))
        await socket.recv()
        await socket.close()
    return {"completion": True, "invalid_input": True, "cancellation": True}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--backend", required=True)
    parser.add_argument("--frontend")
    parser.add_argument("--revision")
    args = parser.parse_args()
    health = get_json(args.backend, "/api/health")
    assert health["status"] == "ok" and health["protocol"] == 3
    if args.revision:
        assert health["revision"] == args.revision, "Unexpected deployed revision"
    metadata = get_json(args.backend, "/api/algorithms")
    assert metadata["sorting"] and metadata["pathfinding"]
    capabilities = get_json(args.backend, "/api/capabilities")
    assert capabilities["version"] == health["version"]
    origin = args.frontend or args.backend
    if args.frontend:
        for route in ("/", "/sorting", "/pathfinding"):
            with urlopen(args.frontend.rstrip("/") + route, timeout=20) as response:
                assert response.status == 200
                assert 'id="root"' in response.read().decode(), "SPA fallback did not return HTML"
    result = asyncio.run(run(args.backend, origin))
    print(json.dumps({"host": args.backend, "version": health["version"],
                      "revision": health["revision"], **result}))


if __name__ == "__main__":
    main()
