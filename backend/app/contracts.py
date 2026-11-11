"""Validated public metadata; algorithms keep lightweight dictionary steps."""

from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, Field

PROTOCOL = 3
SUPPORTED_PROTOCOLS = (2, 3)
CHECKPOINT_INTERVAL = 128


class Complexity(BaseModel):
    time: str
    space: str
    best: str | None = None
    average: str | None = None
    worst: str | None = None


class AlgorithmMetadata(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=120)
    pseudocode: list[str] = Field(min_length=1, max_length=100)
    input_type: Literal["list[int]", "graph_grid", "tree"]
    visualizer: Literal["bar_chart", "grid_2d", "tree"]
    description: str = Field(min_length=1)
    complexity: Complexity
    pros: list[str]
    cons: list[str]
    supports_negative: bool = False
    heuristics: list[str] = Field(default_factory=list)


class Completion(BaseModel):
    type: Literal["complete"] = "complete"
    steps: int = Field(ge=0)
    metrics: dict[str, int | float | str] = Field(default_factory=dict)


class ExecutionError(BaseModel):
    type: Literal["error"] = "error"
    code: str
    message: str


class Capabilities(BaseModel):
    protocol: int = PROTOCOL
    supported_protocols: tuple[int, ...] = SUPPORTED_PROTOCOLS
    checkpoint_interval: int = CHECKPOINT_INTERVAL
    limits: dict[str, int]
    version: str
    revision: str


def validate_metadata(value: dict[str, Any]) -> dict[str, Any]:
    return AlgorithmMetadata.model_validate(value).model_dump(exclude_none=True)
