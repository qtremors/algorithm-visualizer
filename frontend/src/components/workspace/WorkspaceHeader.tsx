import { Info, Grid3X3, Network } from 'lucide-react';
import type { ReactNode } from 'react';

type WorkspaceHeaderProps = {
  category: string | undefined;
  categoryAlgorithms: any;
  selectedAlgoName: string;
  setSelectedAlgoName: (name: string) => void;
  viewMode: 'grid' | 'graph';
  setViewMode: (mode: 'grid' | 'graph') => void;
  onResetView: () => void;
  onOpenInfo: () => void;
  isRunning: boolean;
  isPlaying: boolean;
  children?: ReactNode;
};

export default function WorkspaceHeader({
  category,
  categoryAlgorithms,
  selectedAlgoName,
  setSelectedAlgoName,
  viewMode,
  setViewMode,
  onResetView,
  onOpenInfo,
  isRunning,
  isPlaying,
  children
}: WorkspaceHeaderProps) {
  return (
    <div className="flex-shrink-0 bg-gray-800 border border-gray-700 p-4 rounded-xl shadow-lg flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
      
      {/* Left Block: Algorithm Selection */}
      <div className="w-full xl:w-64 flex-shrink-0">
         <div className="flex items-center justify-between mb-1.5">
             <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Algorithm</label>
             <div className="flex gap-2">
                {category === 'pathfinding' && (
                    <div className="flex bg-gray-900 rounded-md p-0.5 border border-gray-700">
                        <button 
                            onClick={() => { setViewMode('grid'); onResetView(); }} 
                            className={`p-1 rounded ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-500'}`} 
                            title="Grid View"
                        >
                            <Grid3X3 size={14}/>
                        </button>
                        <button 
                            onClick={() => { setViewMode('graph'); onResetView(); }} 
                            className={`p-1 rounded ${viewMode === 'graph' ? 'bg-gray-700 text-white' : 'text-gray-500'}`} 
                            title="Graph View"
                        >
                            <Network size={14}/>
                        </button>
                    </div>
                )}
                <button 
                    onClick={onOpenInfo} 
                    className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 text-xs font-medium"
                >
                    <Info size={14} /> Info
                </button>
             </div>
        </div>
        <div className="relative">
          <select 
            value={selectedAlgoName} 
            onChange={(e) => setSelectedAlgoName(e.target.value)} 
            disabled={isRunning || isPlaying} 
            className="w-full bg-gray-900 text-white pl-4 pr-10 py-2.5 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none appearance-none transition-colors font-medium"
          >
            {categoryAlgorithms && Object.keys(categoryAlgorithms).map((name: string) => (
                <option key={name} value={name}>{categoryAlgorithms[name].name}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
      </div>

      {/* Right Block: Dynamic Inputs (Injected via Children) */}
      <div className="flex-grow w-full border-t xl:border-t-0 xl:border-l border-gray-700 pt-4 xl:pt-0 xl:pl-6">
        {children}
      </div>
    </div>
  );
}