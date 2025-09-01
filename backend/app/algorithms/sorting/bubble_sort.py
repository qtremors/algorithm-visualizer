from typing import List, Dict, Any, Generator
from ..base_algorithm import BaseAlgorithm

class BubbleSort(BaseAlgorithm):
    """
    Implements the Bubble Sort algorithm for visualization.
    """
    def __init__(self, data: List[int]):
        super().__init__(data)
        # Store metadata for the API to consume
        self.name = "Bubble Sort"
        self.pseudocode = [
            "procedure BubbleSort",
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
        ]

    def run(self) -> Generator[Dict[str, Any], None, None]:
        """
        Executes the Bubble Sort algorithm, yielding each step.
        """
        n = len(self.data)
        swapped = True
        # Use a variable `limit` to keep track of the sorted portion
        limit = n
        while swapped:
            swapped = False
            yield {
                "type": "info", "message": "Starting a new pass...", "line": 3, "snapshot": self.data.copy(), "indices": []
            }
            for i in range(1, limit):
                # Step: Comparing two elements
                yield {
                    "type": "compare",
                    "indices": [i - 1, i],
                    "snapshot": self.data.copy(),
                    "message": f"Comparing {self.data[i-1]} and {self.data[i]}",
                    "line": 6
                }
                if self.data[i - 1] > self.data[i]:
                    # Step: Swapping two elements
                    self.data[i - 1], self.data[i] = self.data[i], self.data[i - 1]
                    swapped = True
                    yield {
                        "type": "swap",
                        "indices": [i - 1, i],
                        "snapshot": self.data.copy(),
                        "message": f"Swapping {self.data[i]} and {self.data[i-1]}",
                        "line": 7
                    }
            limit -= 1
        
        # Final step to mark all as sorted
        yield {
            "type": "sorted",
            "indices": list(range(len(self.data))),
            "snapshot": self.data.copy(),
            "message": "Array is fully sorted!",
            "line": 13
        }

