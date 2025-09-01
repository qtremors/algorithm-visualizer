"""Per-worker concurrency and rate limits with a bounded IP cache."""

from collections import Counter, deque
from time import monotonic
from app.config import limits


class Admission:
    """Operations are synchronous and atomic in a worker's event loop."""

    def __init__(self):
        self.active = Counter()
        self.attempts: dict[str, deque] = {}

    def acquire(self, address: str) -> bool:
        now = monotonic()
        for key in list(self.attempts):
            queue = self.attempts[key]
            while queue and queue[0] <= now - 60:
                queue.popleft()
            if not queue:
                del self.attempts[key]
        if address not in self.attempts:
            if len(self.attempts) >= 1024:
                return False
            self.attempts[address] = deque()
        queue = self.attempts[address]
        if len(queue) >= limits.connections_per_minute:
            return False
        queue.append(now)
        if (
            sum(self.active.values()) >= limits.max_connections
            or self.active[address] >= limits.max_connections_per_ip
        ):
            return False
        self.active[address] += 1
        return True

    def release(self, address: str) -> None:
        self.active[address] -= 1
        if self.active[address] <= 0:
            del self.active[address]


admission = Admission()
