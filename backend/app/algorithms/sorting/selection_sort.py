from typing import List, Dict, Any, Generator
from ...base_algorithm import BaseAlgorithm

class SelectionSort(BaseAlgorithm):
    """
    Implements the Selection Sort algorithm for visualization.
    """

    metadata = {
        "name": "Selection Sort",
        "pseudocode": [
            "procedure selectionSort(A : list of sortable items)",
            "  n = length(A)",
            "  for i = 0 to n-1 do",
            "     minIndex = i",
            "     for j = i+1 to n do",
            "        if A[j] < A[minIndex] then",
            "           minIndex = j",
            "        end if",
            "     end for",
            "     swap(A[i], A[minIndex])",
            "  end for",
            "end procedure"
        ],
        "input_type": "list[int]",
        "visualizer": "bar_chart",
        "description": "Selection Sort sorts an array by repeatedly finding the minimum element from the unsorted part and putting it at the beginning.",
        "complexity": {
            "time": "O(n²)",
            "space": "O(1)"
        },
        "pros": [
            "Simple and easy to implement.",
            " performs well on small lists.",
            "Makes the minimum number of swaps (O(n))."
        ],
        "cons": [
            "Inefficient for large lists.",
            "Unstable sort (can change relative order of equal elements)."
        ]
    }

    def __init__(self, data: Any):
        if not isinstance(data, list) or not all(isinstance(x, int) for x in data):
            raise ValueError("Input data for Selection Sort must be a list of integers.")
        super().__init__(list(data))

    def run(self) -> Generator[Dict[str, Any], None, None]:
        n = len(self.data)
        
        yield {
            "type": "info", "payload": {}, "snapshot": self.data.copy(),
            "message": "Starting Selection Sort...", "line": 1
        }

        for i in range(n):
            min_idx = i
            yield {
                "type": "info", "payload": {"indices": [i]}, "snapshot": self.data.copy(),
                "message": f"Pass {i+1}: Finding minimum for rest of array.", "line": 3
            }
            
            for j in range(i + 1, n):
                yield {
                    "type": "compare", "payload": {"indices": [j, min_idx]}, "snapshot": self.data.copy(),
                    "message": f"Comparing {self.data[j]} and {self.data[min_idx]}", "line": 6
                }
                if self.data[j] < self.data[min_idx]:
                    min_idx = j
                    yield {
                        "type": "info", "payload": {"indices": [min_idx]}, "snapshot": self.data.copy(),
                        "message": f"New minimum found: {self.data[min_idx]}", "line": 7
                    }

            self.data[i], self.data[min_idx] = self.data[min_idx], self.data[i]
            yield {
                "type": "swap", "payload": {"indices": [i, min_idx]}, "snapshot": self.data.copy(),
                "message": f"Swapping {self.data[min_idx]} with {self.data[i]}", "line": 10
            }

        yield {
            "type": "sorted", "payload": {"indices": list(range(n))}, "snapshot": self.data.copy(),
            "message": "Array is fully sorted!", "line": 12
        }