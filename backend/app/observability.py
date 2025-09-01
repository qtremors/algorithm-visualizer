"""Structured per-run events without input data."""

import json
import logging


class RunFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        event = {"event": record.getMessage(), "level": record.levelname}
        for field in (
            "run_id",
            "category",
            "algorithm",
            "steps",
            "trace_bytes",
            "seconds",
        ):
            if hasattr(record, field):
                event[field] = getattr(record, field)
        if record.exc_info:
            event["exception"] = self.formatException(record.exc_info)
        return json.dumps(event)


def run_logger() -> logging.Logger:
    logger = logging.getLogger("algoviz")
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(RunFormatter())
        logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    logger.propagate = False
    return logger
