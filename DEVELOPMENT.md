# AlgoVisualizer - Developer Documentation

> Comprehensive documentation for developers working on AlgoVisualizer.

**Version:** 1.1.1 | **Last Updated:** January 12, 2026

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [WebSocket Protocol](#websocket-protocol)
- [Environment Variables](#environment-variables)
- [Adding New Algorithms](#adding-new-algorithms)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## Architecture Overview

AlgoVisualizer follows a **Client-Server with Real-time Streaming** architecture:

```
┌──────────────────────────────────────────────────────────────┐
│                     React Frontend                            │
│         Components, Hooks, Visualizers, Context              │
└──────────────────────────────────────────────────────────────┘
                              │ WebSocket
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                           │
│            Algorithm Registry, WebSocket Handler              │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                   Algorithm Implementations                   │
│         BaseAlgorithm → Sorting / Pathfinding Classes        │
└──────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| WebSocket over REST | Real-time streaming of algorithm steps without polling |
| Generator-based algorithms | Yield steps one-by-one for memory efficiency |
| Abstract BaseAlgorithm class | Consistent metadata and interface across all algorithms |
| Dual-mode pathfinding | Same algorithms work on both Grid and Graph data |

---

## Project Structure

```
algorithm-visualizer/
├── backend/                  # Python FastAPI backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py           # FastAPI app, CORS, WebSocket endpoint
│   │   ├── base_algorithm.py # Abstract base class
│   │   └── algorithms/
│   │       ├── sorting/
│   │       │   ├── bubble_sort.py
│   │       │   ├── selection_sort.py
│   │       │   └── insertion_sort.py
│   │       └── pathfinding/
│   │           ├── dijkstra.py
│   │           ├── bfs.py
│   │           └── dfs.py
│   ├── pyproject.toml        # Python dependencies (uv)
│   └── requirements.txt      # Fallback pip requirements
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── main.tsx          # React entry point
│   │   ├── App.tsx           # Router setup
│   │   ├── index.css         # Global styles
│   │   ├── contexts/         # AlgorithmContext
│   │   ├── hooks/            # useAlgorithmRunner, usePlayback
│   │   ├── types/            # TypeScript interfaces
│   │   ├── pages/            # HomePage, AlgorithmWorkspace
│   │   ├── lib/              # Utilities
│   │   └── components/
│   │       ├── core/         # Layout, Controls, Modals
│   │       ├── inputs/       # Array, Grid, Graph inputs
│   │       └── visualizers/  # Sorting, Grid, Graph visualizers
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── assets/                   # Screenshot images
├── README.md
├── DEVELOPMENT.md            # This file
├── CHANGELOG.md
├── LICENSE.md
└── TASKS.md
```

---

## WebSocket Protocol

### Endpoint

```
ws://{HOST}/ws/visualize/{category}/{algorithm_name}
```

### Flow

1. **Client connects** to WebSocket endpoint
2. **Client sends** JSON data (array for sorting, grid/graph for pathfinding)
3. **Server streams** step objects until algorithm completes
4. **Server closes** connection when done

### Step Object Format

```json
{
  "type": "compare | swap | visit_node | sorted | found_path | info",
  "payload": {
    "indices": [0, 1],
    "node": "A",
    "distance": 5
  },
  "snapshot": [5, 3, 8, ...],
  "message": "Comparing 5 and 3",
  "line": 6
}
```

### Step Types

| Type | Description | Payload |
|------|-------------|---------|
| `info` | Informational message | Varies |
| `compare` | Comparing two elements | `indices: [i, j]` |
| `swap` | Swapping two elements | `indices: [i, j]` |
| `visit_node` | Visiting a node | `node: id` |
| `update_neighbor` | Updating neighbor distance | `node: id, distance: n` |
| `found_path` | Path found | `path: [nodes]` |
| `sorted` | Array is sorted | `indices: [...all]` |

---

## Environment Variables

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend host:port | `127.0.0.1:8000` |

### Backend

No environment variables required for basic operation.

### CORS Configuration

Currently allows all origins (`allow_origins=["*"]`). For production, restrict to your frontend domain in `backend/app/main.py`.

---

## Adding New Algorithms

### 1. Create Algorithm Class

Create a new file in `backend/app/algorithms/{category}/`:

```python
from typing import Dict, Any, Generator
from ...base_algorithm import BaseAlgorithm

class MyNewSort(BaseAlgorithm):
    metadata = {
        "name": "My New Sort",
        "pseudocode": [
            "line 1 of pseudocode",
            "line 2 of pseudocode",
        ],
        "input_type": "list[int]",  # or "graph_grid"
        "visualizer": "bar_chart",   # or "grid_2d"
        "description": "Description of the algorithm.",
        "complexity": {"time": "O(n log n)", "space": "O(n)"},
        "pros": ["Fast", "Stable"],
        "cons": ["Requires extra memory"]
    }

    def __init__(self, data: Any):
        # Validate input
        if not isinstance(data, list):
            raise ValueError("Input must be a list")
        super().__init__(list(data))

    def run(self) -> Generator[Dict[str, Any], None, None]:
        # Yield info step
        yield {
            "type": "info",
            "payload": {},
            "snapshot": self.data.copy(),
            "message": "Starting...",
            "line": 1
        }
        
        # Your algorithm logic here
        # Yield steps for each operation
        
        yield {
            "type": "sorted",
            "payload": {"indices": list(range(len(self.data)))},
            "snapshot": self.data.copy(),
            "message": "Done!",
            "line": 2
        }
```

### 2. Register in Algorithm Registry

Add to `ALGORITHMS` dict in `backend/app/main.py`:

```python
ALGORITHMS = {
    "sorting": {
        # ... existing algorithms ...
        "my_new_sort": {
            "module_path": "app.algorithms.sorting.my_new_sort",
            "class_name": "MyNewSort"
        }
    }
}
```

### 3. Frontend Auto-Discovery

The frontend automatically fetches from `/api/algorithms` on load. No frontend changes needed unless you need a custom visualizer.

---

## Testing

### Backend

```bash
cd backend

# Install pytest
uv add pytest --dev

# Run tests
uv run pytest

# With verbosity
uv run pytest -v
```

### Frontend

```bash
cd frontend

# Install vitest
npm install vitest @testing-library/react --save-dev

# Run tests
npm test
```

### Test Coverage

| Component | Status |
|-----------|--------|
| Backend algorithms | ⚠️ Not yet implemented |
| Frontend hooks | ⚠️ Not yet implemented |

---

## Deployment

### Backend (Render, Railway, etc.)

```bash
# Build command
pip install -r requirements.txt

# Start command
uvicorn app.main:api --host 0.0.0.0 --port $PORT
```

### Frontend (Vercel, Netlify, etc.)

```bash
# Build command
npm run build

# Output directory
dist/
```

### Production Checklist

- [ ] Set `VITE_API_BASE_URL` to production backend URL
- [ ] Restrict CORS origins in `main.py`
- [ ] Add HTTPS (handled by hosting platform)
- [ ] Review algorithm input validation

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **WebSocket connection failed** | Ensure backend is running on correct port |
| **CORS errors** | Check `allow_origins` in `main.py` |
| **Algorithm not found** | Verify registry entry in `ALGORITHMS` dict |
| **Steps not streaming** | Check `run()` method yields properly |

### Debug Mode

Enable FastAPI debug output:

```bash
uv run uvicorn app.main:api --reload --log-level debug
```

---

## Contributing

### Code Style

- **Python**: Follow PEP 8, use type hints
- **TypeScript**: Use strict mode, functional components
- **CSS**: TailwindCSS utility classes
- **Commits**: Conventional commits format

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-algorithm`)
3. Make your changes
4. Run linting and tests
5. Commit with clear messages
6. Push and create a Pull Request

### Project Standards

- All algorithms must include full metadata
- All exported functions should have JSDoc/docstrings
- Complex components should be broken into smaller pieces

---

<p align="center">
  <a href="README.md">← Back to README</a>
</p>
