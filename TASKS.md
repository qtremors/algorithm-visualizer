# AlgoVisualizer Task Backlog

> **Version:** 0.1.3 | **Last Updated:** 2026-11-11

Six completed product enhancements and one outstanding deployment verification task. Checked items shipped in 0.1.2–0.1.3. These IDs identify the remaining work; historical review findings and verification results are summarized in [CHANGELOG.md](CHANGELOG.md) and [DEVELOPMENT.md](DEVELOPMENT.md#historical-verification).

Source locations describe the current implementation and should be rechecked before work begins.

## Workspace and Learning Tools

- [x] **FEAT-0001 - Compare Algorithms Side by Side**
  - **Location:** `frontend/src/pages/AlgorithmWorkspace.tsx`, `frontend/src/hooks/useAlgorithmWorkspace.ts`, `frontend/src/hooks/usePlayback.ts`.
  - **Current:** The comparison workspace runs two algorithms on identical input with a shared playhead and per-lane metrics.
  - **Change:** Compare algorithms using the same input, synchronized playback, and execution metrics. Define how runs with different step counts advance and finish.

- [x] **FEAT-0002 - Save and Share Sessions**
  - **Location:** `frontend/src/hooks/useAlgorithmWorkspace.ts`, `frontend/src/lib/input.ts`, `frontend/src/types/input.ts`.
  - **Current:** Versioned sessions persist separate drafts, validate imports, and support export and share URLs.
  - **Change:** Add session persistence, validated import/export, and shareable URLs. Define format versions and size limits, and preserve separate input drafts.

## Algorithms and Inputs

- [x] **FEAT-0003 - Generate Mazes**
  - **Location:** `frontend/src/components/inputs/GridInput.tsx`, `frontend/src/lib/input.ts`.
  - **Current:** The grid editor includes seeded Recursive Backtracker and Prim maze generation with reachable endpoints.
  - **Change:** Add both maze generators with valid endpoints and clear handling of existing walls and weights.

- [x] **FEAT-0004 - Add Merge Sort and Quick Sort**
  - **Location:** `backend/app/algorithms/sorting/`, `backend/app/main.py`, `frontend/src/components/visualizers/SortingVisualizer.tsx`.
  - **Current:** Sorting includes Bubble Sort, Selection Sort, Insertion Sort, Merge Sort, and Quick Sort.
  - **Change:** Add registered implementations, pseudocode, explanations, and suitable intermediate visualizations. Cover duplicates, signed values, and stable snapshots in tests.

- [x] **FEAT-0005 - Add A* and Bellman-Ford**
  - **Location:** `backend/app/algorithms/pathfinding/`, `backend/app/validation.py`, `frontend/src/components/inputs/GraphInput.tsx`.
  - **Current:** Pathfinding includes A* and Bellman–Ford; negative weights are accepted only by Bellman–Ford, with explicit reachable negative-cycle results.
  - **Change:** Add A* with heuristic selection and Bellman-Ford with negative-edge support. Define negative-cycle results and algorithm-specific validation without weakening Dijkstra's nonnegative-weight contract.

- [x] **FEAT-0006 - Visualize Search Trees**
  - **Location:** `backend/app/registry.py`, `frontend/src/types/input.ts`, `frontend/src/lib/protocol.ts`, `frontend/src/components/visualizers/`.
  - **Current:** Explicit tree contracts support BST/AVL insertion, deletion, search, and inorder/preorder/postorder traversals.
  - **Change:** Add BST/AVL operations and tree traversals with explicit tree inputs, step contracts, visualizations, and regression coverage.

## Deployment Verification

- [ ] **VERIFY-0001 - Verify Deployed Routing and WebSocket Execution**
  - **Location:** `vercel.json`, `api/index.py`, `frontend/src/lib/api.ts`, `backend/app/main.py`.
  - **Current:** Deployment configuration exists; public deployment verification was blocked by a network-policy 403; `scripts/smoke.py` verifies HTTP/WSS completion, cancellation, errors, and SPA routing when the host is reachable.
  - **Change:** Verify the intended frontend/backend origins, health and metadata routes, HTTPS/WSS upgrade, a full run with terminal completion, cancellation, errors, and direct SPA route refreshes. Record the host, revision, date, and observed results in the developer guide.
