import { Code, History, X } from 'lucide-react';
import { useAlgorithmWorkspace } from '../hooks/useAlgorithmWorkspace';
import WorkspaceHeader from '../components/workspace/WorkspaceHeader';
import VisualizerPanel from '../components/workspace/VisualizerPanel';
import PlaybackControls from '../components/core/PlaybackControls';
import Pseudocode, { CodeRenderer } from '../components/core/Pseudocode';
import StatusLog from '../components/core/StatusLog';
import InfoModal from '../components/core/InfoModal';
import Modal from '../components/core/Modal';
import LogList from '../components/core/LogList';
import { Link } from 'react-router-dom';

export default function AlgorithmWorkspace() {
  const w = useAlgorithmWorkspace();
  const p = w.playback;
  if (w.isLoading) return <p role="status">Loading algorithms...</p>;
  if (w.loadError)
    return <p>Algorithms are unavailable. Use Retry above to reconnect.</p>;
  if (!w.categoryAlgorithms)
    return (
      <div>
        <h1 className="text-xl font-bold">Category not found.</h1>
        <Link to="/" className="text-blue-400">
          Return home
        </Link>
      </div>
    );
  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-160px)] min-h-[700px]">
      <h1 className="sr-only">{w.category} algorithm workspace</h1>
      <WorkspaceHeader
        category={w.category}
        algorithms={w.categoryAlgorithms}
        selectedAlgoName={w.selectedAlgoName}
        onAlgoChange={w.setSelectedAlgoName}
        viewMode={w.viewMode}
        onViewModeChange={w.setViewMode}
        onOpenInfo={() => w.setIsInfoModalOpen(true)}
        busy={w.busy}
        inputData={w.inputData}
        onInputUpdate={w.handleInputUpdate}
        visualizationMode={w.visualizationMode}
        setVisualizationMode={w.setVisualizationMode}
        graphTool={w.graphTool}
        setGraphTool={w.setGraphTool}
      />
      <PlaybackControls
        isPlaying={p.isPlaying}
        onPlay={p.play}
        onPause={p.pause}
        onNext={p.nextStep}
        onPrev={p.prevStep}
        onReset={w.handleReset}
        speed={p.speed}
        onSpeedChange={p.setSpeed}
        disabled={!w.steps.length || w.status === 'failed'}
        canReset={w.status !== 'idle' || !!w.error}
        canVisualize={!w.validationError && !!w.algorithmMetadata}
        onVisualize={w.handleRun}
        isVisualizing={w.isRunning}
        onOpenCombined={() => w.setIsCombinedModalOpen(true)}
        estimatedRemainingTime={p.estimatedRemainingTime}
        hasViewControls={w.category === 'pathfinding'}
        isGraphView={w.viewMode === 'graph'}
        zoom={w.zoom}
        onZoomChange={w.setZoom}
        isFitToScreen={w.isFitToScreen}
        onToggleFit={() => w.setIsFitToScreen(!w.isFitToScreen)}
        showPath={w.showPath}
        onTogglePath={() => w.setShowPath(!w.showPath)}
        showEdgeColors={w.showEdgeColors}
        onToggleEdgeColors={() => w.setShowEdgeColors(!w.showEdgeColors)}
      />
      {w.validationError && (
        <p className="text-sm text-amber-300">{w.validationError}</p>
      )}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        <VisualizerPanel
          algorithmMetadata={w.algorithmMetadata}
          currentStep={p.currentStep}
          inputData={w.inputData}
          visualizationMode={w.visualizationMode}
          graphTool={w.graphTool}
          busy={w.busy}
          onInputUpdate={w.handleInputUpdate}
          onGraphInteraction={w.handleGraphInteraction}
          onWeightChange={w.handleWeightChange}
          tempLine={w.tempLine}
          zoom={w.zoom}
          isFitToScreen={w.isFitToScreen}
          showEdgeColors={w.showEdgeColors}
          showPath={w.showPath}
        />
        <aside className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-4 min-h-0">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex-1 flex flex-col min-h-48">
            <Pseudocode
              code={w.algorithmMetadata?.pseudocode || []}
              highlightedLine={p.currentStep?.line || 0}
            />
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <StatusLog
              logHistory={w.logHistory}
              error={w.error}
              totalSteps={w.steps.length}
              currentStepIndex={p.currentStepIndex}
              isRunning={w.isRunning}
            />
          </div>
        </aside>
      </div>
      {w.isInfoModalOpen && w.algorithmMetadata && (
        <InfoModal
          metadata={w.algorithmMetadata}
          onClose={() => w.setIsInfoModalOpen(false)}
        />
      )}
      {w.isCombinedModalOpen && (
        <Modal
          title="Detailed view"
          onClose={() => w.setIsCombinedModalOpen(false)}
          className="max-w-5xl"
        >
          <div className="bg-gray-900 border border-gray-700 rounded-xl h-[85vh] flex flex-col">
            <header className="flex justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold">Detailed view</h2>
              <button
                type="button"
                aria-label="Close detailed view"
                onClick={() => w.setIsCombinedModalOpen(false)}
              >
                <X />
              </button>
            </header>
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              <div className="md:w-1/2 p-4 flex flex-col min-h-0">
                <h3 className="flex gap-2 mb-3">
                  <Code size={18} />
                  Algorithm logic
                </h3>
                <CodeRenderer
                  code={w.algorithmMetadata?.pseudocode || []}
                  highlightedLine={p.currentStep?.line || 0}
                />
              </div>
              <div className="md:w-1/2 p-4 flex flex-col min-h-0">
                <h3 className="flex gap-2 mb-3">
                  <History size={18} />
                  Execution log
                </h3>
                <LogList messages={w.logHistory} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
