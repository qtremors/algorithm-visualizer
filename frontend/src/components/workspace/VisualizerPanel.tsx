import SortingVisualizer from '../visualizers/SortingVisualizer';
import GridVisualizer from '../visualizers/GridVisualizer';
import GraphVisualizer from '../visualizers/GraphVisualizer';
import type { AlgorithmMetadata, AlgorithmStep } from '../../types';
import type {
  ConnectionLine,
  GraphInteraction,
  GraphTool,
  GridTool,
  InputData,
} from '../../types/input';

type Props = {
  algorithmMetadata: AlgorithmMetadata | null;
  currentStep: AlgorithmStep | undefined;
  inputData: InputData | null;
  visualizationMode: GridTool;
  graphTool: GraphTool;
  busy: boolean;
  onInputUpdate: (data: InputData | null) => void;
  onGraphInteraction: (action: GraphInteraction) => void;
  onWeightChange: (source: string, target: string, weight: number) => void;
  tempLine: ConnectionLine | null;
  zoom: number;
  isFitToScreen: boolean;
  showEdgeColors: boolean;
  showPath: boolean;
};
export default function VisualizerPanel(props: Props) {
  const { inputData, algorithmMetadata, currentStep, busy } = props;
  return (
    <div
      className="flex-1 min-w-0 bg-gray-800 rounded-xl shadow-lg border border-gray-700 relative min-h-80"
      aria-label="Visualization"
    >
      <div className="absolute inset-0">
        {algorithmMetadata?.visualizer === 'bar_chart' ? (
          <SortingVisualizer
            step={currentStep || null}
            initialData={Array.isArray(inputData) ? inputData : null}
          />
        ) : inputData &&
          !Array.isArray(inputData) &&
          inputData.kind === 'grid' ? (
          <GridVisualizer
            step={currentStep || null}
            initialData={inputData}
            mode={props.visualizationMode}
            onUpdate={props.onInputUpdate}
            isInteracting={!busy}
            zoom={props.zoom}
            isFitToScreen={props.isFitToScreen}
          />
        ) : inputData &&
          !Array.isArray(inputData) &&
          inputData.kind === 'graph' ? (
          <GraphVisualizer
            step={currentStep || null}
            initialData={inputData}
            tool={props.graphTool}
            onInteraction={props.onGraphInteraction}
            onWeightClick={props.onWeightChange}
            isInteracting={!busy}
            tempLine={props.tempLine}
            zoom={props.zoom}
            isFitToScreen={props.isFitToScreen}
            showEdgeColors={props.showEdgeColors}
            showPath={props.showPath}
          />
        ) : null}
      </div>
    </div>
  );
}
