"""Stable bottom-up merge sort with explicit auxiliary-buffer writes."""

from app.base_algorithm import BaseAlgorithm
from app.registry import registry
from app.validation import validate_array


@registry.register("sorting", "merge_sort")
class MergeSort(BaseAlgorithm):
    metadata = {
        "name": "Merge Sort", "input_type": "list[int]", "visualizer": "bar_chart",
        "pseudocode": [
            "procedure MergeSort(A)",
            "  width := 1",
            "  while width < length(A)",
            "    for each adjacent pair of runs of width",
            "      copy both runs into auxiliary storage",
            "      compare the first remaining values",
            "      write the smaller value to A (left first on ties)",
            "    width := width * 2",
            "  return A",
        ],
        "description": "Merge adjacent sorted runs, choosing the left value on ties to preserve stability.",
        "complexity": {"time": "O(n log n)", "space": "O(n)", "best": "O(n log n)", "worst": "O(n log n)"},
        "pros": ["Stable.", "Predictable O(n log n) time."],
        "cons": ["Needs auxiliary storage.", "Writes can temporarily repeat values in the displayed array."],
    }

    def __init__(self, data):
        super().__init__(validate_array(data))

    def run(self):
        data = self.data
        yield self.step("info", [], "Starting Merge Sort...", 1)
        width = 1
        while width < len(data):
            for left in range(0, len(data), 2 * width):
                middle = min(left + width, len(data))
                right = min(left + 2 * width, len(data))
                buffer = data[left:right]
                i, j = 0, middle - left
                for target in range(left, right):
                    if i < middle - left and j < len(buffer):
                        yield self.step("compare", [left + i, left + j], f"Compare buffered values {buffer[i]} and {buffer[j]}", 6, [left, middle, right])
                    if i < middle - left and (j >= len(buffer) or buffer[i] <= buffer[j]):
                        value = buffer[i]
                        i += 1
                    else:
                        value = buffer[j]
                        j += 1
                    data[target] = value
                    yield self.step("write", [target], f"Write {value} at index {target}", 7, [left, middle, right])
            width *= 2
        yield self.step("sorted", list(range(len(data))), "Array is sorted!", 9)

    def step(self, kind, indices, message, line, boundary=None):
        return {"type": kind, "payload": {"indices": indices}, "snapshot": self.data.copy(),
                "message": message, "line": line,
                "learning": {"boundary": boundary or [], "explanation": "Auxiliary runs are merged back into the array; a write is not a swap."}}
