import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Info, X, Code, History, Grid3X3, Network } from 'lucide-react';
import { cn } from '../lib/utils';

import { useAlgorithms } from '../contexts/AlgorithmContext.tsx';
import { useAlgorithmRunner } from '../hooks/useAlgorithmRunner.ts';
import { usePlayback } from '../hooks/usePlayback.ts';
import type { AlgorithmStep } from '../types';

import ArrayInput from '../components/inputs/ArrayInput.tsx';
import GridInput from '../components/inputs/GridInput.tsx';
import GraphInput from '../components/inputs/GraphInput.tsx';
import SortingVisualizer from '../components/visualizers/SortingVisualizer.tsx';
import GridVisualizer from '../components/visualizers/GridVisualizer.tsx';
import GraphVisualizer from '../components/visualizers/GraphVisualizer.tsx';
import PlaybackControls from '../components/core/PlaybackControls.tsx';
import Pseudocode, { CodeRenderer } from '../components/core/Pseudocode.tsx';
import StatusLog from '../components/core/StatusLog.tsx';
import InfoModal from '../components/core/InfoModal.tsx';

export default function AlgorithmWorkspace() {
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
  
  const [graphTool, setGraphTool] = useState<string>('node');
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [tempLine, setTempLine] = useState<{start: any, end: any} | null>(null);

  const [logHistory, setLogHistory] = useState<string[]>(['Ready.']);
  const [isCombinedModalOpen, setIsCombinedModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const combinedLogRef = useRef<HTMLDivElement>(null);
  const [resetKey, setResetKey] = useState(0);

  const algorithmMetadata = useMemo(() => {
    if (!categoryAlgorithms || !selectedAlgoName) return null;
    return categoryAlgorithms[selectedAlgoName];
  }, [categoryAlgorithms, selectedAlgoName]);

  const { steps, isRunning, error, runAlgorithm, resetSteps } = useAlgorithmRunner(
    category,
    selectedAlgoName
  );

  const {
    currentStep,
    currentStepIndex,
    isPlaying,
    speed,
    play,
    pause,
    nextStep,
    prevStep,
    reset,
    setSpeed,
  } = usePlayback(steps as AlgorithmStep[]);

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

  // Handles both editing weight AND deleting edge
  const handleWeightChange = (sourceId: string, targetId: string, currentWeight: number) => {
      const newData = JSON.parse(JSON.stringify(inputData));

      // 1. DELETE EDGE Logic
      if (graphTool === 'delete') {
          if(newData.adjacency[sourceId]) delete newData.adjacency[sourceId][targetId];
          if(newData.adjacency[targetId]) delete newData.adjacency[targetId][sourceId];
          handleInputUpdate(newData);
          return;
      }

      // 2. EDIT WEIGHT Logic
      const newWeightStr = prompt(`Enter new weight for connection ${sourceId} -> ${targetId}:`, String(currentWeight));
      if (newWeightStr === null) return;
      const newWeight = parseInt(newWeightStr, 10);
      if (!isNaN(newWeight) && newWeight >= 0) {
          if(newData.adjacency[sourceId]) newData.adjacency[sourceId][targetId] = newWeight;
          if(newData.adjacency[targetId] && newData.adjacency[targetId][sourceId] !== undefined) {
              newData.adjacency[targetId][sourceId] = newWeight;
          }
          handleInputUpdate(newData);
      }
  };

  const handleGraphInteraction = (action: string, payload: any) => {
      if (!inputData) return;
      const newData = JSON.parse(JSON.stringify(inputData));
      
      if (action === 'addNode') {
          if (graphTool === 'node') {
              const id = String.fromCharCode(65 + Object.keys(newData.nodes).length); 
              newData.nodes[id] = { x: payload.x, y: payload.y };
              newData.adjacency[id] = {};
              handleInputUpdate(newData);
          }
      } 
      else if (action === 'nodeClick') {
          const nodeId = payload;
          
          // 1. DELETE NODE Logic
          if (graphTool === 'delete') {
              delete newData.nodes[nodeId];
              delete newData.adjacency[nodeId];
              // Remove connections to this node from others
              Object.keys(newData.adjacency).forEach(key => {
                  if (newData.adjacency[key][nodeId]) delete newData.adjacency[key][nodeId];
              });
              // Reset start/end if they were deleted
              if (newData.start === nodeId) newData.start = null;
              if (newData.end === nodeId) newData.end = null;
              
              handleInputUpdate(newData);
              return;
          }

          if (graphTool === 'start') {
              newData.start = nodeId;
              handleInputUpdate(newData);
          } else if (graphTool === 'end') {
              newData.end = nodeId;
              handleInputUpdate(newData);
          }
      }
      else if (action === 'connectStart') {
          if (graphTool === 'edge') {
              setDraggedNode(payload.nodeId);
          }
      }
      else if (action === 'connectMove') {
           if (graphTool === 'edge' && draggedNode && inputData.nodes[draggedNode]) {
               const startNode = inputData.nodes[draggedNode];
               setTempLine({ 
                   start: { x: startNode.x, y: startNode.y }, 
                   end: { x: payload.x, y: payload.y } 
               });
           }
      }
      else if (action === 'connectEnd') {
          if (graphTool === 'edge' && draggedNode && payload.nodeId) {
              const u = draggedNode;
              const v = payload.nodeId;
              if (u !== v) {
                  if (!newData.adjacency[u]) newData.adjacency[u] = {};
                  const weight = Math.floor(Math.random() * 10) + 1;
                  newData.adjacency[u][v] = weight;
                  
                  if (!newData.adjacency[v]) newData.adjacency[v] = {};
                  newData.adjacency[v][u] = weight;

                  handleInputUpdate(newData);
              }
          }
          setDraggedNode(null);
          setTempLine(null);
      }
      else if (action === 'connectCancel') {
          setDraggedNode(null);
          setTempLine(null);
      }
  };

  // --- EFFECTS ---
  useEffect(() => { if (isRunning && steps && steps.length > 0 && logHistory.length > 0 && logHistory[0] === 'Ready.') setLogHistory([]); }, [isRunning, steps, logHistory]);
  useEffect(() => { const msg = currentStep?.message; if (msg) setLogHistory(prev => { if (prev[prev.length - 1] !== msg) return [...prev, msg]; return prev; }); else if (isRunning && logHistory.length === 0) setLogHistory(['Running...']); }, [currentStep, isRunning]);
  useEffect(() => { if (!isPlaying && currentStepIndex === (steps?.length || 0) - 1 && steps?.length > 0) setLogHistory(prev => { const final = "Algorithm finished."; if (prev[prev.length - 1] !== final) return [...prev, final]; return prev; }); }, [isPlaying, currentStepIndex, steps]);
  useEffect(() => { if (isCombinedModalOpen && combinedLogRef.current) combinedLogRef.current.scrollTop = combinedLogRef.current.scrollHeight; }, [logHistory, isCombinedModalOpen]);
  useEffect(() => { if (!categoryAlgorithms) return; if (category !== lastCategoryRef.current) { lastCategoryRef.current = category || null; setSelectedAlgoName(Object.keys(categoryAlgorithms)[0]); setInputData(null); handleReset(); resetSteps(); } else if (!selectedAlgoName) setSelectedAlgoName(Object.keys(categoryAlgorithms)[0]); }, [category, categoryAlgorithms, selectedAlgoName, handleReset, resetSteps]);
  useEffect(() => { if (steps && steps.length > 0) play(); }, [steps, play]);

  const renderInputComponent = () => {
    if (!algorithmMetadata) return null;
    if (algorithmMetadata.input_type === 'list[int]') return <ArrayInput onSubmit={handleInputUpdate} onRun={handleRun} disabled={isRunning || isPlaying} />;
    if (viewMode === 'grid') return <GridInput onSubmit={handleInputUpdate} mode={visualizationMode} setMode={setVisualizationMode} currentData={inputData} />;
    return <GraphInput onSubmit={handleInputUpdate} mode={graphTool} setMode={setGraphTool} currentData={inputData} />;
  };

  const renderVisualizerComponent = () => {
    if (!algorithmMetadata) return null;
    const hasSteps = steps && steps.length > 0;
    const displayStep = hasSteps ? currentStep : null;

    if (algorithmMetadata.visualizer === 'bar_chart') {
        return (
            <div className="w-full h-full overflow-hidden">
                <SortingVisualizer step={displayStep} initialData={inputData as number[] | null} />
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
                    step={displayStep} initialData={inputData} mode={visualizationMode} 
                    onUpdate={handleInputUpdate} isInteracting={!isRunning && !hasSteps}
                    zoom={zoom} isFitToScreen={isFitToScreen} 
                />
            </div>
        );
    } else {
        return (
            <div className={containerClass}>
                <GraphVisualizer 
                    step={displayStep} initialData={inputData} isInteracting={!isRunning && !hasSteps}
                    onNodeClick={(id) => handleGraphInteraction('nodeClick', id)}
                    onNodeDragStart={(id, e) => handleGraphInteraction('connectStart', { nodeId: id, event: e })}
                    onNodeMouseUp={(id) => handleGraphInteraction('connectEnd', { nodeId: id })}
                    onWeightClick={handleWeightChange}
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

  if (isLoading) return <div>Loading...</div>;
  if (!categoryAlgorithms) return <div>Category not found.</div>;

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-100px)] min-h-[600px]">
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-800 border border-gray-700 p-4 rounded-xl shadow-lg flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
        <div className="w-full xl:w-64 flex-shrink-0">
             <div className="flex items-center justify-between mb-1.5">
                 <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Algorithm</label>
                 <div className="flex gap-2">
                    {category === 'pathfinding' && (
                        <div className="flex bg-gray-900 rounded-md p-0.5 border border-gray-700">
                            <button onClick={() => { setViewMode('grid'); setInputData(null); resetSteps(); }} className={`p-1 rounded ${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-500'}`} title="Grid View"><Grid3X3 size={14}/></button>
                            <button onClick={() => { setViewMode('graph'); setInputData(null); resetSteps(); }} className={`p-1 rounded ${viewMode === 'graph' ? 'bg-gray-700 text-white' : 'text-gray-500'}`} title="Graph View"><Network size={14}/></button>
                        </div>
                    )}
                    <button onClick={() => setIsInfoModalOpen(true)} className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 text-xs font-medium"><Info size={14} /> Info</button>
                 </div>
            </div>
            <div className="relative">
              <select value={selectedAlgoName} onChange={(e) => setSelectedAlgoName(e.target.value)} disabled={isRunning || isPlaying} className="w-full bg-gray-900 text-white pl-4 pr-10 py-2.5 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none appearance-none transition-colors font-medium">
                {Object.keys(categoryAlgorithms).map((name) => (<option key={name} value={name}>{categoryAlgorithms[name].name}</option>))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
          </div>
          <div className="flex-grow w-full border-t xl:border-t-0 xl:border-l border-gray-700 pt-4 xl:pt-0 xl:pl-6">{renderInputComponent()}</div>
      </div>
        
      <div className="flex-shrink-0">
          <PlaybackControls
            isPlaying={isPlaying} onPlay={play} onPause={pause} onNext={nextStep} onPrev={prevStep} onReset={handleReset}
            speed={speed} onSpeedChange={setSpeed} disabled={isRunning || !steps || steps.length === 0} onVisualize={() => handleRun(null)} isVisualizing={isRunning} onOpenCombined={() => setIsCombinedModalOpen(true)}
            hasViewControls={category === 'pathfinding'} isGraphView={viewMode === 'graph'}
            zoom={zoom} onZoomChange={setZoom} isFitToScreen={isFitToScreen} onToggleFit={() => setIsFitToScreen(!isFitToScreen)}
            showPath={showPath} onTogglePath={() => setShowPath(!showPath)} showEdgeColors={showEdgeColors} onToggleEdgeColors={() => setShowEdgeColors(!showEdgeColors)}
          />
      </div>

      <div className="flex-grow flex flex-col lg:flex-row gap-4 min-h-0">
        <div 
            className="flex-1 min-w-0 bg-gray-800 rounded-xl shadow-lg border border-gray-700 relative"
            onClick={(e) => {
                if (viewMode === 'graph' && graphTool === 'node' && !isRunning) {
                   const rect = e.currentTarget.getBoundingClientRect();
                   const currentZoom = isFitToScreen ? 1 : zoom;
                   const x = (e.clientX - rect.left + e.currentTarget.scrollLeft) / currentZoom;
                   const y = (e.clientY - rect.top + e.currentTarget.scrollTop) / currentZoom;
                   handleGraphInteraction('addNode', { x, y });
                }
            }}
            onMouseMove={(e) => {
                 if (viewMode === 'graph' && draggedNode) {
                     const rect = e.currentTarget.getBoundingClientRect();
                     const currentZoom = isFitToScreen ? 1 : zoom;
                     const x = (e.clientX - rect.left + e.currentTarget.scrollLeft) / currentZoom;
                     const y = (e.clientY - rect.top + e.currentTarget.scrollTop) / currentZoom;
                     handleGraphInteraction('connectMove', { x, y });
                 }
            }}
            onMouseUp={() => { if (viewMode === 'graph') handleGraphInteraction('connectCancel', null); }}
        >
          <div className="absolute inset-0 flex flex-col">
            {renderVisualizerComponent()}
          </div>
        </div>
        <div className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-4 h-full">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden">
            <Pseudocode code={algorithmMetadata?.pseudocode || []} highlightedLine={currentStep?.line || 0} />
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg h-auto flex-shrink-0 flex flex-col">
             <StatusLog currentMessage={currentStep?.message || (isRunning ? 'Running...' : 'Ready.')} steps={steps} error={error} isRunning={isRunning} isFinished={!isPlaying && currentStepIndex === (steps?.length || 0) - 1} category={category || ''} resetKey={resetKey} logHistory={logHistory} />
          </div>
        </div>
      </div>

      {isInfoModalOpen && algorithmMetadata && <InfoModal metadata={algorithmMetadata} onClose={() => setIsInfoModalOpen(false)} />}
      {isCombinedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800/50"><h3 className="text-lg font-bold text-white">Detailed View</h3><button onClick={() => setIsCombinedModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button></div>
                <div className="flex-grow flex overflow-hidden">
                    <div className="w-1/2 border-r border-gray-800 p-4 flex flex-col"><h4 className="flex items-center gap-2 font-bold text-gray-400 mb-3"><Code size={18}/> Algorithm Logic</h4><CodeRenderer code={algorithmMetadata?.pseudocode || []} highlightedLine={currentStep?.line || 0} className="h-full text-base" /></div>
                    <div className="w-1/2 p-4 flex flex-col bg-black/20"><h4 className="flex items-center gap-2 font-bold text-gray-400 mb-3"><History size={18}/> Execution Log</h4><div ref={combinedLogRef} className="flex-grow overflow-y-auto font-mono text-sm space-y-1 pr-2">{logHistory.map((msg, idx) => (<div key={idx} className="flex gap-3 border-b border-gray-800/50 pb-1 mb-1 last:border-0"><span className="text-gray-600 w-8 flex-shrink-0 text-right">{idx + 1}.</span><span className={idx === logHistory.length - 1 ? "text-yellow-300" : "text-gray-300"}>{msg}</span></div>))}</div></div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}