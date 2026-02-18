# AlgoVisualizer - Tasks

> **Project:** AlgoVisualizer  
> **Version:** 1.1.5  
> **Last Updated:** February 18, 2026

---

## 🔴 P0 - Critical

### CORS Configuration Bug
- [ ] **Backend**: Fix `ALLOWED_ORIGINS` empty string handling in `main.py` (line 14-15)
  - If `ALLOWED_ORIGINS=""`, split produces `[""]` instead of `["*"]`
  - **Fix**: Add check for empty string before splitting

### Missing Input Validation  
- [ ] **Backend**: Validate row lengths in `BasePathfindingAlgorithm` constructor
  - Jagged grids (rows with different lengths) will cause runtime errors

### Missing `.gitignore`
- [ ] **Root**: No `.gitignore` file exists in the project
  - Risk of committing `node_modules/`, `__pycache__/`, `.env`, `dist/`, `.venv/` etc.
  - **Security risk**: Without `.gitignore`, secrets could be accidentally committed

### Missing `.env.example` / `.env` Configuration
- [ ] **Root**: No `.env.example` file exists to document required environment variables
  - `VITE_API_BASE_URL` is referenced in frontend code but nowhere documented as a file
  - `ALLOWED_ORIGINS` is referenced in `main.py` but undocumented
  - No `.env` is in `.gitignore` (because `.gitignore` doesn't exist)

### WebSocket DoS Vector — No Input Size Limits
- [ ] **Backend**: No upper-bound validation on input sizes in WebSocket handler (`main.py` line 58-76)
  - A client can send a grid of 10000×10000, or an array of millions of elements
  - This would consume all server memory/CPU with no protection
  - **Fix**: Add configurable `MAX_ARRAY_SIZE`, `MAX_GRID_ROWS`, `MAX_GRID_COLS` constants and validate before algorithm instantiation

### WebSocket — No Rate Limiting
- [ ] **Backend**: No rate limiting on WebSocket connections in `main.py`
  - A malicious client can open unlimited concurrent connections
  - Each connection spawns a full algorithm execution

---

## 🟠 P1 - High Priority

### Type Safety Issues
- [ ] **Frontend**: Fix `comparision` → `comparison` typo in `SortingPayload` (`types/index.ts` line 31)
- [ ] **Frontend**: Remove unused `rows`/`cols` from `GridInputData` type (`types/input.ts` lines 5-6)
- [ ] **Frontend**: Add safe access for `algorithms[category]` in `AlgorithmWorkspace.tsx` (line 73)
  - Currently crashes if category not found in algorithms object

### Semantic Mismatches
- [ ] **Frontend**: Fix `onNodeDragStart` semantic mismatch in `VisualizerPanel.tsx` (line 93)
  - Prop is named `onNodeDragStart` but actually used for `connectStart` action
  - Consider renaming to `onConnectStart` for clarity

### Unused Code
- [ ] **Frontend**: Remove unused props in `StatusLog.tsx`: `currentMessage`, `isFinished`, `category`, `resetKey`
- [ ] **Frontend**: Remove unused `onRun` prop in `ArrayInput.tsx` (line 6, 10)
- [ ] **Frontend**: Remove unused `onNodeDrag` and `onNodeDragEnd` props in `GraphVisualizer.tsx` (lines 21-22)
- [ ] **Backend**: Remove unused `List` import in `registry.py` (line 1)

### Dead/Leftover Files
- [ ] **Frontend**: Delete `App.css` — this is a Vite scaffold leftover, not imported or used anywhere
  - Contains default Vite template styles (`.logo`, `.card`, `.read-the-docs`, `#root` etc.)
  - The actual styles are in `index.css`

### DFS Algorithm — Redundant/Confusing Data Structures
- [ ] **Backend**: `dfs.py` uses both `visited` and `processed` sets, which is confusing
  - `visited` tracks "added to stack", `processed` tracks "popped from stack"
  - Naming doesn't convey this distinction; consider renaming to `in_stack` / `explored` or adding comments

### `GraphVisualizer` — Duplicate Edge Rendering
- [ ] **Frontend**: `GraphVisualizer.tsx` `renderEdges()` renders edges for *both* directions of bidirectional edges
  - Adjacency is stored symmetrically (`A→B` and `B→A`), so every edge is rendered twice
  - Results in doubled SVG elements and doubled weight badges
  - **Fix**: Track rendered pairs with a `Set` to skip `(B, A)` if `(A, B)` already rendered

### `GraphVisualizer` — `visited` / `pathSet` Recreated Every Render
- [ ] **Frontend**: `GraphVisualizer.tsx` lines 42-44 create `new Set()` on every render without `useMemo`
  - `visited`, `pathSet`, and `currentNode` are raw computations in the component body
  - This is inconsistent with `SortingVisualizer` and `GridVisualizer` which use `useMemo`

---

## 🟡 P2 - Medium Priority

### Code Quality - Type `any` Usage
- [ ] **Frontend**: Replace `any` types in `WorkspaceHeader.tsx` props (lines 10, 18-21)
- [ ] **Frontend**: Replace `any` types in `VisualizerPanel.tsx` props (lines 9, 12, 17, 19, 22)
- [ ] **Frontend**: Replace `any` types in `GridInput.tsx` (`onSubmit`, `currentData` props)
- [ ] **Frontend**: Replace `any` types in `GraphInput.tsx` (`onSubmit`, `currentData` props, `ToolButton` component)
- [ ] **Frontend**: Replace `any` casts in `GridVisualizer.tsx` (lines 23, 25, 26, 55, 56)
- [ ] **Frontend**: Type the `tempLine` state properly in `useAlgorithmWorkspace.ts` (line 36)
  - Currently `{ start: any, end: any }`
- [ ] **Frontend**: Both `GridInput.tsx` (line 145) and `GraphInput.tsx` (line 210) define duplicate `ToolButton` components with `any` props
  - Extract into a shared typed component in `components/core/`

### Naming Issues
- [ ] **Frontend**: Rename `minDesc` → `minDist` in `GraphInput.tsx` (line 28)
  - Variable name is confusing for minimum distance constant

### Documentation
- [ ] **Root**: Add `TASKS.md` to project structure in `README.md` (under docs section)
- [ ] **Backend**: Add docstrings to `registry.py` methods
- [ ] **Root**: `DEVELOPMENT.md` CORS section (line 163) says `allow_origins=["*"]` but actual code uses `ALLOWED_ORIGINS` env var — documentation is stale
- [ ] **Root**: `DEVELOPMENT.md` "Adding New Algorithms" section (line 222) describes the old manual `ALGORITHMS` dict registration, but the codebase now uses decorator-based `AlgorithmRegistry` — documentation is stale and misleading
- [ ] **Root**: `DEVELOPMENT.md` project structure (line 72-74) is missing `base_pathfinding.py` and `registry.py` files

### `useAlgorithmRunner` — Error Message Parsing
- [ ] **Frontend**: `useAlgorithmRunner.ts` line 65 relies on `event.reason` for WebSocket close error messages
  - Not all browsers populate `event.reason`; the error message may be lost
  - Consider having the server send an explicit error step before closing

### `ArrayInput` — Silent Failure on Invalid Input
- [ ] **Frontend**: `ArrayInput.tsx` line 45 has empty `catch {}` block
  - Invalid input silently fails with no user feedback
  - The `error` state is never set for parse failures

### `ArrayInput` — Missing `disabled` State on Generator Controls
- [ ] **Frontend**: `ArrayInput.tsx` — the generator controls (size, min, max, generate button) are not disabled when `disabled` prop is true
  - Only the text input field respects the `disabled` prop (line 72)
  - User can generate new arrays while running

### `GridInput` — Potential Crash on Empty Grid
- [ ] **Frontend**: `GridInput.tsx` line 20 (`currentData.grid[0].length`) will crash if `currentData.grid` exists but is an empty array `[]`

### `GridVisualizer` — Missing Drag Support
- [ ] **Frontend**: `GridVisualizer.tsx` only uses `onMouseDown` for wall drawing (line 113)
  - No `onMouseMove` handler with drag state means drawing walls requires clicking each cell individually
  - Grid tools say "click or drag" in the guide but drag is not implemented

### Footer — Hardcoded Copyright Year
- [ ] **Frontend**: `Footer.tsx` line 28 has `© 2026 AlgoVisualizer` hardcoded
  - Should use `new Date().getFullYear()` for future-proofing

### `SortingVisualizer` — `Math.max(...arrayState)` Crash on Large Arrays
- [ ] **Frontend**: `SortingVisualizer.tsx` line 17 uses spread operator with `Math.max`
  - `Math.max(...arrayState, 1)` will throw `RangeError: Maximum call stack size exceeded` for arrays with ~10,000+ elements
  - **Fix**: Use `Math.max` with `reduce()` instead

### `usePlayback` Hook — Missing `speed` Dependency in `useEffect`
- [ ] **Frontend**: `usePlayback.ts` — the `requestAnimationFrame` loop uses `speed` but `speed` is not in the `useEffect` dependencies
  - Speed changes during playback won't take effect until play is toggled

### Graph Generation — 52-Node Limit
- [ ] **Frontend**: `GraphInput.tsx` `getLabel()` function (line 70, 110) only supports up to 52 nodes (A-Z, a-z)
  - `nodeCount` input allows up to 50, but the max on the input (line 179) can be bypassed
  - Should either enforce the limit or extend labeling beyond 52

---

## 🔵 P3 - Code Quality

### Testing Improvements
- [ ] Add backend tests for pathfinding algorithms (currently only sorting tested)
- [ ] Add frontend hook tests for `useAlgorithmRunner`
- [ ] Add component tests for visualizers
- [ ] `test_bubble_sort.py` uses `sys.path` manipulation (line 6) — should use proper `conftest.py` or project-level test configuration

### Accessibility
- [ ] Add ARIA labels to icon-only buttons in `PlaybackControls.tsx`
- [ ] Add `role="button"` where missing on interactive elements
- [ ] Ensure focus indicators are visible across all controls
- [ ] Add skip-to-content link for screen readers
- [ ] Modals (`AboutModal`, `GuideModal`, `InfoModal`) lack focus trapping — Tab key escapes the modal
- [ ] Modals don't close on `Escape` key press
- [ ] Grid cells lack any ARIA information (role, aria-label for walls/start/end)

### Performance - Large Dataset Support
- [ ] Add virtualization for `LogPanel` to handle large history
- [ ] Add virtualization for `SortingVisualizer` (struggles with 100+ elements)
- [ ] Consider canvas-based rendering for sorting visualizations
- [ ] Add performance warning for large inputs (>50 elements)
- [ ] Implement virtualization for `GridVisualizer`
- [ ] `GridVisualizer` renders every cell as a separate DOM element — for a 50×50 grid that's 2500 divs
- [ ] `GraphInput.applyRepulsion()` runs O(n² × 50 iterations) synchronously on every graph generation — can freeze UI for large node counts

### Minor Code Cleanup
- [ ] **Backend**: Fix leading space typo in `selection_sort.py` pros list (line 36)
  - `" performs well on small lists."` should be `"Performs well on small lists."`
- [ ] Add NaN validation when parsing weights in `GraphInput.tsx` (line 129)
- [ ] **Frontend**: `useAlgorithmWorkspace.ts` line 34 — `setResetKey(k => k + 1)` state is used but `resetKey` is only passed down, never actually used in `StatusLog` (confirmed it's in the unused props list)
- [ ] **Frontend**: `AlgorithmContext.tsx` — the `isWakingUp` logic (lines 38-40) uses a fixed 1500ms threshold to detect cold starts; this is a heuristic that may not work consistently across different hosting providers
- [ ] **Frontend**: `useAlgorithmRunner.ts` — `useRef` for `wsRef` stores `WebSocket | null` but the cleanup in `useEffect` (line 88-95) doesn't check `readyState` before closing — may call `.close()` on an already-closed socket
- [ ] **Backend**: `base_pathfinding.py` — weight for grid wall-adjacent tiles is hardcoded to `5` (line 72) with no documentation explaining why this value was chosen

### Inconsistencies
- [ ] **Backend**: `bubble_sort.py` and `insertion_sort.py` validate `all(isinstance(x, int) for x in data)` but don't validate for empty lists
- [ ] **Backend**: Sorting algorithms accept only `int` but the frontend `ArrayInput` uses `parseInt` which can produce valid but unexpected values (e.g., `3.14` → `3`)
- [ ] **Frontend**: `SortingVisualizer` uses `useMemo` for derived state, `GridVisualizer` uses `useMemo`, but `GraphVisualizer` does not — inconsistent memoization strategy
- [ ] **Frontend**: `HomePage.tsx` uses hardcoded algorithm descriptions and icons rather than pulling from the API metadata — will get out of sync when algorithms are added

---

## 🟣 P4 - Enhancements

### Algorithm Comparison Mode
- [ ] Design side-by-side layout for "Race Mode"
- [ ] Implement dual WebSocket connections
- [ ] Sync playback between visualizers
- [ ] Add comparison metrics display

### Procedural Maze Generation
- [ ] Implement Recursive Backtracker algorithm
- [ ] Implement Prim's Maze Algorithm
- [ ] Add maze generation button to GridInput

### New Sorting Algorithms
- [ ] Implement Merge Sort (with tree visualization)
- [ ] Implement Quick Sort (with partition visualization)
- [ ] Update visualizer to handle divide-and-conquer patterns

### New Pathfinding Algorithms
- [ ] Implement A* (add heuristic support)
- [ ] Implement Bellman-Ford (handle negative edges)
- [ ] Add heuristic selector for A*

### Tree Data Structures
- [ ] Create tree visualizer component
- [ ] Implement BST with insert/delete/search
- [ ] Implement AVL Tree with rotations
- [ ] Add tree traversal algorithms (inorder, preorder, postorder)

### Session Persistence
- [ ] Save grid/graph state to localStorage
- [ ] Generate shareable URLs with encoded state
- [ ] Add import/export functionality

---

## ✅ Recently Completed (v1.1.5)

- [x] Optimized `GridVisualizer` performance with memoized `visited`/`path` sets
- [x] Enforced strict type safety for algorithm inputs (`GridInputData`, `GraphInputData`)
- [x] Optimized sorting algorithms by removing O(N) snapshot copying
- [x] Refactored `AlgorithmWorkspace` God Component into modular structure
- [x] Configured pytest for backend and Vitest for frontend
- [x] Fixed WebSocket memory leaks with proper cleanup
- [x] Added global `ErrorBoundary` to prevent crashes
- [x] Added keyboard shortcuts for playback
- [x] Added mobile warning overlay
