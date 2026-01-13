import { Code, History, X } from 'lucide-react';
import type { AlgorithmStep } from '../types';
import { useAlgorithmWorkspace } from '../hooks/useAlgorithmWorkspace';
import WorkspaceHeader from '../components/workspace/WorkspaceHeader';
import VisualizerPanel from '../components/workspace/VisualizerPanel';
import PlaybackControls from '../components/core/PlaybackControls';
import Pseudocode, { CodeRenderer } from '../components/core/Pseudocode';
import StatusLog from '../components/core/StatusLog';
import InfoModal from '../components/core/InfoModal';

export default function AlgorithmWorkspace() {
  const {
    // Context & Algorithms
    category,
    algorithms,
    isLoading,
    algorithmMetadata,

    // State
    selectedAlgoName, setSelectedAlgoName,
    inputData,
    visualizationMode, setVisualizationMode,
    viewMode, setViewMode,
    zoom, setZoom,
    isFitToScreen, setIsFitToScreen,
    showPath, setShowPath,
    showEdgeColors, setShowEdgeColors,
    showMobileWarning, setShowMobileWarning,

    // Graph State
    graphTool, setGraphTool,
    draggedNode,
    tempLine,

    // UI State
    logHistory,
    isCombinedModalOpen, setIsCombinedModalOpen,
    isInfoModalOpen, setIsInfoModalOpen,
    resetKey,

    // Runner & Playback
    steps, isRunning, error,
    playback, // Destructure what we need

    // Handlers
    handleRun,
    handleReset,
    handleInputUpdate,
    handleWeightChange,
    handleGraphInteraction
  } = useAlgorithmWorkspace();

  const {
    currentStep,
    currentStepIndex,
    isPlaying,
    speed,
    play,
    pause,
    nextStep,
    prevStep,
    setSpeed,
    estimatedRemainingTime,
  } = playback;

  if (isLoading) return <div>Loading...</div>;
  if (!algorithms) return <div>Category not found.</div>;

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-100px)] min-h-[600px]">
      <WorkspaceHeader
        category={category}
        algorithms={algorithms[category || '']}
        selectedAlgoName={selectedAlgoName}
        onAlgoChange={setSelectedAlgoName}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenInfo={() => setIsInfoModalOpen(true)}
        isRunning={isRunning}
        isPlaying={isPlaying}
        algorithmMetadata={algorithmMetadata}
        inputData={inputData}
        onInputUpdate={handleInputUpdate}
        onRun={handleRun}
        visualizationMode={visualizationMode}
        setVisualizationMode={setVisualizationMode}
        graphTool={graphTool}
        setGraphTool={setGraphTool}
      />

      <div className="flex-shrink-0">
        <PlaybackControls
          isPlaying={isPlaying} onPlay={play} onPause={pause} onNext={nextStep} onPrev={prevStep} onReset={handleReset}
          speed={speed} onSpeedChange={setSpeed} disabled={isRunning || !steps || steps.length === 0} onVisualize={() => handleRun(null)} isVisualizing={isRunning} onOpenCombined={() => setIsCombinedModalOpen(true)}
          estimatedRemainingTime={estimatedRemainingTime}
          hasViewControls={category === 'pathfinding'} isGraphView={viewMode === 'graph'}
          zoom={zoom} onZoomChange={setZoom} isFitToScreen={isFitToScreen} onToggleFit={() => setIsFitToScreen(!isFitToScreen)}
          showPath={showPath} onTogglePath={() => setShowPath(!showPath)} showEdgeColors={showEdgeColors} onToggleEdgeColors={() => setShowEdgeColors(!showEdgeColors)}
        />
      </div>

      <div className="flex-grow flex flex-col lg:flex-row gap-4 min-h-0">
        <VisualizerPanel
          algorithmMetadata={algorithmMetadata}
          steps={steps}
          currentStep={currentStep}
          inputData={inputData}
          viewMode={viewMode}
          visualizationMode={visualizationMode}
          graphTool={graphTool}
          isRunning={isRunning}
          onInputUpdate={handleInputUpdate}
          onGraphInteraction={handleGraphInteraction}
          onWeightChange={handleWeightChange}
          draggedNode={draggedNode}
          tempLine={tempLine}
          zoom={zoom}
          isFitToScreen={isFitToScreen}
          showEdgeColors={showEdgeColors}
          showPath={showPath}
        />

        <div className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-4 h-full">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden">
            <Pseudocode code={algorithmMetadata?.pseudocode || []} highlightedLine={currentStep?.line || 0} />
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg h-auto flex-shrink-0 flex flex-col">
            <StatusLog currentMessage={currentStep?.message || (isRunning ? 'Running...' : 'Ready.')} steps={steps as AlgorithmStep[]} currentStepIndex={currentStepIndex} error={error} isRunning={isRunning} isFinished={!isPlaying && currentStepIndex === (steps?.length || 0) - 1} category={category || ''} resetKey={resetKey} logHistory={logHistory} />
          </div>
        </div>
      </div>

      {isInfoModalOpen && algorithmMetadata && <InfoModal metadata={algorithmMetadata} onClose={() => setIsInfoModalOpen(false)} />}
      {isCombinedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800/50"><h3 className="text-lg font-bold text-white">Detailed View</h3><button onClick={() => setIsCombinedModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button></div>
            <div className="flex-grow flex overflow-hidden">
              <div className="w-1/2 border-r border-gray-800 p-4 flex flex-col"><h4 className="flex items-center gap-2 font-bold text-gray-400 mb-3"><Code size={18} /> Algorithm Logic</h4><CodeRenderer code={algorithmMetadata?.pseudocode || []} highlightedLine={currentStep?.line || 0} className="h-full text-base" /></div>
              <div className="w-1/2 p-4 flex flex-col bg-black/20"><h4 className="flex items-center gap-2 font-bold text-gray-400 mb-3"><History size={18} /> Execution Log</h4><div className="flex-grow overflow-y-auto font-mono text-sm space-y-1 pr-2">{logHistory.map((msg, idx) => (<div key={idx} className="flex gap-3 border-b border-gray-800/50 pb-1 mb-1 last:border-0"><span className="text-gray-600 w-8 flex-shrink-0 text-right">{idx + 1}.</span><span className={idx === logHistory.length - 1 ? "text-yellow-300" : "text-gray-300"}>{msg}</span></div>))}</div></div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Warning Overlay */}
      {showMobileWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6 lg:hidden">
          <div className="bg-gray-900 border border-yellow-500/50 rounded-2xl p-8 max-w-sm text-center shadow-2xl">
            <div className="bg-yellow-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-yellow-500 text-3xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-4">Desktop Optimized</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              This visualizer is designed for large screens to show complex data sets and code. For the best experience, please use a desktop browser.
            </p>
            <button
              onClick={() => setShowMobileWarning(false)}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-3 rounded-xl transition-all"
            >
              Continue Anyway
            </button>
          </div>
        </div>
      )}
    </div>
  );
}