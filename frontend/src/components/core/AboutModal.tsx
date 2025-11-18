import { X, Code2, Cpu, Layers, Globe, Heart, Zap, Grid3X3, Network, BarChart3, BookOpen, MousePointer2 } from 'lucide-react';

type AboutModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AboutModal({ isOpen, onClose }: AboutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-800/50">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight">
              About <span className="text-blue-500">AlgoVisualizer</span>
            </h3>
            <p className="text-gray-400 text-sm mt-1">A real-time, interactive algorithm exploration platform.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
          
          {/* 1. The Algorithms */}
          <section>
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen size={16} className="text-blue-400"/> Available Algorithms
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
                <div className="flex items-center gap-2 mb-2 text-indigo-400 font-bold">
                  <BarChart3 size={18} /> Sorting
                </div>
                <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside ml-1">
                  <li><strong>Bubble Sort:</strong> The classic stepping stone.</li>
                  <li><strong>Selection Sort:</strong> Simple minimum-finding logic.</li>
                  <li><strong>Insertion Sort:</strong> Building a sorted list one item at a time.</li>
                </ul>
              </div>
              <div className="bg-gray-800/40 p-4 rounded-lg border border-gray-700/50">
                <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold">
                  <Network size={18} /> Pathfinding
                </div>
                <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside ml-1">
                  <li><strong>Dijkstra:</strong> The gold standard for shortest paths.</li>
                  <li><strong>BFS (Breadth-First):</strong> Explores layer by layer.</li>
                  <li><strong>DFS (Depth-First):</strong> Explores deep branches first.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. Visualizers & Inputs */}
          <section>
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MousePointer2 size={16} className="text-purple-400"/> Interactive Workspaces
            </h4>
            <div className="space-y-3">
                <div className="flex gap-4 items-start">
                    <div className="bg-gray-800 p-2 rounded text-indigo-400 shrink-0"><BarChart3 size={20} /></div>
                    <div>
                        <h5 className="text-white font-bold text-sm">Sorting Workspace</h5>
                        <p className="text-xs text-gray-400 mt-1">Generate random arrays with custom ranges/sizes or input your own specific dataset. Visualize comparisons and swaps in real-time.</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="bg-gray-800 p-2 rounded text-emerald-400 shrink-0"><Grid3X3 size={20} /></div>
                    <div>
                        <h5 className="text-white font-bold text-sm">Grid Visualizer (2D)</h5>
                        <p className="text-xs text-gray-400 mt-1">A tile-based environment. Draw walls, drag Start/End nodes, and visualize search frontiers. Features "Fit-to-Screen" and zoomable canvas.</p>
                    </div>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="bg-gray-800 p-2 rounded text-pink-400 shrink-0"><Network size={20} /></div>
                    <div>
                        <h5 className="text-white font-bold text-sm">Graph Visualizer (Nodes & Edges)</h5>
                        <p className="text-xs text-gray-400 mt-1">A fully interactive graph builder. Add nodes, drag to connect edges, edit weights, and delete elements. Supports Force-Directed auto-layout.</p>
                    </div>
                </div>
            </div>
          </section>

          {/* 3. Core Features */}
          <section>
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap size={16} className="text-yellow-400"/> Power Features
            </h4>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> VCR Controls (Play/Pause/Step)
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Variable Speed Control
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Live Pseudocode Tracking
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Execution Activity Log
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Zoom & Pan Canvas
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Dynamic Guide System
                </div>
            </div>
          </section>

          {/* 4. Tech Stack */}
          <section>
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers size={16} /> Technology Stack
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex flex-col items-center gap-2 text-center">
                <Code2 size={24} className="text-blue-400" />
                <span className="text-xs font-bold text-white">React + TS</span>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex flex-col items-center gap-2 text-center">
                <Cpu size={24} className="text-green-400" />
                <span className="text-xs font-bold text-white">FastAPI</span>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex flex-col items-center gap-2 text-center">
                <Globe size={24} className="text-purple-400" />
                <span className="text-xs font-bold text-white">WebSockets</span>
              </div>
              <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex flex-col items-center gap-2 text-center">
                <Heart size={24} className="text-pink-400" />
                <span className="text-xs font-bold text-white">TailwindCSS</span>
              </div>
            </div>
          </section>

          {/* Developer Credit */}
          <div className="pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-400 text-center">
              Designed & Developed by{" "}
              <a 
                href="https://github.com/qtremors" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-white font-medium hover:text-blue-400 transition-colors underline decoration-dotted underline-offset-4 hover:decoration-solid"
              >
                Tremors
              </a>.
              <br/>
              <span className="text-xs opacity-70">Python Dev</span>
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-800/30 text-right">
          <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-600">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}