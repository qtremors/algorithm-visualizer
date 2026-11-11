import { Info, Grid3X3, Network } from 'lucide-react';
import TreeInput from '../inputs/TreeInput';
import ArrayInput from '../inputs/ArrayInput';
import GridInput from '../inputs/GridInput';
import GraphInput from '../inputs/GraphInput';
import type { AlgorithmMetadata } from '../../types';
import type { GraphTool, GridTool, InputData } from '../../types/input';

type Props = {
  category?: string;
  hideAlgorithm?: boolean;
  seed?: string;
  directed?: boolean;
  onDirectedChange?: (value: boolean) => void;
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
    <div className={`editor-card${props.hideAlgorithm ? ' editor-only' : ''}`}>
      {!props.hideAlgorithm && (
        <div className="editor-selector">
          <div className="editor-selector-heading">
            <label
              htmlFor="algorithm-selection"
              className="text-[11px] font-semibold text-gray-400"
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
            className="control-input"
          >
            {Object.entries(algorithms).map(([name, metadata]) => (
              <option key={name} value={name}>
                {metadata.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="editor-inputs">
        {inputData && !Array.isArray(inputData) && inputData.kind === 'tree' ? (
          <TreeInput
            data={inputData}
            onChange={onInputUpdate}
            disabled={busy}
          />
        ) : category === 'sorting' ? (
          <ArrayInput
            seed={props.seed}
            currentData={Array.isArray(inputData) ? inputData : null}
            onSubmit={onInputUpdate}
            disabled={busy}
          />
        ) : inputData &&
          !Array.isArray(inputData) &&
          inputData.kind === 'grid' ? (
          <GridInput
            seed={props.seed}
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
            directed={props.directed}
            onDirectedChange={props.onDirectedChange}
            seed={props.seed}
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
