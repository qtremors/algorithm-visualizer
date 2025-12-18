# AlgoVisualizer - Tasks & Issues

> Generated from deep code review on December 18, 2024

---

## 🔴 P0 - Critical (Fix Immediately)

### WebSocket Memory Leak
**File:** `frontend/src/hooks/useAlgorithmRunner.ts`
- [ ] Store WebSocket reference in `useRef` to persist across renders
- [ ] Add cleanup function to close WebSocket on component unmount
- [ ] Implement `AbortController` pattern for proper cleanup
- [ ] Handle case where component unmounts while WebSocket is connecting

### Missing Error Boundary
**File:** `frontend/src/pages/AlgorithmWorkspace.tsx`
- [ ] Create `ErrorBoundary` component wrapping `AlgorithmWorkspace`
- [ ] Add fallback UI with "Reset" functionality
- [ ] Log errors to console/monitoring service

### Backend Silent Failures
**Files:** `backend/app/algorithms/pathfinding/*.py`
- [ ] `dijkstra.py:105-106` - Silent `return` on invalid input; should yield error step
- [ ] `bfs.py:72-73` - Silent `return` on invalid input; should yield error step  
- [ ] `dfs.py:66-67` - Silent `return` on invalid input; should yield error step
- [ ] Return meaningful error messages for invalid input (empty grid, missing start/end)

---

## 🟠 P1 - High Priority

### Dead Code: useGraphEditor Hook
**File:** `frontend/src/hooks/useGraphEditor.ts`
- [ ] Hook is unused - all logic duplicated in `AlgorithmWorkspace.tsx` (lines 95-193)
- [ ] Either delete the hook or refactor workspace to use it
- [ ] `useGraphEditor.ts` lacks delete node/edge functionality that workspace has

### Input Validation Inconsistency
**Issue:** Sorting algorithms validate input, pathfinding algorithms don't
- [ ] `bubble_sort.py:44-46` - Has proper validation ✓
- [ ] `insertion_sort.py:42-44` - Has proper validation ✓
- [ ] `dijkstra.py:34` - Missing validation (only calls `super().__init__`)
- [ ] `bfs.py:33-50` - Missing validation
- [ ] `dfs.py:26-43` - Missing validation
- [ ] Standardize error messages across all algorithms

### CORS Security
**File:** `backend/app/main.py:11-16`
- [ ] Currently allows all origins: `allow_origins=["*"]`
- [ ] Create environment variable for allowed origins
- [ ] Restrict CORS in production deployment
- [ ] Document CORS configuration in README

### Graph Node ID Limitation
**Files:** `AlgorithmWorkspace.tsx:125`, `useGraphEditor.ts:30`
- [ ] Node IDs limited to A-Z (26 nodes max): `String.fromCharCode(65 + length)`
- [ ] Implement UUID-based or numeric node IDs
- [ ] Handle node deletion/recreation properly (IDs don't recycle)

---

## 🟡 P2 - Medium Priority

### Duplicated Deep Clone Pattern
**Issue:** Using inefficient `JSON.parse(JSON.stringify())` throughout
- [ ] `AlgorithmWorkspace.tsx:96, 121` - Object cloning
- [ ] `GridVisualizer.tsx:62` - Grid state cloning  
- [ ] `useGraphEditor.ts:14, 26` - Graph data cloning
- [ ] Replace with `structuredClone()` or `immer` library

### Duplicated Pathfinding Code
**Issue:** `get_neighbors()` and `get_snapshot()` duplicated across algorithms
- [ ] `dijkstra.py:60-86, 88-101` - Base implementation
- [ ] `bfs.py:52-64, 66-69` - Nearly identical
- [ ] `dfs.py:45-58, 60-63` - Nearly identical
- [ ] Extract to `BasePathfindingAlgorithm` class

### Missing Keyboard Shortcuts
**File:** `frontend/src/pages/AlgorithmWorkspace.tsx`
- [ ] Add `Space` for Play/Pause toggle
- [ ] Add `←/→` for Prev/Next step
- [ ] Add `R` for Reset
- [ ] Add `Escape` to close modals
- [ ] Add keyboard shortcut help tooltip

### Mobile Warning
**File:** `frontend/src/pages/AlgorithmWorkspace.tsx` or `Layout.tsx`
- [ ] README mentions "desktop only" but app doesn't warn mobile users
- [ ] Detect mobile viewport on load
- [ ] Show modal/banner warning on mobile devices

### Progress Indicator Missing
**File:** `frontend/src/components/core/PlaybackControls.tsx`
- [ ] No step counter visible (`Step X of Y`)
- [ ] No progress bar for visualization
- [ ] Consider adding estimated time remaining

### Pseudocode Line Number Mismatch
**Issue:** Some algorithm `line` references may not match pseudocode indices (0-indexed vs 1-indexed)
- [ ] Audit `bubble_sort.py` line references against pseudocode
- [ ] Audit `insertion_sort.py` line references
- [ ] Audit `dijkstra.py` line references
- [ ] Audit `bfs.py` / `dfs.py` line references

---

## 🟣 P3 - Code Quality

### No Tests Configured
**Issue:** No test framework set up for either frontend or backend
- [ ] Add `pytest` to `backend/pyproject.toml` dependencies
- [ ] Create `backend/tests/` directory with algorithm tests
- [ ] Add `vitest` to `frontend/package.json` devDependencies
- [ ] Create tests for `usePlayback` and `useAlgorithmRunner` hooks

### Type Safety Gaps
**File:** `frontend/src/types/index.ts`
- [ ] `AlgorithmStep.payload` is `any` (line 32)
- [ ] `AlgorithmStep.snapshot` is `any` (line 33)
- [ ] Create typed interfaces: `SortingPayload`, `PathfindingPayload`, etc.
- [ ] Create typed snapshots: `SortingSnapshot`, `GridSnapshot`, `GraphSnapshot`

### Component Props Using `any`
- [ ] `GridVisualizer.tsx:7` - `initialData: any`
- [ ] `GraphVisualizerProps` - `initialData: any` 
- [ ] `FeatureItem` in `HomePage.tsx:148` - `icon: any`
- [ ] Replace with proper TypeScript interfaces

### Algorithm Auto-Discovery
**File:** `backend/app/main.py:18-48`
- [ ] Hardcoded `ALGORITHMS` dictionary requires manual updates
- [ ] Implement decorator-based algorithm registration
- [ ] Auto-discover algorithms from `algorithms/` directory

### Incomplete Project Config
**File:** `backend/pyproject.toml:4`
- [ ] Description is placeholder: `"Add your description here"`
- [ ] Add project keywords, author, license

---

## 🟢 P4 - Performance

### Large Component Re-renders
**File:** `frontend/src/pages/AlgorithmWorkspace.tsx` (350 lines)
- [ ] Single large component handles too much state
- [ ] Split into smaller components (Header, VisualizerPanel, ControlPanel)
- [ ] Add `React.memo` to pure child components
- [ ] Use `useMemo` for `algorithmMetadata` (already done ✓)

### Large Dataset Support
**Issue:** No virtualization for large arrays/grids
- [ ] `SortingVisualizer` struggles with 100+ elements
- [ ] Consider canvas-based rendering for sorting
- [ ] Add performance warning for large inputs (>50 elements)
- [ ] Implement virtualization for GridVisualizer

### Accessibility Missing
**Issue:** No ARIA attributes or keyboard navigation
- [ ] Add `aria-label` to icon-only buttons
- [ ] Add `role="button"` where missing
- [ ] Ensure focus indicators are visible
- [ ] Add skip-to-content link

---

## 📚 P5 - Documentation

### README Issues
**File:** `README.md`
- [ ] Clone URL references `StartLedger/algorithm-visualizer` - verify correct
- [ ] Missing troubleshooting section
- [ ] No WebSocket protocol/API documentation
- [ ] No architecture diagram

### Missing Documentation Files
- [ ] Create `CONTRIBUTING.md` with code style guidelines
- [ ] Create `CHANGELOG.md` with version history
- [ ] Create `ARCHITECTURE.md` with detailed system design
- [ ] Add JSDoc comments to frontend hooks
- [ ] Add docstrings to backend algorithms

---

## 🔵 Roadmap Features (from README)

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

## Summary

| Priority | Count | Description |
|----------|-------|-------------|
| 🔴 P0 Critical | 3 | Memory leaks, silent failures, missing error handling |
| 🟠 P1 High | 4 | Dead code, validation gaps, security, limitations |
| 🟡 P2 Medium | 6 | Code duplication, UX gaps, consistency issues |
| 🟣 P3 Code Quality | 5 | Tests, types, configuration, maintainability |
| 🟢 P4 Performance | 3 | Re-renders, large datasets, accessibility |
| 📚 P5 Documentation | 2 | README fixes, missing docs |
| 🔵 Roadmap | 6 | Future features from README |

**Total: 29 categories, 85+ individual items**

---

## Quick Wins (< 1 hour each)
1. Replace `JSON.parse(JSON.stringify())` with `structuredClone()`
2. Delete unused `useGraphEditor.ts` hook
3. Add WebSocket cleanup in `useAlgorithmRunner`
4. Update `pyproject.toml` description
5. Add step counter to PlaybackControls

## High Impact Fixes
1. Add input validation to pathfinding algorithms
2. Add error boundary component
3. Create base pathfinding class to reduce duplication
4. Set up basic test framework
