from typing import Dict, Any, Type, List, Callable
from functools import wraps

class AlgorithmRegistry:
    def __init__(self):
        self._registry: Dict[str, Dict[str, Type]] = {}

    def register(self, category: str, name: str):
        """Decorator to register an algorithm class."""
        def decorator(cls: Type):
            if category not in self._registry:
                self._registry[category] = {}
            self._registry[category][name] = cls
            return cls
        return decorator

    def get_algorithms(self) -> Dict[str, Dict[str, Type]]:
        return self._registry

    def get_algorithm(self, category: str, name: str) -> Type:
        return self._registry.get(category, {}).get(name)

registry = AlgorithmRegistry()
