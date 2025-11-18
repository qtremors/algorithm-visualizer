import { useState } from 'react';
import { X, MousePointer2, Keyboard, Move, Edit3, Trash2, GitCommit, PlayCircle, Grid3X3, Network } from 'lucide-react';
import { cn } from '../../lib/utils';

type GuideModalProps = {
  isOpen: boolean;
  onClose: () => void;
  category: string;
};

export default function GuideModal({ isOpen, onClose, category }: GuideModalProps) {
  const [activeTab, setActiveTab] = useState<'grid' | 'graph'>('grid');

  if (!isOpen) return null;

  const renderContent = () => {
    switch (category) {
      case 'home':
        return (
          <div className="space-y-4">
            <p className="text-gray-300">Welcome to AlgoVisualizer! Here is how to get started:</p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400"><MousePointer2 size={20} /></div>
                <div>
                  <span className="block text-white font-bold">Select a Category</span>
                  <span className="text-sm text-gray-400">Choose between Sorting or Pathfinding from the main menu cards.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400"><PlayCircle size={20} /></div>
                <div>
                  <span className="block text-white font-bold">Interactive Demos</span>
                  <span className="text-sm text-gray-400">Each algorithm runs in real-time. You can control speed, pause, and step through execution.</span>
                </div>
              </li>
            </ul>
          </div>
        );

      case 'sorting':
        return (
          <div className="space-y-4">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <h4 className="text-white font-bold mb-2 flex items-center gap-2"><Edit3 size={16} /> Input Methods</h4>
              <p className="text-sm text-gray-400">
                • <strong>Generator:</strong> Create random arrays by defining size and range.<br/>
                • <strong>Custom:</strong> Type comma-separated numbers (e.g., 10, 45, 99) to sort your own data.
              </p>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <h4 className="text-white font-bold mb-2 flex items-center gap-2"><PlayCircle size={16} /> Controls</h4>
              <p className="text-sm text-gray-400">
                Use the playback bar to <strong>Play</strong>, <strong>Pause</strong>, or scrub through steps. Adjust the slider to speed up the sorting animation.
              </p>
            </div>
          </div>
        );

      case 'pathfinding':
        return (
          <div className="flex flex-col h-full">
            {/* Tabs for Grid vs Graph */}
            <div className="flex space-x-2 mb-4 border-b border-gray-700 pb-2">
              <button 
                onClick={() => setActiveTab('grid')}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-bold", activeTab === 'grid' ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800")}
              >
                <Grid3X3 size={16} /> Grid View
              </button>
              <button 
                onClick={() => setActiveTab('graph')}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-sm font-bold", activeTab === 'graph' ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800")}
              >
                <Network size={16} /> Graph View
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2">
              {activeTab === 'grid' ? (
                <>
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex gap-3">
                    <MousePointer2 className="text-gray-400 shrink-0" size={20}/>
                    <div><span className="text-white font-bold block text-sm">Draw Walls</span><span className="text-xs text-gray-400">Click or drag on empty cells to create walls.</span></div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex gap-3">
                    <Move className="text-green-400 shrink-0" size={20}/>
                    <div><span className="text-white font-bold block text-sm">Move Start/End</span><span className="text-xs text-gray-400">Select the 'Start' or 'End' tool and click a cell to relocate points.</span></div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex gap-3">
                    <Keyboard className="text-purple-400 shrink-0" size={20}/>
                    <div><span className="text-white font-bold block text-sm">Fit / Scroll</span><span className="text-xs text-gray-400">Toggle "Fit to Screen" to see the whole grid, or turn it off to zoom and scroll.</span></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex gap-3">
                    <MousePointer2 className="text-blue-400 shrink-0" size={20}/>
                    <div><span className="text-white font-bold block text-sm">Add Nodes</span><span className="text-xs text-gray-400">Select "Node" tool and click anywhere on canvas.</span></div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex gap-3">
                    <GitCommit className="text-yellow-400 shrink-0" size={20}/>
                    <div><span className="text-white font-bold block text-sm">Connect Nodes</span><span className="text-xs text-gray-400">Select "Connect" tool. Drag from one node to another to create an edge.</span></div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex gap-3">
                    <Edit3 className="text-gray-400 shrink-0" size={20}/>
                    <div><span className="text-white font-bold block text-sm">Edit Weights</span><span className="text-xs text-gray-400">Click the number badge on any edge to type a new weight.</span></div>
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 flex gap-3">
                    <Trash2 className="text-red-400 shrink-0" size={20}/>
                    <div><span className="text-white font-bold block text-sm">Delete</span><span className="text-xs text-gray-400">Select "Delete" tool. Click nodes or weights to remove them.</span></div>
                  </div>
                </>
              )}
            </div>
          </div>
        );
        
      default:
        return <p className="text-gray-400">Select a mode to see instructions.</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-800/50">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 capitalize">
            {category === 'home' ? 'Getting Started' : `${category} Guide`}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-800/30 text-right">
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}