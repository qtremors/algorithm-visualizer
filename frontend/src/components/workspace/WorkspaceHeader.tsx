import { Info, Grid3X3, Network } from 'lucide-react';
import ArrayInput from '../inputs/ArrayInput';
import GridInput from '../inputs/GridInput';
import GraphInput from '../inputs/GraphInput';
import type { AlgorithmMetadata } from '../../types';
import type { GraphTool, GridTool, InputData } from '../../types/input';

type Props = {
  category?: string;
  algorithms: Record<string, AlgorithmMetadata>;
  selectedAlgoName: string;
  onAlgoChange: (name: string) => void;
  viewMode: 'grid' | 'graph';
  onViewModeChange: (mode: 'grid' | 'graph') => void;
  onOpenInfo: () => void;
  busy: boolean;
  inputData: InputData | null;
  onInputUpdate: (data: InputData | null) => void;
  visualizationMode: GridTool;
  setVisualizationMode: (tool: GridTool) => void;
  graphTool: GraphTool;
  setGraphTool: (tool: GraphTool) => void;
};
export default function WorkspaceHeader(props: Props) {
  const {
    category,
    algorithms,
    selectedAlgoName,
    busy,
    inputData,
    onInputUpdate,
  } = props;
  return (
    <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl shadow-lg flex flex-col xl:flex-row gap-4 items-start xl:items-center">
      <div className="w-full xl:w-64 shrink-0">
        <div className="flex justify-between items-center mb-2">
          <label
            htmlFor="algorithm-selection"
            className="text-xs font-bold text-gray-400 uppercase"
          >
            Algorithm
          </label>
          <div className="flex gap-2">
            {category === 'pathfinding' && (
              <div
                className="flex gap-1"
                role="group"
                aria-label="Pathfinding view"
              >
                <button
                  type="button"
                  disabled={busy}
                  aria-pressed={props.viewMode === 'grid'}
                  aria-label="Grid View"
                  title="Grid View"
                  onClick={() => props.onViewModeChange('grid')}
                  className="p-1 bg-gray-900 rounded"
                >
                  <Grid3X3 size={16} />
                </button>
                <button
                  type="button"
                  disabled={busy}
                  aria-pressed={props.viewMode === 'graph'}
                  aria-label="Graph View"
                  title="Graph View"
                  onClick={() => props.onViewModeChange('graph')}
                  className="p-1 bg-gray-900 rounded"
                >
                  <Network size={16} />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={props.onOpenInfo}
              className="text-blue-400 flex items-center gap-1 text-xs"
            >
              <Info size={14} />
              Info
            </button>
          </div>
        </div>
        <select
          id="algorithm-selection"
          value={selectedAlgoName}
          onChange={(e) => props.onAlgoChange(e.target.value)}
          disabled={busy}
          className="w-full bg-gray-900 text-white p-2.5 rounded-lg border border-gray-700"
        >
          {Object.entries(algorithms).map(([name, metadata]) => (
            <option key={name} value={name}>
              {metadata.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 w-full">
        {category === 'sorting' ? (
          <ArrayInput
            currentData={Array.isArray(inputData) ? inputData : null}
            onSubmit={onInputUpdate}
            disabled={busy}
          />
        ) : inputData &&
          !Array.isArray(inputData) &&
          inputData.kind === 'grid' ? (
          <GridInput
            currentData={inputData}
            onSubmit={onInputUpdate}
            disabled={busy}
            mode={props.visualizationMode}
            setMode={props.setVisualizationMode}
          />
        ) : inputData &&
          !Array.isArray(inputData) &&
          inputData.kind === 'graph' ? (
          <GraphInput
            currentData={inputData}
            onSubmit={onInputUpdate}
            disabled={busy}
            mode={props.graphTool}
            setMode={props.setGraphTool}
          />
        ) : null}
      </div>
    </div>
  );
}
