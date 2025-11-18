# AlgoVisualizer

**AlgoVisualizer** is a high-performance, interactive educational platform designed to demystify complex algorithms. By visualizing execution steps in real-time, it bridges the gap between abstract code and tangible logic.

Built with a **FastAPI (Python)** backend for robust execution logic and a **React (TypeScript)** frontend for a responsive, modern UI, this project leverages **WebSockets** to stream algorithm states frame-by-frame.

---

## 🖼️ Screenshots

| Sorting View | Sorted View |
|:---------:|:------------:|
| ![Sorting](assets/sorting.png) | ![Sorted](assets/sorted.png) |

| Path-Finding View | Path-Found View |
|:---------:|:------------:|
| ![Path-Finding](assets/pathfinding.png) | ![Path-Found](assets/pathfound.png) |

### Static screenshots don't do the project justice—check out the live **[Algorithm Visualizer](https://tremors-algoviz.netlify.app/)** in action.

---


### ⚡ Real-Time Execution

Unlike traditional visualizers that pre-calculate steps, AlgoVisualizer runs algorithms live on the backend.

- **WebSocket Streaming:** The backend yields execution states (comparisons, swaps, path visits) which are streamed instantly to the frontend.
    
- **VCR-Style Controls:** Play, Pause, Step Forward, Step Backward, and Reset execution at any point.
    
- **Variable Speed:** Adjust playback speed from 10ms (near instant) to 1000ms (slow motion) to follow complex logic.
    

### 📊 Sorting Algorithms

Visualize how different strategies sort data arrays.

- **Algorithms:** Bubble Sort, Selection Sort, Insertion Sort.
    
- **Custom Input:** Type your own comma-separated list of numbers.
    
- **Random Generator:** Generate arrays with custom size (5-100) and value ranges.
    
- **Visuals:** Color-coded bars indicate comparisons (Yellow), swaps (Red), and sorted elements (Green).
    

### 🕸️ Pathfinding Algorithms

Navigate through complex 2D grids and graph networks.

- **Algorithms:** Dijkstra's Algorithm, Breadth-First Search (BFS), Depth-First Search (DFS).
    
- **Dual Views:**
    
    - **Grid View:** A tile-based interactive map.
        
        - **Draw Walls:** Click and drag to create obstacles.
            
        - **Move Points:** Drag Start (Green) and End (Red) nodes.
            
        - **Smart Resizing:** "Fit to Screen" mode or Zoom/Scroll for massive grids.
            
    - **Graph View:** A node-link diagram.
        
        - **Add Nodes:** Click anywhere to create vertices.
            
        - **Connect Nodes:** Drag between nodes to create weighted edges.
            
        - **Delete Mode:** Remove nodes/edges with a click.
            
        - **Auto-Layout:** Generates Random Trees or Mesh Networks instantly.
            

### 🧠 Educational Tools

- **Pseudocode Tracking:** The active line of code highlights in sync with the visualization.
    
- **Execution Log:** A scrollable history of every operation (e.g., "Swapping index 4 and 5", "Visiting Node A").
    
- **Info Modals:** Detailed breakdown of Time Complexity, Space Complexity, Pros, and Cons for every algorithm.
    

## 🎮 Controls & Usage

### General

- **Spacebar:** Play / Pause
    
- **Left / Right Arrow:** Step Backward / Forward
    
- **R:** Reset Visualization
    

### Graph View

- **Node Tool:** Click empty space to add a Node.
    
- **Connect Tool:** Drag from Node A to Node B to create an edge.
    
- **Delete Tool:** Click a Node or Edge Weight to remove it.
    
- **Move Tool:** Drag Nodes to rearrange the layout.
    
- **Toggle Colors:** Switch connector coloring on/off for clarity.

## 🛠️ Technology Stack

### Frontend (Client)

- **Framework:** React 18 + TypeScript
    
- **Build Tool:** Vite
    
- **Styling:** TailwindCSS (for responsive, utility-first design)
    
- **Icons:** Lucide React
    
- **State Management:** React Context API + Custom Hooks (`usePlayback`, `useAlgorithmRunner`)
    

### Backend (Server)

- **Framework:** FastAPI (Python 3.9+)
    
- **Protocol:** WebSockets (via `fastapi.websockets`)
    
- **Design Pattern:** Strategy Pattern (BaseAlgorithm class with polymorphic implementations)
    
- **Server:** Uvicorn (ASGI)
    

## 🏗️ Architecture

The project follows a **Metadata-Driven UI** architecture.

1. **Discovery:** On load, the Frontend fetches the `/api/algorithms` registry. This JSON response dictates which algorithms exist, their inputs (Array vs Grid), and their visualizers.
    
2. **Execution:**
    
    - User clicks "Visualize".
        
    - Frontend sends the `initial_data` (Array or Adjacency Matrix) via WebSocket.
        
    - Backend instantiates the specific Algorithm Class (e.g., `BubbleSort`).
        
    - The `run()` method is a **Python Generator** that `yields` a `step` dictionary for every atomic action.
        
3. **Rendering:**
    
    - Frontend receives the stream of steps.
        
    - `usePlayback` hook buffers them and manages the "current frame" index.
        
    - `SortingVisualizer` or `GraphVisualizer` renders the state at that specific index.
        

## 📦 Installation & Setup

### Prerequisites

- Node.js (v18+)
    
- Python (v3.9+)
    

### 1. Backend Setup

```python
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Server
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Dev Server
npm run dev
```

Visit `http://localhost:5173` to start visualizing!

---

Designed & Developed by **Tremors** with 💖