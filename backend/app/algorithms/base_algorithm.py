from abc import ABC, abstractmethod
from typing import List, Dict, Any, Generator

class BaseAlgorithm(ABC):
    """
    Abstract base class for all algorithm visualizations.
    """
    def __init__(self, data: List[int]):
        """
        Initializes the algorithm with a dataset.
        
        Args:
            data: A list of integers to be processed by the algorithm.
        """
        # Make a copy to avoid modifying the original list if it's passed from elsewhere
        self.data = list(data)

    @abstractmethod
    def run(self) -> Generator[Dict[str, Any], None, None]:
        """
        The main method to run the algorithm's execution.
        This method MUST be a generator that yields a dictionary at each step.
        """
        pass

