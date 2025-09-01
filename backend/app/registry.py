from typing import Dict, Type


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
        """Return a copy of the registration table."""
        return {
            category: algorithms.copy()
            for category, algorithms in self._registry.items()
        }

    def get_algorithm(self, category: str, name: str) -> Type | None:
        """Return the algorithm class or None for an unknown name."""
        return self._registry.get(category, {}).get(name)


registry = AlgorithmRegistry()
