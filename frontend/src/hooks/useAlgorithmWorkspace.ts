import { useCallback, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAlgorithms } from '../contexts/algorithm-context';
import { useAlgorithmRunner } from './useAlgorithmRunner';
import { usePlaybackShortcuts } from './usePlaybackShortcuts';
import { usePlayback } from './usePlayback';
import { useEditorSession } from './useEditorSession';
import { useGraphEditor } from './useGraphEditor';
import { algorithmInputError } from '../lib/input';
import type { GridTool, InputData } from '../types/input';

export function useAlgorithmWorkspace() {
  const { category } = useParams<{ category: string }>();
  const { algorithms, isLoading, error: loadError } = useAlgorithms();
  const categoryAlgorithms =
    category && algorithms && Object.hasOwn(algorithms, category)
      ? algorithms[category]
      : null;
  const editor = useEditorSession(category || 'sorting');
  const { session, setSelection, setView } = editor;
  const selection = session.selection;
  const selectedAlgoName =
    categoryAlgorithms && Object.hasOwn(categoryAlgorithms, selection)
      ? selection
      : Object.keys(categoryAlgorithms || {})[0] || '';
  const algorithmMetadata = categoryAlgorithms?.[selectedAlgoName] || null;
  const { array, grid, graph, tree } = session.drafts;
  const viewMode = session.view;
  const inputData: InputData | null =
    category === 'trees'
      ? tree
      : category === 'sorting'
        ? array
        : viewMode === 'grid'
          ? grid
          : graph;
  const [visualizationMode, setVisualizationMode] = useState<GridTool>('wall');
  const [zoom, setZoom] = useState(1);
  const [isFitToScreen, setIsFitToScreen] = useState(true);
  const [showPath, setShowPath] = useState(true);
  const [showEdgeColors, setShowEdgeColors] = useState(false);
  const [isCombinedModalOpen, setIsCombinedModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const runner = useAlgorithmRunner(category, selectedAlgoName);
  const { steps, isRunning, status, error, resetSteps, runAlgorithm } = runner;
  const playback = usePlayback(steps, isRunning, status === 'failed');
  const {
    currentStepIndex,
    isPlaying,
    play,
    start,
    pause,
    nextStep,
    prevStep,
    reset,
  } = playback;
  const busy = isRunning || isPlaying;
  const validationError = algorithmInputError(
    inputData,
    algorithmMetadata || undefined,
  );
  const graphEditor = useGraphEditor(graph, busy, (data) => {
    reset();
    resetSteps();
    editor.update(data);
  });
  const { clearGesture } = graphEditor;
  const handleReset = useCallback(() => {
    reset();
    resetSteps();
    clearGesture();
    setEditorError(null);
  }, [reset, resetSteps, clearGesture]);
  const handleInputUpdate = useCallback(
    (data: InputData | null) => {
      if (busy) return;
      handleReset();
      editor.update(data);
    },
    [busy, handleReset, editor],
  );
  const setSelectedAlgoName = (name: string) => {
    if (!busy) {
      handleReset();
      playback.clearBreakpoints();
      setSelection(name);
    }
  };
  const setViewMode = (mode: 'grid' | 'graph') => {
    if (!busy) {
      handleReset();
      setView(mode);
    }
  };
  const handleRun = () => {
    if (busy || !algorithmMetadata) return;
    const problem = algorithmInputError(
      inputData,
      algorithmMetadata || undefined,
    );
    if (problem || !inputData) {
      setEditorError(problem);
      return;
    }
    reset();
    clearGesture();
    setEditorError(null);
    runAlgorithm(inputData);
    start();
  };
  const allMessages = useMemo(() => steps.map((step) => step.message), [steps]);
  const logHistory = useMemo(() => {
    const messages = allMessages.slice(0, currentStepIndex + 1);
    if (!messages.length) messages.push(isRunning ? 'Running...' : 'Ready.');
    if (status === 'failed') messages.push(error || 'Visualization failed.');
    else if (
      status === 'completed' &&
      currentStepIndex === steps.length - 1 &&
      !isPlaying
    )
      messages[messages.length - 1] += ' Algorithm finished.';
    return messages;
  }, [
    allMessages,
    steps.length,
    currentStepIndex,
    isRunning,
    status,
    error,
    isPlaying,
  ]);

  usePlaybackShortcuts({
    length: steps.length,
    playing: isPlaying,
    failed: status === 'failed',
    play,
    pause,
    next: nextStep,
    previous: prevStep,
    first: playback.first,
    last: playback.last,
    reset: handleReset,
    canEdit: !busy,
    undo: () => {
      if (editor.canUndo) {
        handleReset();
        editor.undo();
      }
    },
    redo: () => {
      if (editor.canRedo) {
        handleReset();
        editor.redo();
      }
    },
  });

  return {
    category,
    algorithms,
    categoryAlgorithms,
    isLoading,
    loadError,
    selectedAlgoName,
    setSelectedAlgoName,
    algorithmMetadata,
    inputData,
    viewMode,
    setViewMode,
    visualizationMode,
    setVisualizationMode,
    graphTool: graphEditor.tool,
    setGraphTool: graphEditor.setTool,
    directed: graphEditor.directed,
    setDirected: graphEditor.setDirected,
    draggedNode: graphEditor.source,
    tempLine: graphEditor.line,
    graphEditor,
    editor,
    zoom,
    setZoom,
    isFitToScreen,
    setIsFitToScreen,
    showPath,
    setShowPath,
    showEdgeColors,
    setShowEdgeColors,
    isCombinedModalOpen,
    setIsCombinedModalOpen,
    isInfoModalOpen,
    setIsInfoModalOpen,
    steps,
    metrics: runner.metrics,
    isRunning,
    error: error || editorError || graphEditor.error,
    status,
    playback,
    busy,
    validationError,
    logHistory,
    handleRun,
    handleReset,
    handleInputUpdate,
    handleWeightChange: graphEditor.weightClick,
    handleGraphInteraction: graphEditor.interact,
  };
}
