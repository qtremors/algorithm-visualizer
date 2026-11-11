"""Aggregate execution measurements without retaining user input or traces."""

from collections import Counter
from time import monotonic


class RunMetrics:
    def __init__(self):
        self.started = monotonic()
        self.counts = Counter()
        self.visited = set()
        self.path_hops = 0
        self.path_cost = None

    def observe(self, step):
        self.counts[step["type"]] += 1
        snapshot = step["snapshot"]
        if isinstance(snapshot, dict):
            for node in snapshot.get("visited", []):
                self.visited.add(tuple(node) if isinstance(node, list) else node)
        if step["type"] == "found_path":
            self.path_hops = max(0, len(step["payload"].get("path", [])) - 1)
            self.path_cost = step["payload"].get("dist")

    def summary(self):
        result = {
            "comparisons": self.counts["compare"],
            "swaps": self.counts["swap"],
            "relaxations": self.counts["relax_edge"],
            "visited": len(self.visited),
            "path_hops": self.path_hops,
            "execution_ms": round((monotonic() - self.started) * 1000, 3),
        }
        if self.path_cost is not None:
            result["path_cost"] = self.path_cost
        return result


class ServiceMetrics:
    def __init__(self):
        self.outcomes = Counter()
        self.total_steps = 0
        self.total_bytes = 0
        self.total_seconds = 0.0

    def record(self, outcome, steps, byte_count, seconds):
        self.outcomes[outcome] += 1
        self.total_steps += steps
        self.total_bytes += byte_count
        self.total_seconds += seconds

    def render(self):
        lines = ["# TYPE algoviz_runs_total counter"]
        for outcome, count in sorted(self.outcomes.items()):
            lines.append(f'algoviz_runs_total{{outcome="{outcome}"}} {count}')
        lines += [
            "# TYPE algoviz_steps_total counter",
            f"algoviz_steps_total {self.total_steps}",
            "# TYPE algoviz_trace_bytes_total counter",
            f"algoviz_trace_bytes_total {self.total_bytes}",
            "# TYPE algoviz_execution_seconds_total counter",
            f"algoviz_execution_seconds_total {self.total_seconds:.6f}",
        ]
        return "\n".join(lines) + "\n"


service_metrics = ServiceMetrics()
