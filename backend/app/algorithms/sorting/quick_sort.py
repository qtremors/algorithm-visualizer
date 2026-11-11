"""Iterative quick sort with an explicit pivot and partition boundary."""

from app.base_algorithm import BaseAlgorithm
from app.registry import registry
from app.validation import validate_array


@registry.register("sorting", "quick_sort")
class QuickSort(BaseAlgorithm):
    metadata = {
        "name": "Quick Sort", "input_type": "list[int]", "visualizer": "bar_chart",
        "pseudocode": [
            "procedure QuickSort(A)",
            "  push range [0, length(A) - 1]",
            "  while a range [low, high] remains",
            "    pivot := A[high]; boundary := low",
            "    for j := low to high - 1",
            "      compare A[j] with pivot",
            "      if A[j] <= pivot: swap A[j], A[boundary]; boundary++",
            "    swap A[boundary], A[high]",
            "    push nontrivial ranges on either side of boundary",
            "  return A",
        ],
        "description": "Partition around the last value, then sort each side using an explicit work stack.",
        "complexity": {"time": "O(n²) worst; O(n log n) average", "space": "O(n)", "average": "O(n log n)", "worst": "O(n²)"},
        "pros": ["Often fast on varied inputs.", "Partitions in place."],
        "cons": ["Unstable.", "Last-element pivots perform poorly on sorted or equal inputs."],
    }

    def __init__(self, data):
        super().__init__(validate_array(data))

    def run(self):
        yield self.step("info", [], "Starting Quick Sort...", 1)
        stack = [(0, len(self.data) - 1)]
        while stack:
            low, high = stack.pop()
            if low >= high:
                continue
            pivot = self.data[high]
            boundary = low
            yield self.step("info", [high], f"Pivot {pivot}; partition indices {low}–{high}", 4, [low, boundary, high])
            for j in range(low, high):
                yield self.step("compare", [j, high], f"Compare {self.data[j]} with pivot {pivot}", 6, [low, boundary, high])
                if self.data[j] <= pivot:
                    if j != boundary:
                        self.data[j], self.data[boundary] = self.data[boundary], self.data[j]
                        yield self.step("swap", [j, boundary], "Move value into the left partition", 7, [low, boundary, high])
                    boundary += 1
            if boundary != high:
                self.data[boundary], self.data[high] = self.data[high], self.data[boundary]
                yield self.step("swap", [boundary, high], "Place pivot at its final partition position", 8, [low, boundary, high])
            stack.extend([(boundary + 1, high), (low, boundary - 1)])
        yield self.step("sorted", list(range(len(self.data))), "Array is sorted!", 10)

    def step(self, kind, indices, message, line, boundary=None):
        return {"type": kind, "payload": {"indices": indices}, "snapshot": self.data.copy(),
                "message": message, "line": line,
                "learning": {"boundary": boundary or [], "explanation": "Values at or below the pivot move left; the pivot then separates the remaining ranges."}}
