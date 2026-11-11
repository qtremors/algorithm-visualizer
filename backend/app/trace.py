"""Protocol 3 delta encoding with periodic independently replayable checkpoints."""

from copy import deepcopy
from app.contracts import CHECKPOINT_INTERVAL


def node_key(node):
    return tuple(node) if isinstance(node, list) else node


class TraceEncoder:
    def __init__(self, protocol=3, interval=CHECKPOINT_INTERVAL):
        self.protocol = protocol
        self.interval = interval
        self.previous = {}
        self.index = 0
        self.kind = None

    def encode(self, step):
        result = {**step}
        snapshot = step["snapshot"]
        if not isinstance(snapshot, dict) or snapshot.get("type") not in ("grid", "graph"):
            return result
        snapshot = {k: v for k, v in snapshot.items() if k != "grid"}
        if self.protocol == 2:
            result["snapshot"] = snapshot
            return result
        kind = snapshot["type"]
        current = {node_key(node): node for node in snapshot["visited"]}
        if self.kind is not None and self.kind != kind:
            raise ValueError("Snapshot type changed during execution.")
        checkpoint = self.index % self.interval == 0
        result["snapshot"] = {
            "type": kind,
            "path": snapshot["path"],
            "added": [value for key, value in current.items() if key not in self.previous],
            "removed": [value for key, value in self.previous.items() if key not in current],
        }
        if checkpoint:
            result["snapshot"]["visited"] = list(current.values())
        result["sequence"] = self.index
        self.previous = current
        self.kind = kind
        self.index += 1
        return result


class TraceDecoder:
    """Reference decoder used by protocol tests and deployment smoke checks."""

    def __init__(self):
        self.visited = {}
        self.expected = 0
        self.kind = None

    def decode(self, step):
        snapshot = step["snapshot"]
        if not isinstance(snapshot, dict) or "added" not in snapshot:
            return deepcopy(step)
        if step.get("sequence") != self.expected:
            raise ValueError("Missing or reordered delta frame.")
        if self.kind is not None and self.kind != snapshot["type"]:
            raise ValueError("Snapshot type changed.")
        self.kind = snapshot["type"]
        if "visited" in snapshot:
            self.visited = {node_key(n): n for n in snapshot["visited"]}
        elif not self.expected:
            raise ValueError("A trace must start with a checkpoint.")
        else:
            for n in snapshot["removed"]:
                self.visited.pop(node_key(n), None)
            for n in snapshot["added"]:
                self.visited[node_key(n)] = n
        self.expected += 1
        return {
            **step,
            "snapshot": {
                "type": self.kind,
                "visited": deepcopy(list(self.visited.values())),
                "path": deepcopy(snapshot["path"]),
            },
        }
