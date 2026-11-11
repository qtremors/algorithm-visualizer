import { Code, History, X } from 'lucide-react';
import { useAlgorithmWorkspace } from '../hooks/useAlgorithmWorkspace';
import WorkspaceHeader from '../components/workspace/WorkspaceHeader';
import VisualizerPanel from '../components/workspace/VisualizerPanel';
import PlaybackControls from '../components/core/PlaybackControls';
import { CodeRenderer } from '../components/core/Pseudocode';
import StatusLog from '../components/core/StatusLog';
import InfoModal from '../components/core/InfoModal';
import Modal from '../components/core/Modal';
import LogList from '../components/core/LogList';
import LearningTabs from '../components/core/LearningTabs';
import RunBadge from '../components/core/RunBadge';
import {
  categoryNames,
  categoryDescriptions,
  editorHint,
} from '../lib/presentation';
import RunSummary from '../components/core/RunSummary';
import VisualizerLegend from '../components/core/VisualizerLegend';
import Timeline from '../components/core/Timeline';
import WeightEditor from '../components/core/WeightEditor';
import SessionToolbar from '../components/workspace/SessionToolbar';
import { Link, useNavigate } from 'react-router-dom';

export default function AlgorithmWorkspace() {
  const w = useAlgorithmWorkspace();
  const navigate = useNavigate();
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
    <div className="workspace flex flex-col gap-4 min-w-0">
      <header className="workspace-heading">
        <div>
          <p className="section-eyebrow">Algorithm workspace</p>
          <h1>{categoryNames[w.category || ''] || w.category}</h1>
          <p className="workspace-subtitle">
            {categoryDescriptions[w.category || '']}
          </p>
        </div>
        <div className="workspace-heading-actions">
          <RunBadge
            status={w.status}
            length={w.steps.length}
            index={p.currentStepIndex}
            playing={p.isPlaying}
          />
          <Link className="action-secondary" to={`/compare/${w.category}`}>
            Compare algorithms
          </Link>
        </div>
      </header>
      <SessionToolbar
        session={w.editor.session}
        setSeed={w.editor.setSeed}
        disabled={w.busy}
        canUndo={w.editor.canUndo}
        canRedo={w.editor.canRedo}
        undo={() => {
          w.handleReset();
          w.editor.undo();
        }}
        redo={() => {
          w.handleReset();
          w.editor.redo();
        }}
        onImport={(session) => {
          w.handleReset();
          w.editor.replace(session);
          if (session.category !== w.category) navigate(`/${session.category}`);
        }}
      />
      {w.editor.notice && <p role="alert">{w.editor.notice}</p>}
      <WorkspaceHeader
        seed={w.editor.session.seed}
        directed={w.directed}
        onDirectedChange={w.setDirected}
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
      {w.selectedAlgoName === 'astar' &&
        w.inputData &&
        !Array.isArray(w.inputData) &&
        w.inputData.kind === 'grid' && (
          <label className="control-field max-w-56">
            <span>A* heuristic</span>
            <select
              aria-label="A* heuristic"
              className="control-input max-w-56"
              disabled={w.busy}
              value={w.inputData.heuristic || 'manhattan'}
              onChange={(event) =>
                w.inputData &&
                !Array.isArray(w.inputData) &&
                w.inputData.kind === 'grid' &&
                w.handleInputUpdate({
                  ...w.inputData,
                  heuristic: event.target.value as
                    | 'manhattan'
                    | 'euclidean'
                    | 'zero',
                })
              }
            >
              <option value="manhattan">Manhattan</option>
              <option value="euclidean">Euclidean</option>
              <option value="zero">Zero (Dijkstra)</option>
            </select>
          </label>
        )}
      {w.category === 'pathfinding' &&
        ['bfs', 'dfs'].includes(w.selectedAlgoName) && (
          <p className="text-sm text-gray-400">
            BFS minimizes hops; DFS finds a reachable route. Both ignore edge
            weights. Use Dijkstra, A*, or Bellman–Ford to minimize cost.
          </p>
        )}
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
      <div className="visualizer-context">
        <VisualizerLegend category={w.category} view={w.viewMode} />
        {w.category === 'pathfinding' && (
          <p className="editor-hint">
            {editorHint(w.viewMode, w.visualizationMode, w.graphTool, w.busy)}
          </p>
        )}
      </div>
      <div className="workspace-stage">
        <div className="workspace-canvas">
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
        </div>
        <LearningTabs
          code={w.algorithmMetadata?.pseudocode || []}
          step={p.currentStep}
          steps={w.steps}
          index={p.currentStepIndex}
          algorithm={w.selectedAlgoName}
          messages={w.logHistory}
          breakpoints={p.breakpoints}
          onToggleBreakpoint={p.toggleBreakpoint}
        />
      </div>
      <Timeline
        index={p.currentStepIndex}
        length={w.steps.length}
        streaming={w.isRunning}
        disabled={!w.steps.length || w.status === 'failed'}
        onSeek={p.seek}
        operation={p.operation}
        onOperationChange={p.setOperation}
      />
      <RunSummary
        steps={w.steps}
        index={p.currentStepIndex}
        metrics={w.metrics}
        category={w.category}
      />
      <div className="workspace-status">
        <StatusLog
          logHistory={w.logHistory}
          error={w.error}
          totalSteps={w.steps.length}
          currentStepIndex={p.currentStepIndex}
          isRunning={w.isRunning}
          isPlaying={p.isPlaying}
        />
      </div>
      {w.graphEditor.edge && (
        <WeightEditor
          {...w.graphEditor.edge}
          onSave={w.graphEditor.saveWeight}
          onClose={w.graphEditor.closeWeight}
        />
      )}
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
                  breakpoints={p.breakpoints}
                  onToggleBreakpoint={p.toggleBreakpoint}
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
