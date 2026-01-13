# AlgoVisualizer - Tasks

> **Project:** AlgoVisualizer  
> **Version:** 1.1.5  
> **Last Updated:** January 13, 2026

---

## 🟣 P3 - Code Quality
- [ ] **Frontend**: Add virtualization for `LogPanel` to handle large history.
- [ ] **Accessibility**: Add ARIA labels to playback controls.
- [ ] **Testing**: Add backend tests for pathfinding algorithms.

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
