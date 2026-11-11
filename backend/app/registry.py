"""Algorithm registration with validated metadata and duplicate protection."""

import re
from typing import Type
from app.contracts import validate_metadata


class AlgorithmRegistry:
    def __init__(self):
        self._registry: dict[str, dict[str, Type]] = {}

    def register(self, category: str, name: str):
        for value in (category, name):
            if not re.fullmatch(r"[a-z][a-z0-9_]{0,63}", value):
                raise ValueError("Registry keys must be lowercase identifiers.")

        def decorator(cls: Type):
            algorithms = self._registry.setdefault(category, {})
            if name in algorithms:
                raise ValueError(f"Duplicate algorithm: {category}/{name}")
            cls.metadata = validate_metadata(cls.metadata)
            algorithms[name] = cls
            return cls

        return decorator

    def get_algorithms(self) -> dict[str, dict[str, Type]]:
        return {category: items.copy() for category, items in self._registry.items()}

    def get_algorithm(self, category: str, name: str) -> Type | None:
        return self._registry.get(category, {}).get(name)


registry = AlgorithmRegistry()
