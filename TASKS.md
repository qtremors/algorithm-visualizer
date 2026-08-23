# AlgoVisualizer Task Backlog

> **Version:** 0.1.0 | **Last Updated:** 2026-08-23

Six planned product enhancements and one deployment verification task. Only unfinished work is listed. These IDs identify the remaining work; historical review findings and verification results are summarized in [CHANGELOG.md](CHANGELOG.md) and [DEVELOPMENT.md](DEVELOPMENT.md#historical-verification).

Source locations describe the current implementation and should be rechecked before work begins.

## Workspace and Learning Tools

- [ ] **FEAT-0001 - Compare Algorithms Side by Side**
  - **Location:** `frontend/src/pages/AlgorithmWorkspace.tsx`, `frontend/src/hooks/useAlgorithmWorkspace.ts`, `frontend/src/hooks/usePlayback.ts`.
  - **Current:** The workspace runs one selected algorithm at a time.
  - **Change:** Compare algorithms using the same input, synchronized playback, and execution metrics. Define how runs with different step counts advance and finish.

- [ ] **FEAT-0002 - Save and Share Sessions**
  - **Location:** `frontend/src/hooks/useAlgorithmWorkspace.ts`, `frontend/src/lib/input.ts`, `frontend/src/types/input.ts`.
  - **Current:** Editor drafts belong to the current workspace; there is no session persistence or import/export format.
  - **Change:** Add session persistence, validated import/export, and shareable URLs. Define format versions and size limits, and preserve separate input drafts.

## Algorithms and Inputs

- [ ] **FEAT-0003 - Generate Mazes**
  - **Location:** `frontend/src/components/inputs/GridInput.tsx`, `frontend/src/lib/input.ts`.
  - **Current:** The grid editor supports manual walls and weighted cells without Recursive Backtracker or Prim maze generation.
  - **Change:** Add both maze generators with valid endpoints and clear handling of existing walls and weights.

- [ ] **FEAT-0004 - Add Merge Sort and Quick Sort**
  - **Location:** `backend/app/algorithms/sorting/`, `backend/app/main.py`, `frontend/src/components/visualizers/SortingVisualizer.tsx`.
  - **Current:** Sorting includes Bubble Sort, Selection Sort, and Insertion Sort.
  - **Change:** Add registered implementations, pseudocode, explanations, and suitable intermediate visualizations. Cover duplicates, signed values, and stable snapshots in tests.

- [ ] **FEAT-0005 - Add A* and Bellman-Ford**
  - **Location:** `backend/app/algorithms/pathfinding/`, `backend/app/validation.py`, `frontend/src/components/inputs/GraphInput.tsx`.
  - **Current:** Pathfinding includes BFS, DFS, and Dijkstra; graph validation rejects negative weights.
  - **Change:** Add A* with heuristic selection and Bellman-Ford with negative-edge support. Define negative-cycle results and algorithm-specific validation without weakening Dijkstra's nonnegative-weight contract.

- [ ] **FEAT-0006 - Visualize Search Trees**
  - **Location:** `backend/app/registry.py`, `frontend/src/types/input.ts`, `frontend/src/lib/protocol.ts`, `frontend/src/components/visualizers/`.
  - **Current:** Input and visualizer contracts cover sorting arrays, grids, and graphs.
  - **Change:** Add BST/AVL operations and tree traversals with explicit tree inputs, step contracts, visualizations, and regression coverage.

## Deployment Verification

- [ ] **VERIFY-0001 - Verify Deployed Routing and WebSocket Execution**
  - **Location:** `vercel.json`, `api/index.py`, `frontend/src/lib/api.ts`, `backend/app/main.py`.
  - **Current:** Deployment configuration exists; the earlier local review did not verify a production deployment or establish that the public demo runs the current code.
  - **Change:** Verify the intended frontend/backend origins, health and metadata routes, HTTPS/WSS upgrade, a full run with terminal completion, cancellation, errors, and direct SPA route refreshes. Record the host, revision, date, and observed results in the developer guide.
