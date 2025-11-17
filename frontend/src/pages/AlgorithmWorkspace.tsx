import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Info, X, Code, History } from 'lucide-react';
import { useAlgorithms } from '../contexts/AlgorithmContext.tsx';
import { useAlgorithmRunner } from '../hooks/useAlgorithmRunner.ts';
import { usePlayback } from '../hooks/usePlayback.ts';
import type { AlgorithmStep } from '../types';

import ArrayInput from '../components/inputs/ArrayInput.tsx';
import GridInput from '../components/inputs/GridInput.tsx';
import SortingVisualizer from '../components/visualizers/SortingVisualizer.tsx';
import GridVisualizer from '../components/visualizers/GridVisualizer.tsx';
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

  const [selectedAlgoName, setSelectedAlgoName] = useState<string>('');
  const [inputData, setInputData] = useState<any>(null);
  const [visualizationMode, setVisualizationMode] = useState<string>('wall');
  
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

  const handleRun = useCallback((data: any) => {
    const dataToRun = data || inputData;
    if (dataToRun) {
        setInputData(dataToRun); 
        runAlgorithm(dataToRun); 
    }
  }, [runAlgorithm, inputData]);

  const handleReset = useCallback(() => {
    reset();
    setLogHistory(['Ready.']);
    setResetKey(prev => prev + 1); 
  }, [reset]);

  // --- Completely wipe old state when input changes ---
  const handleInputUpdate = useCallback((newData: any) => {
    setInputData(newData);
    reset();
    resetSteps();
    setLogHistory(['Ready.']);
    setResetKey(prev => prev + 1);
  }, [reset, resetSteps]);

  useEffect(() => {
    if (isRunning && steps && steps.length > 0 && logHistory.length > 0 && logHistory[0] === 'Ready.') {
        setLogHistory([]);
    }
  }, [isRunning, steps, logHistory]);

  useEffect(() => {
    const msg = currentStep?.message;
    if (msg) {
      setLogHistory(prev => {
        if (prev[prev.length - 1] !== msg) return [...prev, msg];
        return prev;
      });
    } else if (isRunning && logHistory.length === 0) {
        setLogHistory(['Running...']);
    }
  }, [currentStep, isRunning]);

  useEffect(() => {
    if (!isPlaying && currentStepIndex === (steps?.length || 0) - 1 && steps?.length > 0) {
       setLogHistory(prev => {
         const final = "Algorithm finished.";
         if (prev[prev.length - 1] !== final) return [...prev, final];
         return prev;
       });
    }
  }, [isPlaying, currentStepIndex, steps]);

  useEffect(() => {
    if (isCombinedModalOpen && combinedLogRef.current) {
      combinedLogRef.current.scrollTop = combinedLogRef.current.scrollHeight;
    }
  }, [logHistory, isCombinedModalOpen]);

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

  useEffect(() => {
    if (steps && steps.length > 0) {
      play();
    }
  }, [steps, play]);

  const renderInputComponent = () => {
    if (!algorithmMetadata) return null;
    switch (algorithmMetadata.input_type) {
      case 'list[int]':
        return <ArrayInput onSubmit={handleInputUpdate} onRun={handleRun} disabled={isRunning || isPlaying} />;
      case 'graph_grid':
        return <GridInput onSubmit={handleInputUpdate} mode={visualizationMode} setMode={setVisualizationMode} currentData={inputData} />;
      default:
        return <div className="text-red-500">Unknown input type</div>;
    }
  };

  const renderVisualizerComponent = () => {
    if (!algorithmMetadata) return null;
    const hasSteps = steps && steps.length > 0;
    const displayStep = hasSteps ? currentStep : null;
    const displayData = displayStep?.snapshot || inputData;

    switch (algorithmMetadata.visualizer) {
      case 'bar_chart':
        return <SortingVisualizer step={displayStep} initialData={inputData as number[] | null} />;
      case 'grid_2d':
        return <GridVisualizer step={displayStep} initialData={inputData} mode={visualizationMode} onUpdate={handleInputUpdate} isInteracting={!isRunning && !hasSteps} />;
      default:
        return <div className="text-red-500">Unknown visualizer type</div>;
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
                 <button 
                    onClick={() => setIsInfoModalOpen(true)}
                    className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 text-xs font-medium"
                 >
                    <Info size={14} /> Info
                 </button>
            </div>
            <div className="relative">
              <select value={selectedAlgoName} onChange={(e) => setSelectedAlgoName(e.target.value)} disabled={isRunning || isPlaying} className="w-full bg-gray-900 text-white pl-4 pr-10 py-2.5 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none appearance-none transition-colors font-medium">
                {Object.keys(categoryAlgorithms).map((name) => (<option key={name} value={name}>{categoryAlgorithms[name].name}</option>))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
            </div>
          </div>
          <div className="flex-grow w-full border-t xl:border-t-0 xl:border-l border-gray-700 pt-4 xl:pt-0 xl:pl-6">
            {renderInputComponent()}
          </div>
      </div>
        
      {/* Controls */}
      <div className="flex-shrink-0">
          <PlaybackControls
            isPlaying={isPlaying}
            onPlay={play}
            onPause={pause}
            onNext={nextStep}
            onPrev={prevStep}
            onReset={handleReset}
            speed={speed}
            onSpeedChange={setSpeed}
            disabled={isRunning || !steps || steps.length === 0}
            onVisualize={() => handleRun(null)}
            isVisualizing={isRunning}
            onOpenCombined={() => setIsCombinedModalOpen(true)}
          />
      </div>

      {/* Workspace */}
      <div className="flex-grow flex flex-col lg:flex-row gap-4 min-h-0">
        <div className="flex-1 min-w-0 bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden relative">
          <div className="absolute inset-0 flex flex-col">
            {renderVisualizerComponent()}
          </div>
        </div>
        <div className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-4 h-full">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden">
            <Pseudocode code={algorithmMetadata?.pseudocode || []} highlightedLine={currentStep?.line || 0} />
          </div>
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg h-auto flex-shrink-0 flex flex-col">
             <StatusLog 
                currentMessage={currentStep?.message || (isRunning ? 'Running...' : 'Ready.')} 
                steps={steps} 
                error={error} 
                isRunning={isRunning} 
                isFinished={!isPlaying && currentStepIndex === (steps?.length || 0) - 1} 
                category={category || ''} 
                resetKey={resetKey}
                logHistory={logHistory}
             />
          </div>
        </div>
      </div>

      {/* Modals */}
      {isInfoModalOpen && algorithmMetadata && (
        <InfoModal metadata={algorithmMetadata} onClose={() => setIsInfoModalOpen(false)} />
      )}

      {isCombinedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800/50">
                    <h3 className="text-lg font-bold text-white">Detailed View</h3>
                    <button onClick={() => setIsCombinedModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>
                <div className="flex-grow flex overflow-hidden">
                    <div className="w-1/2 border-r border-gray-800 p-4 flex flex-col">
                        <h4 className="flex items-center gap-2 font-bold text-gray-400 mb-3"><Code size={18}/> Algorithm Logic</h4>
                        <CodeRenderer code={algorithmMetadata?.pseudocode || []} highlightedLine={currentStep?.line || 0} className="h-full text-base" />
                    </div>
                    <div className="w-1/2 p-4 flex flex-col bg-black/20">
                        <h4 className="flex items-center gap-2 font-bold text-gray-400 mb-3"><History size={18}/> Execution Log</h4>
                        <div ref={combinedLogRef} className="flex-grow overflow-y-auto font-mono text-sm space-y-1 pr-2">
                            {logHistory.map((msg, idx) => (
                                <div key={idx} className="flex gap-3 border-b border-gray-800/50 pb-1 mb-1 last:border-0">
                                    <span className="text-gray-600 w-8 flex-shrink-0 text-right">{idx + 1}.</span>
                                    <span className={idx === logHistory.length - 1 ? "text-yellow-300" : "text-gray-300"}>{msg}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}