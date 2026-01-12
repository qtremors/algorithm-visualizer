<p align="center">
  <img src="frontend/public/algoviz.png" alt="AlgoVisualizer Logo" width="120"/>
</p>

<h1 align="center"><a href="https://tremors-algoviz.netlify.app">AlgoVisualizer</a></h1>

<p align="center">
  A high-performance, interactive educational platform that demystifies complex algorithms through real-time visualization.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/FastAPI-0.121-009688?logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/WebSocket-Streaming-purple" alt="WebSocket">
  <img src="https://img.shields.io/badge/License-TSL-red" alt="License">
</p>

> [!NOTE]
> **Personal Project** 🎯 I built this to deeply understand sorting and pathfinding algorithms by implementing them from scratch with real-time visual feedback. Feel free to explore and learn from it!

## Live Website 

**➡️ [tremors-algoviz.netlify.app](https://tremors-algoviz.netlify.app)**

> **Live Demo Limitations**: The backend may take a few seconds to wake up on first visit (cold start).

> [!WARNING]
> **Desktop Optimized**: This application features complex grid layouts and interactive controls that require a mouse and larger screen. Mobile support is limited.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| ⚡ **Real-Time Execution** | Algorithms run live on the backend, streaming steps via WebSocket |
| 🎮 **VCR-Style Controls** | Play, Pause, Step Forward/Back, Reset, and variable speed (10ms-500ms) |
| 📊 **Sorting Algorithms** | Bubble Sort, Selection Sort, Insertion Sort with color-coded comparisons |
| 🕸️ **Pathfinding Algorithms** | Dijkstra, BFS, DFS on both 2D Grids and Network Graphs |
| 💻 **Pseudocode Tracking** | Live highlighting of the current execution line |
| 📝 **Execution Log** | Scrollable history of every operation |
| 🎓 **Educational Modals** | Time/Space complexity, pros, cons for each algorithm |

---

## 📸 Screenshots

<p align="center">
  <img src="assets/sorting.png" alt="Sorting Visualization" width="400"/>
  <img src="assets/sorted.png" alt="Sorted Result" width="400"/>
</p>

<p align="center">
  <img src="assets/pathfinding.png" alt="Pathfinding in Progress" width="400"/>
  <img src="assets/pathfound.png" alt="Path Found" width="400"/>
</p>

---

## 🚀 Quick Start

```bash
# Clone and navigate
git clone https://github.com/qtremors/algorithm-visualizer.git
cd algorithm-visualizer

# Start Backend (Terminal 1)
cd backend
uv run uvicorn app.main:app --reload

# Start Frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173** 🎉

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS |
| **Backend** | Python 3.11+, FastAPI, WebSockets |
| **Protocol** | Real-time WebSocket streaming |
| **Package Managers** | npm (frontend), uv (backend) |

---

## 📁 Project Structure

```
algorithm-visualizer/
├── backend/              # FastAPI Python backend
│   ├── app/
│   │   ├── main.py       # Entry point, WebSocket handler
│   │   ├── base_algorithm.py
│   │   └── algorithms/   # Sorting & Pathfinding implementations
│   └── pyproject.toml
├── frontend/             # React TypeScript frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # HomePage, AlgorithmWorkspace
│   │   └── types/        # TypeScript definitions
│   └── package.json
├── assets/               # Screenshot images
├── DEVELOPMENT.md        # Developer documentation
├── CHANGELOG.md          # Version history
├── LICENSE.md            # License terms
└── README.md
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [DEVELOPMENT.md](DEVELOPMENT.md) | Architecture, setup, API reference |
| [CHANGELOG.md](CHANGELOG.md) | Version history and release notes |
| [LICENSE.md](LICENSE.md) | License terms and attribution |
| [TASKS.md](TASKS.md) | Project tasks and roadmap |

---

## 📄 License

**Tremors Source License (TSL)** - Source-available license allowing viewing, forking, and derivative works with **mandatory attribution**. Commercial use requires written permission.

See [LICENSE.md](LICENSE.md) for full terms.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/qtremors">Tremors</a>
</p>
