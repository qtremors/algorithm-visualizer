from abc import ABC, abstractmethod
from typing import Dict, Any, Generator

class BaseAlgorithm(ABC):
    # Metadata Structure
    metadata: Dict[str, Any] = {
        "name": "Algorithm Name",
        "pseudocode": [],
        "input_type": "list[int]",
        "visualizer": "bar_chart",
        "description": "Short description...",
        "complexity": {
            "time": "O(n)",
            "space": "O(1)"
        },
        "pros": [],
        "cons": []
    }

    def __init__(self, data: Any):
        self.data = data

    @abstractmethod
    def run(self) -> Generator[Dict[str, Any], None, None]:
        pass