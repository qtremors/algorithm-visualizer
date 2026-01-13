import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAlgorithms } from '../contexts/AlgorithmContext';
import { useAlgorithmRunner } from './useAlgorithmRunner';
import { usePlayback } from './usePlayback';
import type { AlgorithmStep } from '../types';

export function useAlgorithmWorkspace() {
    const { category } = useParams<{ category: string }>();
    const { algorithms, isLoading } = useAlgorithms();

    const lastCategoryRef = useRef<string | null>(category || null);

    const categoryAlgorithms = useMemo(() => {
        if (!algorithms || !category) return null;
        return algorithms[category];
    }, [algorithms, category]);

    // --- STATE ---
    const [selectedAlgoName, setSelectedAlgoName] = useState<string>('');
    const [inputData, setInputData] = useState<any>(null);

    const [visualizationMode, setVisualizationMode] = useState<string>('wall');
    const [viewMode, setViewMode] = useState<'grid' | 'graph'>('grid');

    const [zoom, setZoom] = useState(1);
    const [isFitToScreen, setIsFitToScreen] = useState(true);
    const [showPath, setShowPath] = useState(true);
    const [showEdgeColors, setShowEdgeColors] = useState(false);
    const [showMobileWarning, setShowMobileWarning] = useState(false);

    // Graph Tool State
    const [graphTool, setGraphTool] = useState<string>('node');
    const [draggedNode, setDraggedNode] = useState<string | null>(null);
    const [tempLine, setTempLine] = useState<{ start: any, end: any } | null>(null);

    const [logHistory, setLogHistory] = useState<string[]>(['Ready.']);
    const [isCombinedModalOpen, setIsCombinedModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [resetKey, setResetKey] = useState(0);

    const algorithmMetadata = useMemo(() => {
        if (!categoryAlgorithms || !selectedAlgoName) return null;
        return categoryAlgorithms[selectedAlgoName];
    }, [categoryAlgorithms, selectedAlgoName]);

    const { steps, isRunning, error, runAlgorithm, resetSteps } = useAlgorithmRunner(
        category,
        selectedAlgoName
    );

    const playback = usePlayback(steps as AlgorithmStep[]);
    const { currentStep, currentStepIndex, isPlaying, play, pause, nextStep, prevStep, reset } = playback;

    // --- EFFECTS ---
    useEffect(() => { if (isRunning && steps && steps.length > 0 && logHistory.length > 0 && logHistory[0] === 'Ready.') setLogHistory([]); }, [isRunning, steps, logHistory]);
    useEffect(() => { const msg = currentStep?.message; if (msg) setLogHistory(prev => { if (prev[prev.length - 1] !== msg) return [...prev, msg]; return prev; }); else if (isRunning && logHistory.length === 0) setLogHistory(['Running...']); }, [currentStep, isRunning]);
    useEffect(() => { if (!isPlaying && currentStepIndex === (steps?.length || 0) - 1 && steps?.length > 0) setLogHistory(prev => { const final = "Algorithm finished."; if (prev[prev.length - 1] !== final) return [...prev, final]; return prev; }); }, [isPlaying, currentStepIndex, steps]);
    useEffect(() => { if (steps && steps.length > 0) play(); }, [steps, play]);

    // --- HANDLERS ---
    const handleRun = useCallback((data: any) => {
        const dataToRun = data || inputData;
        if (dataToRun) { setInputData(dataToRun); runAlgorithm(dataToRun); }
    }, [runAlgorithm, inputData]);

    const handleReset = useCallback(() => {
        reset(); setLogHistory(['Ready.']); setResetKey(prev => prev + 1);
    }, [reset]);

    const handleInputUpdate = useCallback((newData: any) => {
        setInputData(newData); reset(); resetSteps(); setTempLine(null); setDraggedNode(null);
        if (steps && steps.length > 0) { setLogHistory(['Ready.']); setResetKey(prev => prev + 1); }
    }, [reset, resetSteps, steps]);

    // Handle Category Changes
    useEffect(() => {
        if (!categoryAlgorithms) return;
        if (category !== lastCategoryRef.current) {
            lastCategoryRef.current = category || null;
            setSelectedAlgoName(Object.keys(categoryAlgorithms)[0]);
            setInputData(null);
            handleReset();
            resetSteps();
        } else if (!selectedAlgoName) {
            setSelectedAlgoName(Object.keys(categoryAlgorithms)[0]);
        }
    }, [category, categoryAlgorithms, selectedAlgoName, handleReset, resetSteps]);

    // Mobile Check
    useEffect(() => {
        const checkMobile = () => { if (window.innerWidth < 1024) setShowMobileWarning(true); };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) return;
            switch (e.code) {
                case 'Space': e.preventDefault(); isPlaying ? pause() : play(); break;
                case 'ArrowRight': e.preventDefault(); nextStep(); break;
                case 'ArrowLeft': e.preventDefault(); prevStep(); break;
                case 'KeyR': if (!e.ctrlKey && !e.metaKey) handleReset(); break;
                case 'Escape': setIsCombinedModalOpen(false); setIsInfoModalOpen(false); setShowMobileWarning(false); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, play, pause, nextStep, prevStep, handleReset]);

    // Graph Interactions
    const handleWeightChange = (sourceId: string, targetId: string, currentWeight: number) => {
        const newData = structuredClone(inputData);
        if (graphTool === 'delete') {
            if (newData.adjacency[sourceId]) delete newData.adjacency[sourceId][targetId];
            if (newData.adjacency[targetId]) delete newData.adjacency[targetId][sourceId];
            if (newData.adjacency[sourceId] && Object.keys(newData.adjacency[sourceId]).length === 0) delete newData.adjacency[sourceId]; // Optional cleanup
            handleInputUpdate(newData);
            return;
        }
        const newWeightStr = prompt(`Enter new weight for connection ${sourceId} -> ${targetId}:`, String(currentWeight));
        if (newWeightStr === null) return;
        const newWeight = parseInt(newWeightStr, 10);
        if (!isNaN(newWeight) && newWeight >= 0) {
            if (newData.adjacency[sourceId]) newData.adjacency[sourceId][targetId] = newWeight;
            if (newData.adjacency[targetId] && newData.adjacency[targetId][sourceId] !== undefined) newData.adjacency[targetId][sourceId] = newWeight;
            handleInputUpdate(newData);
        }
    };

    const handleGraphInteraction = (action: string, payload: any) => {
        if (!inputData) return;
        const newData = structuredClone(inputData);

        if (action === 'addNode' && graphTool === 'node') {
            const existingIds = Object.keys(newData.nodes).map(id => parseInt(id, 10)).filter(id => !isNaN(id));
            const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
            const id = String(nextId);
            newData.nodes[id] = { x: payload.x, y: payload.y };
            newData.adjacency[id] = {};
            handleInputUpdate(newData);
        }
        else if (action === 'nodeClick') {
            const nodeId = payload;
            if (graphTool === 'delete') {
                delete newData.nodes[nodeId];
                delete newData.adjacency[nodeId];
                Object.keys(newData.adjacency).forEach(key => { if (newData.adjacency[key][nodeId]) delete newData.adjacency[key][nodeId]; });
                if (newData.start === nodeId) newData.start = null;
                if (newData.end === nodeId) newData.end = null;
                handleInputUpdate(newData);
            } else if (graphTool === 'start') {
                newData.start = nodeId; handleInputUpdate(newData);
            } else if (graphTool === 'end') {
                newData.end = nodeId; handleInputUpdate(newData);
            }
        }
        else if (action === 'connectStart' && graphTool === 'edge') {
            setDraggedNode(payload.nodeId);
        }
        else if (action === 'connectMove' && graphTool === 'edge' && draggedNode && inputData.nodes[draggedNode]) {
            const startNode = inputData.nodes[draggedNode];
            setTempLine({ start: { x: startNode.x, y: startNode.y }, end: { x: payload.x, y: payload.y } });
        }
        else if (action === 'connectEnd' && graphTool === 'edge' && draggedNode && payload.nodeId) {
            const u = draggedNode; const v = payload.nodeId;
            if (u !== v) {
                if (!newData.adjacency[u]) newData.adjacency[u] = {};
                const weight = Math.floor(Math.random() * 10) + 1;
                newData.adjacency[u][v] = weight;
                if (!newData.adjacency[v]) newData.adjacency[v] = {};
                newData.adjacency[v][u] = weight;
                handleInputUpdate(newData);
            }
            setDraggedNode(null); setTempLine(null);
        }
        else if (action === 'connectCancel') {
            setDraggedNode(null); setTempLine(null);
        }
    };

    return {
        // Context & Algorithms
        category,
        algorithms,
        isLoading,
        categoryAlgorithms,
        algorithmMetadata,

        // State
        selectedAlgoName, setSelectedAlgoName,
        inputData, setInputData,
        visualizationMode, setVisualizationMode,
        viewMode, setViewMode,
        zoom, setZoom,
        isFitToScreen, setIsFitToScreen,
        showPath, setShowPath,
        showEdgeColors, setShowEdgeColors,
        showMobileWarning, setShowMobileWarning,

        // Graph State
        graphTool, setGraphTool,
        draggedNode, setDraggedNode,
        tempLine, setTempLine,

        // UI State
        logHistory,
        isCombinedModalOpen, setIsCombinedModalOpen,
        isInfoModalOpen, setIsInfoModalOpen,
        resetKey,

        // Runner & Playback
        steps, isRunning, error, runAlgorithm, resetSteps,
        playback, // Spread this in component if needed, or access props individually

        // Handlers
        handleRun,
        handleReset,
        handleInputUpdate,
        handleWeightChange,
        handleGraphInteraction
    };
}
