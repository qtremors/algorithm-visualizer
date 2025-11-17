from typing import List, Dict, Any, Generator
from ...base_algorithm import BaseAlgorithm

class InsertionSort(BaseAlgorithm):
    """
    Implements Insertion Sort.
    """
    
    metadata = {
        "name": "Insertion Sort",
        "pseudocode": [
            "procedure InsertionSort(A)",
            "  i = 1",
            "  while i < length(A)",
            "    j = i",
            "    while j > 0 and A[j-1] > A[j]",
            "      swap A[j] and A[j-1]",
            "      j = j - 1",
            "    end while",
            "    i = i + 1",
            "  end while",
            "end procedure"
        ],
        "input_type": "list[int]",
        "visualizer": "bar_chart",
        "description": "Insertion sort builds the final sorted array one item at a time. It is much less efficient on large lists than more advanced algorithms.",
        "complexity": {
            "time": "O(n²)",
            "space": "O(1)"
        },
        "pros": [
            "Efficient for small data sets.",
            "Adaptive: Efficient for data sets that are already substantially sorted.",
            "Stable sort."
        ],
        "cons": [
            "Less efficient on large lists than Quick Sort or Merge Sort.",
            "Performance degrades quickly as list size increases."
        ]
    }

    def __init__(self, data: Any):
        if not isinstance(data, list) or not all(isinstance(x, int) for x in data):
            raise ValueError("Input must be a list of integers.")
        super().__init__(list(data))

    def run(self) -> Generator[Dict[str, Any], None, None]:
        n = len(self.data)
        
        yield { "type": "info", "payload": {}, "snapshot": self.data.copy(), "message": "Starting Insertion Sort...", "line": 1 }

        for i in range(1, n):
            j = i
            yield { "type": "info", "payload": {"indices": [i]}, "snapshot": self.data.copy(), "message": f"Processing index {i}", "line": 3 }

            while j > 0:
                yield { "type": "compare", "payload": {"indices": [j-1, j]}, "snapshot": self.data.copy(), "message": f"Comparing {self.data[j]} with {self.data[j-1]}", "line": 5 }

                if self.data[j-1] > self.data[j]:
                    self.data[j-1], self.data[j] = self.data[j], self.data[j-1]
                    yield { "type": "swap", "payload": {"indices": [j-1, j]}, "snapshot": self.data.copy(), "message": "Swapping...", "line": 6 }
                    j -= 1
                else:
                    break
        
        yield { "type": "sorted", "payload": {"indices": list(range(n))}, "snapshot": self.data.copy(), "message": "Array is sorted!", "line": 11 }