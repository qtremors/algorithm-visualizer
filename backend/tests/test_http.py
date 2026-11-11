"""Exercise routing and serialization through the actual ASGI application."""

from dataclasses import replace
import pytest
from fastapi.testclient import TestClient
from app.main import api
from app.admission import Admission
import app.main as main


@pytest.fixture()
def client(monkeypatch):
    monkeypatch.setattr(main, "admission", Admission())
    monkeypatch.setattr(main, "allowed_origins", ["*"])
    with TestClient(api) as value:
        yield value


def test_health_and_capabilities_agree(client):
    health = client.get("/api/health").json()
    capabilities = client.get("/api/capabilities").json()
    assert health["status"] == "ok"
    assert capabilities["protocol"] == health["protocol"] == 3
    assert capabilities["version"] == health["version"]
    assert capabilities["limits"]["max_grid_rows"] == 50
    assert capabilities["limits"]["max_trace_bytes"] == 16 * 1024 * 1024


def test_metadata_has_cache_policy_and_openapi_contract(client):
    response = client.get("/api/algorithms")
    assert response.status_code == 200
    assert "max-age=300" in response.headers["cache-control"]
    assert response.json()["pathfinding"]["dfs"]["visualizer"] == "grid_2d"
    schema = client.get("/openapi.json").json()
    assert "AlgorithmMetadata" in schema["components"]["schemas"]


def test_metrics_disabled_by_default_and_requires_exact_token(client, monkeypatch):
    monkeypatch.delenv("METRICS_TOKEN", raising=False)
    assert client.get("/api/metrics").status_code == 404
    monkeypatch.setenv("METRICS_TOKEN", "test-only")
    assert client.get("/api/metrics", headers={"Authorization": "Bearer wrong"}).status_code == 404
    response = client.get("/api/metrics", headers={"Authorization": "Bearer test-only"})
    assert response.status_code == 200
    assert "algoviz_steps_total" in response.text


def test_real_socket_protocol_three_sends_checkpoints_and_metrics(client):
    with client.websocket_connect("/ws/visualize/pathfinding/bfs?protocol=3") as socket:
        socket.send_json({"kind": "grid", "grid": [[0, 0]],
                          "start": {"row": 0, "col": 0}, "end": {"row": 0, "col": 1}})
        messages = []
        while True:
            message = socket.receive_json()
            messages.append(message)
            if message["type"] == "complete":
                break
    assert "visited" in messages[0]["snapshot"]
    assert "added" in messages[1]["snapshot"]
    assert "visited" not in messages[1]["snapshot"]
    assert messages[-1]["steps"] == len(messages) - 1
    assert messages[-1]["metrics"]["path_hops"] == 1
    assert not main.admission.active


def test_unknown_protocol_fails_with_explicit_error(client):
    with client.websocket_connect("/ws/visualize/sorting/bubble_sort?protocol=99") as socket:
        response = socket.receive_json()
        assert response["type"] == "error"
        assert response["code"] == "invalid_input"
        assert "protocol" in response["message"]


def test_max_grid_completes_through_real_transport(client, monkeypatch):
    # Instrumentation and in-process transport amplify scheduling overhead.
    monkeypatch.setattr(main, "limits", replace(main.limits, execution_timeout=30))
    with client.websocket_connect("/ws/visualize/pathfinding/bfs?protocol=3") as socket:
        socket.send_json({"grid": [[0] * 50 for _ in range(50)],
                          "start": {"row": 0, "col": 0}, "end": {"row": 49, "col": 49}})
        count = 0
        while True:
            message = socket.receive_json()
            assert message["type"] != "error"
            if message["type"] == "complete":
                assert message["steps"] == count
                assert message["metrics"]["path_hops"] == 98
                break
            count += 1


def test_binary_socket_input_is_rejected_as_invalid_input(client):
    with client.websocket_connect("/ws/visualize/sorting/bubble_sort?protocol=3") as socket:
        socket.send_bytes(b"[2, 1]")
        message = socket.receive_json()
        assert message["code"] == "invalid_input"
        assert "JSON text" in message["message"]
    assert not main.admission.active


@pytest.mark.asyncio
async def test_non_ascii_metrics_credentials_do_not_raise_internal_errors(monkeypatch):
    from fastapi import HTTPException
    monkeypatch.setenv("METRICS_TOKEN", "test-only")
    with pytest.raises(HTTPException) as error:
        await main.metrics("Bearer café")
    assert error.value.status_code == 404
    monkeypatch.setenv("METRICS_TOKEN", "café")
    assert (await main.metrics("Bearer café")).status_code == 200
