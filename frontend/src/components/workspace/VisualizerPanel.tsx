
import { cn } from '../../lib/utils';
import SortingVisualizer from '../visualizers/SortingVisualizer';
import GridVisualizer from '../visualizers/GridVisualizer';
import GraphVisualizer from '../visualizers/GraphVisualizer';
import type { AlgorithmStep } from '../../types';

type VisualizerPanelProps = {
    algorithmMetadata: any;
    steps: AlgorithmStep[] | undefined;
    currentStep: AlgorithmStep | undefined;
    inputData: any;
    viewMode: 'grid' | 'graph';
    visualizationMode: string;
    graphTool: string;
    isRunning: boolean;
    onInputUpdate: (data: any) => void;
    // Graph interaction handlers
    onGraphInteraction: (action: string, payload: any) => void;
    onWeightChange: (sourceId: string, targetId: string, currentWeight: number) => void;
    draggedNode: string | null;
    tempLine: { start: any, end: any } | null;
    // View controls
    zoom: number;
    isFitToScreen: boolean;
    showEdgeColors: boolean;
    showPath: boolean;
};

export default function VisualizerPanel({
    algorithmMetadata,
    steps,
    currentStep,
    inputData,
    viewMode,
    visualizationMode,
    graphTool,
    isRunning,
    onInputUpdate,
    onGraphInteraction,
    onWeightChange,
    draggedNode,
    tempLine,
    zoom,
    isFitToScreen,
    showEdgeColors,
    showPath,
}: VisualizerPanelProps) {

    const renderVisualizerComponent = () => {
        if (!algorithmMetadata) return null;
        const hasSteps = steps && steps.length > 0;
        const displayStep = hasSteps ? currentStep : null;

        if (algorithmMetadata.visualizer === 'bar_chart') {
            return (
                <div className="w-full h-full overflow-hidden">
                    <SortingVisualizer
                        step={displayStep || null}
                        initialData={inputData as number[] | null}
                    />
                </div>
            );
        }

        const containerClass = cn(
            "w-full h-full relative",
            isFitToScreen ? "overflow-hidden" : "overflow-auto block"
        );

        if (viewMode === 'grid') {
            return (
                <div className={containerClass}>
                    <GridVisualizer
                        step={displayStep || null}
                        initialData={inputData}
                        mode={visualizationMode}
                        onUpdate={onInputUpdate}
                        isInteracting={!isRunning && !hasSteps}
                        zoom={zoom}
                        isFitToScreen={isFitToScreen}
                    />
                </div>
            );
        } else {
            return (
                <div className={containerClass}>
                    <GraphVisualizer
                        step={displayStep || null}
                        initialData={inputData}
                        isInteracting={!isRunning && !hasSteps}
                        onNodeClick={(id) => onGraphInteraction('nodeClick', id)}
                        onNodeDragStart={(id, e) => onGraphInteraction('connectStart', { nodeId: id, event: e })}
                        onNodeMouseUp={(id) => onGraphInteraction('connectEnd', { nodeId: id })}
                        onWeightClick={onWeightChange}
                        tempLine={tempLine}
                        zoom={isFitToScreen ? 1 : zoom}
                        showEdgeColors={showEdgeColors}
                        showPath={showPath}
                        isFitToScreen={isFitToScreen}
                    />
                </div>
            );
        }
    };

    return (
        <div
            className="flex-1 min-w-0 bg-gray-800 rounded-xl shadow-lg border border-gray-700 relative"
            onClick={(e) => {
                if (viewMode === 'graph' && graphTool === 'node' && !isRunning) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const currentZoom = isFitToScreen ? 1 : zoom;
                    const x = (e.clientX - rect.left + e.currentTarget.scrollLeft) / currentZoom;
                    const y = (e.clientY - rect.top + e.currentTarget.scrollTop) / currentZoom;
                    onGraphInteraction('addNode', { x, y });
                }
            }}
            onMouseMove={(e) => {
                if (viewMode === 'graph' && draggedNode) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const currentZoom = isFitToScreen ? 1 : zoom;
                    const x = (e.clientX - rect.left + e.currentTarget.scrollLeft) / currentZoom;
                    const y = (e.clientY - rect.top + e.currentTarget.scrollTop) / currentZoom;
                    onGraphInteraction('connectMove', { x, y });
                }
            }}
            onMouseUp={() => { if (viewMode === 'graph') onGraphInteraction('connectCancel', null); }}
        >
            <div className="absolute inset-0 flex flex-col">
                {renderVisualizerComponent()}
            </div>
        </div>
    );
}
