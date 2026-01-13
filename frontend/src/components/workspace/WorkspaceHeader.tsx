
import { Info, Grid3X3, Network, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import ArrayInput from '../inputs/ArrayInput';
import GridInput from '../inputs/GridInput';
import GraphInput from '../inputs/GraphInput';

type WorkspaceHeaderProps = {
  category: string | undefined;
  algorithms: any;
  selectedAlgoName: string;
  onAlgoChange: (name: string) => void;
  viewMode: 'grid' | 'graph';
  onViewModeChange: (mode: 'grid' | 'graph') => void;
  onOpenInfo: () => void;
  isRunning: boolean;
  isPlaying: boolean;
  algorithmMetadata: any;
  inputData: any;
  onInputUpdate: (data: any) => void;
  onRun: (data: any) => void;
  visualizationMode: string;
  setVisualizationMode: (mode: string) => void;
  graphTool: string;
  setGraphTool: (tool: string) => void;
};

export default function WorkspaceHeader({
  category,
  algorithms,
  selectedAlgoName,
  onAlgoChange,
  viewMode,
  onViewModeChange,
  onOpenInfo,
  isRunning,
  isPlaying,
  algorithmMetadata,
  inputData,
  onInputUpdate,
  onRun,
  visualizationMode,
  setVisualizationMode,
  graphTool,
  setGraphTool,
}: WorkspaceHeaderProps) {

  const renderInputComponent = () => {
    if (!algorithmMetadata) return null;
    if (algorithmMetadata.input_type === 'list[int]') {
      return (
        <ArrayInput
          onSubmit={onInputUpdate}
          onRun={onRun}
          disabled={isRunning || isPlaying}
        />
      );
    }
    if (viewMode === 'grid') {
      return (
        <GridInput
          onSubmit={onInputUpdate}
          mode={visualizationMode}
          setMode={setVisualizationMode}
          currentData={inputData}
        />
      );
    }
    return (
      <GraphInput
        onSubmit={onInputUpdate}
        mode={graphTool}
        setMode={setGraphTool}
        currentData={inputData}
      />
    );
  };

  return (
    <div className="flex-shrink-0 bg-gray-800 border border-gray-700 p-4 rounded-xl shadow-lg flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
      <div className="w-full xl:w-64 flex-shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Algorithm</label>
          <div className="flex gap-2">
            {category === 'pathfinding' && (
              <div className="flex bg-gray-900 rounded-md p-0.5 border border-gray-700">
                <button
                  onClick={() => onViewModeChange('grid')}
                  className={cn("p-1 rounded", viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-500')}
                  title="Grid View"
                >
                  <Grid3X3 size={14} />
                </button>
                <button
                  onClick={() => onViewModeChange('graph')}
                  className={cn("p-1 rounded", viewMode === 'graph' ? 'bg-gray-700 text-white' : 'text-gray-500')}
                  title="Graph View"
                >
                  <Network size={14} />
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
            onChange={(e) => onAlgoChange(e.target.value)}
            disabled={isRunning || isPlaying}
            className="w-full bg-gray-900 text-white pl-4 pr-10 py-2.5 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none appearance-none transition-colors font-medium"
          >
            {algorithms && Object.keys(algorithms).map((name: string) => (
              <option key={name} value={name}>{algorithms[name].name}</option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
            <ChevronDown size={16} />
          </div>
        </div>
      </div>
      <div className="flex-grow w-full border-t xl:border-t-0 xl:border-l border-gray-700 pt-4 xl:pt-0 xl:pl-6">
        {renderInputComponent()}
      </div>
    </div>
  );
}