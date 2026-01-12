# Changelog

> **Project:** AlgoVisualizer  
> **Version:** 1.1.1  
> **Last Updated:** 2026-01-12

---

## [1.1.1] - 2025-12-18

### Added
- Comprehensive TASKS.md with deep code review findings
- Organized issues by priority (P0 Critical to P5 Documentation)
- Added 29 issue categories with 85+ individual items
- Included specific file references and line numbers
- Added Quick Wins and High Impact sections for prioritization

---

## [1.1.0] - 2025-11-18

### Added

**Core Integration & Logic**
- Implemented "Delete Mode" for Graph View to remove nodes and edges interactively

**Visualizers & Workspace**
- Refactored `GraphVisualizer` and `GridVisualizer` to support dynamic "Fit to Screen" vs "Zoom/Scroll" modes
- Added "Show Final Path" text overlay (A→B→C) for Graph View
- Added "Edge Coloring" toggle for Graph View to distinguish connections visually
- Centralized all view controls (Zoom, Fit, Path Toggle, Color Toggle) into `PlaybackControls`
- Fixed canvas overflow and scrolling behaviors for zoomed layouts

**UI/UX Enhancements**
- Home Page: Added staggered text reveal animation on hover using CSS transitions and variables
- Footer: Added a universal footer with dynamic, context-aware "Guide" modal (showing different instructions for Sorting vs Pathfinding) and an "About" modal
- Mobile warning overlay to inform users about desktop optimization
- Cold-start UI feedback when backend server is waking up

**Weighted Graph View** (2025-11-18)
- Hybrid View: Implemented a view-switcher allowing users to toggle between Grid and Node-Link graph modes in the Pathfinding category
- Physics-based Layout: Developed a repulsion system during generation to guarantee a minimum distance (100px) between nodes, resolving overlaps and cluster issues
- Semantic Zoom: Added a zoom slider (0.5x - 1.5x) that scales the graph coordinates, creating space between nodes for better viewing of dense networks
- Enhanced Interactivity: Implemented click-to-add nodes, drag-to-connect edges, and click-to-edit weights
- Fixed coordinate mapping logic to correctly handle mouse clicks/drags across the scrollable canvas
- Robust State Management: Finalized the `handleInputUpdate` and `handleReset` logic to expose and utilize `resetSteps()`, ensuring the animation state is immediately cleared and the graph is unlocked for editing after every run or reset
- Layout Fix: Updated `GraphVisualizer` to dynamically size the SVG based on content, resolving the "graph clipping" issue and ensuring the canvas is fully scrollable

---

## [1.0.0] - 2025-11-17

### Added

**Architecture & Stack**
- Monorepo structure with FastAPI (Backend) and React/TypeScript (Frontend)
- Implemented WebSocket streaming for real-time, step-by-step visualization
- Metadata-driven UI: Frontend dynamically renders inputs/visualizers based on backend configuration

**Backend (FastAPI)**
- Created abstract `BaseAlgorithm` class using Python generators to yield visualization steps
- Implemented Sorting Algorithms: Bubble Sort, Selection Sort, Insertion Sort
- Implemented Pathfinding Algorithms: Dijkstra, BFS, DFS
- Added comprehensive metadata (pseudocode, complexity, descriptions) for all algorithms

**Frontend (React + Vite + Tailwind)**
- Developed a responsive, dark-themed dashboard
- Interactive Grid: Supports wall drawing, start/end node movement, and random maze generation with adjustable density
- Interactive Array: Supports random generation and custom input parsing
- Playback Engine: Custom hooks for Play, Pause, Step-through, Speed control, and Reset

**Educational Features**
- Dynamic Pseudocode highlighting
- Live scrolling Status Log
- "Info Modal" displaying time/space complexity and pros/cons
- "Combined View" modal for side-by-side code and logs

**UI/UX**
- Integrated Lucide React icons for a polished look
- Implemented auto-scrolling logs and responsive layout management

---

## [0.1.0] - 2025-11-13

### Removed
- Removed initial temporary MVP implementation
- This version was intended only for early experimentation and was replaced with the full production-ready architecture

---

## [0.0.1] - 2025-09-01

### Added
- Initial commit
- Project scaffolding
- Basic README documentation
- First deployment configuration (2025-09-15)
