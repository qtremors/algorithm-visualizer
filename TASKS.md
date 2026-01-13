# AlgoVisualizer - Tasks

> **Project:** AlgoVisualizer  
> **Version:** 1.1.4  
> **Last Updated:** January 15, 2026 (Refactoring Complete)

---

## 🟠 P2 - High Priority

### Frontend Performance
**File:** `frontend/src/components/visualizers/GridVisualizer.tsx`
- [ ] **Excessive Re-rendering**: `visited` and `path` Sets are recreated on every render.
- [ ] **Optimization**: Memoize derived state or move to Canvas-based rendering for larger grids.

### Type Safety
**Files:** `AlgorithmWorkspace.tsx`, `GridVisualizer.tsx`
- [ ] `GridVisualizerProps.initialData` is `any`.
- [ ] `AlgorithmWorkspace` uses `any` for `inputData`.
- [ ] **Action**: Define strict discriminative unions for `InputData` (Array vs Grid vs Graph).

---

## 🟣 P3 - Code Quality
### Component Props Using `any`
- [ ] `GridVisualizer.tsx:7` - `initialData: any`
- [ ] `GraphVisualizerProps` - `initialData: any` 
- [ ] `FeatureItem` in `HomePage.tsx:148` - `icon: any`
- [ ] Replace with proper TypeScript interfaces

---

## 🟢 P4 - Performance

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
- [ ] Missing troubleshooting section
- [ ] No WebSocket protocol/API documentation
- [ ] No architecture diagram

### Missing Documentation Files
- [ ] Add JSDoc comments to frontend hooks and core components
- [ ] Add docstrings to all backend algorithms and helper methods
- [ ] Document internal `AlgorithmStep` message types and payload structures

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
