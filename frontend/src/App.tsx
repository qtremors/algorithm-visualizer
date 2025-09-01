import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// --- Type Definitions ---
interface AlgorithmStep {
  type: 'compare' | 'swap' | 'sorted' | 'info';
  indices: number[];
  snapshot: number[];
  message: string;
  line: number;
}

interface AlgorithmMeta {
  name: string;
  pseudocode: string[];
}

interface AlgorithmsData {
  [category: string]: {
    [name: string]: AlgorithmMeta;
  };
}

// --- Main App Component ---
export default function App() {
  // State for algorithm metadata and selection
  const [algorithms, setAlgorithms] = useState<AlgorithmsData | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState({ category: 'sorting', name: 'bubble_sort' });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // State for visualization playback
  const [steps, setSteps] = useState<AlgorithmStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [arrayState, setArrayState] = useState<number[]>([]);
  
  // State for user-defined array input and generation
  const [userInput, setUserInput] = useState('29, 10, 14, 37, 13, 33, 22, 9');
  const [inputError, setInputError] = useState<string | null>(null);
  const [arraySize, setArraySize] = useState(15);
  const [minValue, setMinValue] = useState(10);
  const [maxValue, setMaxValue] = useState(100);

  // State for UI and controls
  const [speed, setSpeed] = useState(500); // ms delay
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusLog, setStatusLog] = useState<string[]>(['Ready to start.']);

  // Refs for WebSocket, animation loop, and dynamic sizing
  const ws = useRef<WebSocket | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const lastUpdateTime = useRef(0);
  const vizContainerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [vizHeight, setVizHeight] = useState(300);

  // --- Dynamic Sizing for Visualization Area ---
  useEffect(() => {
    const handleResize = () => {
      if (vizContainerRef.current) {
        setVizHeight(vizContainerRef.current.offsetHeight);
      }
    };
    handleResize(); // Initial size
    const resizeObserver = new ResizeObserver(handleResize);
    if (vizContainerRef.current) {
        resizeObserver.observe(vizContainerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  // --- Click Outside Handler for Dropdown ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsDropdownOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  // --- Data Fetching ---
  useEffect(() => {
    const fetchAlgorithms = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/algorithms');
        if (!response.ok) throw new Error('Network response was not ok');
        const data: AlgorithmsData = await response.json();
        setAlgorithms(data);
      } catch (error) {
        console.error("Failed to fetch algorithms:", error);
      }
    };
    fetchAlgorithms();
  }, []);

  // --- Core Playback Logic ---
  const playbackLoop = useCallback((timestamp: number) => {
    if (!isPlaying || steps.length === 0) return;
    if (timestamp - lastUpdateTime.current >= speed) {
      setCurrentStepIndex(prevIndex => {
        if (prevIndex >= steps.length - 1) {
          setIsPlaying(false);
          setIsFinished(true); // This will trigger the useEffect for the final log
          return prevIndex;
        }
        const nextIndex = prevIndex + 1;
        const nextStep = steps[nextIndex];
        setArrayState(nextStep.snapshot);
        if(nextStep.message && statusLog[0] !== nextStep.message) {
          setStatusLog(prev => [nextStep.message, ...prev].slice(0, 10));
        }
        return nextIndex;
      });
      lastUpdateTime.current = timestamp;
    }
    animationFrameId.current = requestAnimationFrame(playbackLoop);
  }, [isPlaying, steps, speed, statusLog]);

  useEffect(() => {
    if (isPlaying) {
      lastUpdateTime.current = performance.now();
      animationFrameId.current = requestAnimationFrame(playbackLoop);
    } else if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isPlaying, playbackLoop]);
  
  // --- Final Log Generation ---
  useEffect(() => {
    if (isFinished) {
      const allMessages = steps
        .map(step => step.message)
        .filter(Boolean); // Filter out any empty/null messages
      setStatusLog(["Array is fully sorted!", ...allMessages]);
    }
  }, [isFinished, steps]);


  // --- WebSocket and Visualization Control ---
  const startVisualization = useCallback(() => {
    if (ws.current) ws.current.close();
    
    let parsedArray: number[] = [];
    try {
      parsedArray = userInput.split(',').map(s => {
        const num = parseInt(s.trim(), 10);
        if (isNaN(num)) throw new Error("Input contains non-numeric values.");
        return num;
      });
      if (parsedArray.length < 2 || parsedArray.length > 50) {
        throw new Error("Please provide between 2 and 50 numbers.");
      }
      setInputError(null);
    } catch (error: any) {
      setInputError(error.message);
      return;
    }

    setIsLoading(true);
    setIsPlaying(false);
    setIsFinished(false);
    setCurrentStepIndex(0);
    setArrayState(parsedArray); 
    setStatusLog(["Connecting to server..."]);
    
    const newWs = new WebSocket(`ws://127.0.0.1:8000/ws/visualize/${selectedAlgorithm.category}/${selectedAlgorithm.name}`);
    const receivedSteps: AlgorithmStep[] = [];

    newWs.onopen = () => {
        newWs.send(JSON.stringify(parsedArray));
        setStatusLog(prev => ["Connection established, running algorithm...", ...prev].slice(0, 10));
    }
    newWs.onmessage = (event) => receivedSteps.push(JSON.parse(event.data));
    newWs.onclose = () => {
      setSteps(receivedSteps);
      setIsLoading(false);
      if (receivedSteps.length > 0) {
        setArrayState(receivedSteps[0].snapshot);
        setStatusLog(prev => ["Algorithm steps received, starting visualization...", ...prev].slice(0, 10));
        setIsPlaying(true);
      } else {
        setStatusLog(prev => ["No steps received, check backend.", ...prev].slice(0, 10));
      }
    };
    newWs.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsLoading(false);
      setInputError("Could not connect to the visualization server.");
      setStatusLog(prev => ["Connection failed.", ...prev].slice(0, 10));
    };
    ws.current = newWs;
  }, [userInput, selectedAlgorithm]);

  // --- UI Event Handlers ---
  const handleReset = () => {
    setIsPlaying(false);
    setIsFinished(false);
    setCurrentStepIndex(0);
    if (steps.length > 0) setArrayState(steps[0].snapshot);
    setStatusLog(["Visualization reset."]);
  };

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const nextStep = steps[nextIndex];
      setCurrentStepIndex(nextIndex);
      setArrayState(nextStep.snapshot);
      if(nextStep.message && statusLog[0] !== nextStep.message) {
        setStatusLog(prev => [nextStep.message, ...prev].slice(0, 10));
      }
    } else if (steps.length > 0) {
      setIsFinished(true);
    }
  };

  const handleGenerate = () => {
    if (minValue >= maxValue) {
      setInputError("Min value must be less than max value.");
      return;
    }
    const randomArray = Array.from(
      { length: arraySize },
      () => Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue
    );
    setUserInput(randomArray.join(', '));
    setInputError(null);
  };

  // --- Derived State for Rendering ---
  const currentStep = steps[currentStepIndex];
  const algoMeta = algorithms?.[selectedAlgorithm.category]?.[selectedAlgorithm.name];
  const maxArrayValue = Math.max(...arrayState, 1);

  const getBarColor = (index: number): string => {
    if (isFinished) return 'bg-green-500';
    if (!currentStep) return 'bg-sky-500';
    if (currentStep.type === 'sorted' && currentStep.indices.includes(index)) return 'bg-green-500';
    if (currentStep.type === 'compare' && currentStep.indices.includes(index)) return 'bg-yellow-500';
    if (currentStep.type === 'swap' && currentStep.indices.includes(index)) return 'bg-red-500';
    return 'bg-sky-500';
  };

  const sliderBackground = useMemo(() => {
    const min = 50;
    const max = 1000;
    const value = 1050 - speed;
    const percentage = ((value - min) / (max - min)) * 100;
    return `linear-gradient(to right, #3b82f6 ${percentage}%, #4b5563 ${percentage}%)`;
  }, [speed]);
  
  // --- JSX ---
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center p-4 lg:p-6 font-sans">
      <header className="w-full max-w-7xl text-center mb-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-wider">Algorithm Visualizer</h1>
      </header>

      <main className="w-full max-w-7xl flex-grow flex flex-col gap-4">
        {/* --- Unified Control Panel --- */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col gap-4">
          {/* Top Row: Generation & Main Action */}
          <div className="flex flex-col xl:flex-row items-end justify-between gap-4">
              {/* Generation Controls */}
              <div className="flex flex-col sm:flex-row items-end gap-4 w-full xl:w-auto">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Array Size</label>
                  <input type="number" min="5" max="50" value={arraySize} onChange={(e) => setArraySize(Number(e.target.value))} className="w-full sm:w-24 bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:outline-none h-[42px]" disabled={isLoading || isPlaying} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Value Range</label>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Min" value={minValue} onChange={(e) => setMinValue(Number(e.target.value))} className="w-full sm:w-24 bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:outline-none h-[42px]" disabled={isLoading || isPlaying} />
                    <input type="number" placeholder="Max" value={maxValue} onChange={(e) => setMaxValue(Number(e.target.value))} className="w-full sm:w-24 bg-gray-700 text-white px-3 py-2 rounded-md border border-gray-600 focus:outline-none h-[42px]" disabled={isLoading || isPlaying} />
                  </div>
                </div>
                <div>
                  <button onClick={handleGenerate} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50 h-[42px]" disabled={isLoading || isPlaying}>
                      Generate
                  </button>
                </div>
              </div>
               {/* Main Action */}
              <div className="flex-grow w-full xl:w-auto">
                 <div className="flex items-end gap-4">
                    <div className="flex-grow">
                      <input id="array-input" type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="e.g., 50, 20, 80, 10" className={`w-full bg-gray-700 text-white px-3 py-2 rounded-md border ${inputError ? 'border-red-500' : 'border-gray-600'} focus:outline-none h-[42px]`} disabled={isLoading || isPlaying}/>
                      {inputError && <p className="text-red-500 text-xs mt-1">{inputError}</p>}
                    </div>
                    <div>
                      <button onClick={startVisualization} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-md transition-colors disabled:opacity-50 w-full sm:w-auto h-[42px]">
                        {isLoading ? "Loading..." : `Visualize`}
                      </button>
                    </div>
                  </div>
              </div>
          </div>
           {/* Bottom Row: Playback Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 pt-2 border-t border-gray-700">
             <div className="flex items-center gap-4">
                {/* Custom Algorithm Dropdown */}
                <div ref={dropdownRef} className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={isLoading || isPlaying}
                        className="w-full sm:w-48 bg-gray-700 text-white px-4 py-2 rounded-md border border-gray-600 focus:outline-none h-[42px] flex items-center justify-between disabled:opacity-50"
                    >
                        <span>{algoMeta?.name || 'Select Algorithm'}</span>
                        <ChevronDownIcon />
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute top-full mt-2 w-full bg-gray-700 rounded-md shadow-lg z-10 border border-gray-600">
                            {algorithms && algorithms.sorting && Object.keys(algorithms.sorting).map(algoName => (
                                <button
                                    key={algoName}
                                    onClick={() => {
                                        setSelectedAlgorithm({ category: 'sorting', name: algoName });
                                        setIsDropdownOpen(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-600 first:rounded-t-md last:rounded-b-md"
                                >
                                    {algorithms.sorting[algoName].name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsPlaying(!isPlaying)} disabled={isLoading || isFinished || steps.length === 0} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50">
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <button onClick={handleNextStep} disabled={isLoading || isPlaying || isFinished || steps.length === 0} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50">
                        <StepForwardIcon />
                    </button>
                    <button onClick={handleReset} disabled={isLoading || steps.length === 0} className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50">
                        <RotateCcwIcon />
                    </button>
                </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto sm:min-w-[250px]">
                <span className="text-sm">Slower</span>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={1050 - speed}
                  onChange={(e) => setSpeed(1050 - parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  style={{ background: sliderBackground }}
                  disabled={isLoading}
                />
                <span className="text-sm">Faster</span>
            </div>
          </div>
        </div>
        
        {/* --- Main Visualization Area --- */}
        <div className="bg-gray-800 rounded-lg shadow-lg flex-grow flex flex-col lg:flex-row gap-4 p-4">
          <div ref={vizContainerRef} className="flex-grow flex flex-col w-full lg:w-2/3 min-h-[30vh] lg:min-h-0">
            <div className="flex-grow flex items-end justify-center gap-1 w-full h-full">
              {arrayState.map((value, index) => (
                <div key={index} className="flex-grow flex flex-col items-center justify-end" style={{ maxWidth: `${100/arrayState.length}%`}}>
                  <div className={`w-full rounded-t-md transition-colors duration-200 ${getBarColor(index)}`} style={{ height: `${(value / maxArrayValue) * (vizHeight - (arrayState.length <= 35 ? 20 : 0) )}px` }} ></div>
                  {arrayState.length <= 35 && <span className="text-xs mt-1 text-gray-400">{value}</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="w-full lg:w-1/3 bg-gray-900 p-4 rounded-md flex flex-col border-t-4 lg:border-t-0 lg:border-l-4 border-gray-700 min-h-[30vh] lg:min-h-0">
            <h3 className="text-lg font-bold mb-2">{algoMeta?.name || 'Algorithm'}</h3>
            <pre className="text-sm bg-black p-3 rounded-md overflow-auto flex-grow">
              <code>
                {algoMeta?.pseudocode.map((line, index) => (
                  <div key={index} className={`transition-colors py-0.5 px-1 ${currentStep?.line === index + 1 ? 'bg-blue-900 text-white rounded' : 'text-gray-400'}`}>
                    {line}
                  </div>
                ))}
              </code>
            </pre>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h4 className="font-bold text-gray-400 mb-2">Status Log:</h4>
              <div className="text-sm space-y-1 h-32 overflow-y-auto flex flex-col-reverse">
                {statusLog.map((message, index) => (
                  <p key={index} className={`transition-all duration-300 ${index === 0 ? 'text-yellow-300 opacity-100' : 'text-gray-500 opacity-50'}`}>
                    {message}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- SVG Icons ---
const PlayIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>);
const PauseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>);
const StepForwardIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="5" x2="19" y2="19"></line><polygon points="5 4 15 12 5 20 5 4"></polygon></svg>);
const RotateCcwIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6"></path><path d="M3.51 15a9 9 0 1 0 2.13-9.36L3 12"></path></svg>);
const ChevronDownIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>);

