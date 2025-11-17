from typing import List, Dict, Any, Generator
from ...base_algorithm import BaseAlgorithm

class BubbleSort(BaseAlgorithm):
    """
    Implements the Bubble Sort algorithm for visualization.
    """
    
    metadata = {
        "name": "Bubble Sort",
        "pseudocode": [
            "procedure BubbleSort(A : list of sortable items)",
            "  n = length(A)",
            "  repeat",
            "    swapped = false",
            "    for i = 1 to n-1 inclusive do",
            "      if A[i-1] > A[i] then",
            "        swap(A[i-1], A[i])",
            "        swapped = true",
            "      end if",
            "    end for",
            "    n = n - 1",
            "  until not swapped",
            "end procedure"
        ],
        "input_type": "list[int]",
        "visualizer": "bar_chart",
        "description": "Bubble Sort is the simplest sorting algorithm that works by repeatedly swapping the adjacent elements if they are in the wrong order.",
        "complexity": {
            "time": "O(n²)",
            "space": "O(1)"
        },
        "pros": [
            "Easy to understand and implement.",
            "Does not require any additional memory space.",
            "Stable sorting algorithm."
        ],
        "cons": [
            "Very inefficient for large datasets.",
            "High time complexity compared to Merge Sort or Quick Sort."
        ]
    }

    def __init__(self, data: Any):
        if not isinstance(data, list) or not all(isinstance(x, int) for x in data):
            raise ValueError("Input data for Bubble Sort must be a list of integers.")
        super().__init__(list(data))

    def run(self) -> Generator[Dict[str, Any], None, None]:
        n = len(self.data)
        swapped = True
        limit = n
        
        yield {
            "type": "info", "payload": {}, "snapshot": self.data.copy(),
            "message": "Starting Bubble Sort...", "line": 1
        }
        
        while swapped:
            swapped = False
            yield {
                "type": "info", "payload": {"indices": list(range(limit))}, "snapshot": self.data.copy(),
                "message": "Starting new pass...", "line": 3
            }
            for i in range(1, limit):
                yield {
                    "type": "compare", "payload": {"indices": [i - 1, i]}, "snapshot": self.data.copy(),
                    "message": f"Comparing {self.data[i-1]} and {self.data[i]}", "line": 6
                }
                if self.data[i - 1] > self.data[i]:
                    self.data[i - 1], self.data[i] = self.data[i], self.data[i - 1]
                    swapped = True
                    yield {
                        "type": "swap", "payload": {"indices": [i - 1, i]}, "snapshot": self.data.copy(),
                        "message": f"Swapping {self.data[i]} and {self.data[i-1]}", "line": 7
                    }
            limit -= 1
        
        yield {
            "type": "sorted", "payload": {"indices": list(range(len(self.data)))}, "snapshot": self.data.copy(),
            "message": "Array is fully sorted!", "line": 13
        }