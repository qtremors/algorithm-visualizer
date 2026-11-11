import json
import logging
import pytest
from pydantic import ValidationError
from app.contracts import AlgorithmMetadata, Capabilities
from app.registry import AlgorithmRegistry, registry
from app.metrics import RunMetrics, ServiceMetrics
from app.observability import RunFormatter
import app.main  # noqa: F401


def test_all_registered_metadata_validates():
    for category in registry.get_algorithms().values():
        for cls in category.values():
            value = AlgorithmMetadata.model_validate(cls.metadata)
            assert value.name
            assert value.pseudocode


def test_duplicate_registration_and_invalid_keys_fail_early():
    local = AlgorithmRegistry()
    cls = next(iter(registry.get_algorithms()["sorting"].values()))
    local.register("sorting", "example")(type("Example", (), {"metadata": cls.metadata}))
    with pytest.raises(ValueError, match="Duplicate"):
        local.register("sorting", "example")(cls)
    with pytest.raises(ValueError, match="identifier"):
        local.register("../sorting", "bad")


def test_invalid_metadata_is_rejected_before_becoming_public():
    local = AlgorithmRegistry()
    with pytest.raises(ValidationError):
        local.register("sorting", "bad")(type("Bad", (), {"metadata": {"name": "Bad"}}))
    assert not local.get_algorithms()["sorting"]


def test_registry_returns_independent_category_maps():
    values = registry.get_algorithms()
    values["sorting"].clear()
    assert registry.get_algorithms()["sorting"]


def test_capabilities_describe_limits_and_protocol_negotiation():
    value = Capabilities(limits={"max_steps": 12000}, version="0.1.1", revision="test")
    assert value.protocol == 3
    assert 2 in value.supported_protocols
    assert value.checkpoint_interval == 128


def test_run_metrics_count_operations_and_weighted_result():
    metrics = RunMetrics()
    for kind in ["compare", "swap", "compare"]:
        metrics.observe({"type": kind, "snapshot": [], "payload": {}})
    metrics.observe({"type": "found_path", "snapshot": {"visited": ["A", "B"]},
                     "payload": {"path": ["A", "B"], "dist": -2}})
    result = metrics.summary()
    assert result["comparisons"] == 2
    assert result["swaps"] == 1
    assert result["visited"] == 2
    assert result["path_hops"] == 1
    assert result["path_cost"] == -2
    assert result["execution_ms"] >= 0


def test_service_metrics_have_no_input_or_ip_labels():
    metrics = ServiceMetrics()
    metrics.record("completed", 20, 500, 0.25)
    metrics.record("timeout", 3, 80, 1.5)
    text = metrics.render()
    assert 'outcome="completed"' in text
    assert "algoviz_steps_total 23" in text
    assert "algoviz_trace_bytes_total 580" in text
    assert "1.750000" in text


def test_logs_include_outcome_and_timestamp_without_payloads():
    record = logging.LogRecord("test", logging.INFO, __file__, 1, "finished", (), None)
    record.outcome = "completed"
    record.run_id = "test-run"
    record.payload = ["private"]
    value = json.loads(RunFormatter().format(record))
    assert value["outcome"] == "completed"
    assert value["timestamp"]
    assert "payload" not in value
