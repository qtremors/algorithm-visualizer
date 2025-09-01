from typing import List, Dict, Any, Generator
from ..base_algorithm import BaseAlgorithm

class SelectionSort(BaseAlgorithm):
    """
    Implements the Selection Sort algorithm for visualization.
    """
    def __init__(self, data: List[int]):
        super().__init__(data)
        # Store metadata for the API to consume
        self.name = "Selection Sort"
        self.pseudocode = [
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
        ]

    def run(self) -> Generator[Dict[str, Any], None, None]:
        """
        Executes the Selection Sort algorithm, yielding each step.
        """
        n = len(self.data)
        
        yield {
            "type": "info", "message": "Starting Selection Sort...", "line": 1, "snapshot": self.data.copy(), "indices": []
        }

        for i in range(n):
            min_idx = i
            yield {
                "type": "info", "message": f"Pass {i+1}: Finding minimum for the rest of the array.", "line": 3, "snapshot": self.data.copy(), "indices": [i]
            }
            
            for j in range(i + 1, n):
                # Step: Comparing two elements
                yield {
                    "type": "compare",
                    "indices": [j, min_idx],
                    "snapshot": self.data.copy(),
                    "message": f"Comparing {self.data[j]} and {self.data[min_idx]}",
                    "line": 6
                }
                if self.data[j] < self.data[min_idx]:
                    min_idx = j
                    # Step: Found a new minimum
                    yield {
                        "type": "info",
                        "indices": [min_idx],
                        "snapshot": self.data.copy(),
                        "message": f"New minimum found: {self.data[min_idx]}",
                        "line": 7
                    }

            # Step: Swapping the found minimum with the first element of the unsorted part
            self.data[i], self.data[min_idx] = self.data[min_idx], self.data[i]
            yield {
                "type": "swap",
                "indices": [i, min_idx],
                "snapshot": self.data.copy(),
                "message": f"Swapping {self.data[min_idx]} with {self.data[i]}",
                "line": 10
            }

        # Final step to mark all as sorted
        yield {
            "type": "sorted",
            "indices": list(range(n)),
            "snapshot": self.data.copy(),
            "message": "Array is fully sorted!",
            "line": 12
        }

