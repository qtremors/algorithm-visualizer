import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAlgorithms } from '../contexts/algorithm-context';
import { useAlgorithmRunner } from './useAlgorithmRunner';
import { usePlayback } from './usePlayback';
import {
  createArray,
  createGraph,
  createGrid,
  inputError,
  LIMITS,
} from '../lib/input';
import type {
  ConnectionLine,
  GraphInputData,
  GraphInteraction,
  GraphTool,
  GridTool,
  InputData,
} from '../types/input';

export function useAlgorithmWorkspace() {
  const { category } = useParams<{ category: string }>();
  const { algorithms, isLoading, error: loadError } = useAlgorithms();
  const categoryAlgorithms =
    category && algorithms && Object.hasOwn(algorithms, category)
      ? algorithms[category]
      : null;
  const [selection, setSelection] = useState('');
  const selectedAlgoName =
    categoryAlgorithms && Object.hasOwn(categoryAlgorithms, selection)
      ? selection
      : Object.keys(categoryAlgorithms || {})[0] || '';
  const algorithmMetadata = categoryAlgorithms?.[selectedAlgoName] || null;
  const [array, setArray] = useState<number[] | null>(createArray);
  const [grid, setGrid] = useState(createGrid);
  const [graph, setGraph] = useState(createGraph);
  const [viewMode, setView] = useState<'grid' | 'graph'>('grid');
  const inputData: InputData | null =
    category === 'sorting' ? array : viewMode === 'grid' ? grid : graph;
  const [visualizationMode, setVisualizationMode] = useState<GridTool>('wall');
  const [graphTool, setTool] = useState<GraphTool>('node');
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [tempLine, setTempLine] = useState<ConnectionLine | null>(null);
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
  const validationError = inputError(inputData);
  const clearGesture = useCallback(() => {
    setDraggedNode(null);
    setTempLine(null);
  }, []);
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
      if (data === null || Array.isArray(data)) setArray(data);
      else if (data.kind === 'grid') setGrid(data);
      else setGraph(data);
    },
    [busy, handleReset],
  );
  const setSelectedAlgoName = (name: string) => {
    if (!busy) {
      handleReset();
      setSelection(name);
    }
  };
  const setViewMode = (mode: 'grid' | 'graph') => {
    if (!busy) {
      handleReset();
      setView(mode);
    }
  };
  const setGraphTool = (tool: GraphTool) => {
    clearGesture();
    setTool(tool);
  };
  const handleRun = () => {
    if (busy || !algorithmMetadata) return;
    const problem = inputError(inputData);
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
  const logHistory = useMemo(() => {
    const messages = steps
      .slice(0, currentStepIndex + 1)
      .map((step) => step.message);
    if (!messages.length) messages.push(isRunning ? 'Running...' : 'Ready.');
    if (status === 'failed') messages.push(error || 'Visualization failed.');
    else if (
      status === 'completed' &&
      currentStepIndex === steps.length - 1 &&
      !isPlaying
    )
      messages[messages.length - 1] += ' Algorithm finished.';
    return messages;
  }, [steps, currentStepIndex, isRunning, status, error, isPlaying]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        document.querySelector('dialog[open]') ||
        (event.target instanceof Element &&
          event.target.closest(
            'input, textarea, select, button, a, [role="button"], [contenteditable]',
          )) ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      )
        return;
      switch (event.code) {
        case 'Space':
          if (steps.length) {
            event.preventDefault();
            if (isPlaying) pause();
            else play();
          }
          break;
        case 'ArrowRight':
          if (steps.length && !isPlaying) {
            event.preventDefault();
            nextStep();
          }
          break;
        case 'ArrowLeft':
          if (steps.length && !isPlaying) {
            event.preventDefault();
            prevStep();
          }
          break;
        case 'KeyR':
          event.preventDefault();
          handleReset();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    steps.length,
    isPlaying,
    play,
    start,
    pause,
    nextStep,
    prevStep,
    handleReset,
  ]);

  const handleWeightChange = (
    source: string,
    target: string,
    weight: number,
  ) => {
    if (busy) return;
    const data = structuredClone(graph);
    if (!Object.hasOwn(data.adjacency[source] || {}, target)) return;
    const undirected =
      Object.hasOwn(data.adjacency[target] || {}, source) &&
      data.adjacency[target][source] === data.adjacency[source][target];
    if (graphTool === 'delete') {
      delete data.adjacency[source][target];
      if (undirected) delete data.adjacency[target][source];
    } else {
      const raw = window.prompt(
        `Weight for ${source} → ${target}:`,
        String(weight),
      );
      if (raw === null) return;
      const value = Number(raw.trim());
      if (
        !raw.trim() ||
        !Number.isFinite(value) ||
        value < 0 ||
        value > 1_000_000
      ) {
        setEditorError('Use a finite weight between 0 and 1000000.');
        return;
      }
      data.adjacency[source][target] = value;
      if (undirected) data.adjacency[target][source] = value;
    }
    handleInputUpdate(data);
  };
  const handleGraphInteraction = (action: GraphInteraction) => {
    if (action.type === 'connectCancel') {
      clearGesture();
      return;
    }
    if (busy || viewMode !== 'graph') return;
    const data: GraphInputData = structuredClone(graph);
    switch (action.type) {
      case 'addNode': {
        if (graphTool !== 'node') return;
        if (Object.keys(data.nodes).length >= LIMITS.nodes) {
          setEditorError('Use at most 50 nodes.');
          return;
        }
        let id = 1;
        while (Object.hasOwn(data.nodes, String(id))) id++;
        data.nodes[String(id)] = action.point;
        data.adjacency[String(id)] = {};
        handleInputUpdate(data);
        break;
      }
      case 'nodeClick': {
        if (!Object.hasOwn(data.nodes, action.nodeId)) return;
        if (graphTool === 'delete') {
          delete data.nodes[action.nodeId];
          delete data.adjacency[action.nodeId];
          Object.values(data.adjacency).forEach((neighbors) => {
            delete neighbors[action.nodeId];
          });
          if (data.start === action.nodeId) delete data.start;
          if (data.end === action.nodeId) delete data.end;
        } else if (graphTool === 'start') data.start = action.nodeId;
        else if (graphTool === 'end') data.end = action.nodeId;
        else return;
        handleInputUpdate(data);
        break;
      }
      case 'connectStart':
        if (graphTool === 'edge' && Object.hasOwn(data.nodes, action.nodeId))
          setDraggedNode(action.nodeId);
        break;
      case 'connectMove':
        if (graphTool === 'edge' && draggedNode && graph.nodes[draggedNode])
          setTempLine({ start: graph.nodes[draggedNode], end: action.point });
        break;
      case 'connectEnd': {
        if (
          graphTool !== 'edge' ||
          !draggedNode ||
          draggedNode === action.nodeId ||
          !Object.hasOwn(data.nodes, draggedNode) ||
          !Object.hasOwn(data.nodes, action.nodeId)
        ) {
          clearGesture();
          return;
        }
        // Connecting nodes must not overwrite an existing weight or direction.
        if (
          Object.hasOwn(data.adjacency[draggedNode], action.nodeId) ||
          Object.hasOwn(data.adjacency[action.nodeId], draggedNode)
        ) {
          clearGesture();
          return;
        }
        const edges = Object.values(data.adjacency).reduce(
          (sum, neighbors) => sum + Object.keys(neighbors).length,
          0,
        );
        if (edges + 2 > LIMITS.edges) {
          setEditorError('Use fewer graph connections.');
          clearGesture();
          return;
        }
        data.adjacency[draggedNode][action.nodeId] = 1;
        data.adjacency[action.nodeId][draggedNode] = 1;
        handleInputUpdate(data);
        clearGesture();
        break;
      }
    }
  };
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
    graphTool,
    setGraphTool,
    draggedNode,
    tempLine,
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
    isRunning,
    error: error || editorError,
    status,
    playback,
    busy,
    validationError,
    logHistory,
    handleRun,
    handleReset,
    handleInputUpdate,
    handleWeightChange,
    handleGraphInteraction,
  };
}
