import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

type ArrayInputProps = {
  onSubmit: (data: number[]) => void;
  onRun: (data: number[]) => void;
  disabled: boolean;
};

export default function ArrayInput({ onSubmit, disabled }: ArrayInputProps) {
  const [userInput, setUserInput] = useState('');
  const [arraySize, setArraySize] = useState(15);
  const [minValue, setMinValue] = useState(10);
  const [maxValue, setMaxValue] = useState(100);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleGenerate();
  }, []);

  const handleGenerate = () => {
    if (minValue >= maxValue) {
      setError("Min < Max");
      return;
    }
    const randomArray = Array.from(
      { length: arraySize },
      () => Math.floor(Math.random() * (maxValue - minValue + 1)) + minValue
    );
    const arrayString = randomArray.join(', ');
    setUserInput(arrayString);
    setError(null);
    onSubmit(randomArray); 
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserInput(val);
    try {
      const parsed = val.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      if (parsed.length > 0) {
        onSubmit(parsed);
        setError(null);
      }
    } catch {}
  };

  return (
    <div className="flex flex-col xl:flex-row items-start xl:items-center gap-4 w-full">
      {/* Generator Group */}
      <div className="flex flex-col gap-1.5">
         <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Generator</span>
         <div className="flex items-center bg-gray-900 rounded-lg border border-gray-700 p-1">
             <span className="text-xs text-gray-500 pl-2 pr-1">Size</span>
             <input type="number" min="5" max="100" value={arraySize} onChange={(e) => setArraySize(Number(e.target.value))} className="w-10 bg-transparent text-white text-sm text-center focus:outline-none" />
             <div className="w-px h-5 bg-gray-700 mx-2"></div>
             <span className="text-xs text-gray-500 pl-1 pr-1">Range</span>
             <input type="number" placeholder="Min" value={minValue} onChange={(e) => setMinValue(Number(e.target.value))} className="w-10 bg-transparent text-white text-sm text-center focus:outline-none" />
             <span className="text-gray-500 text-xs">-</span>
             <input type="number" placeholder="Max" value={maxValue} onChange={(e) => setMaxValue(Number(e.target.value))} className="w-10 bg-transparent text-white text-sm text-center focus:outline-none" />
             <div className="w-px h-5 bg-gray-700 mx-2"></div>
             <button onClick={handleGenerate} className="p-1.5 hover:bg-gray-800 rounded text-blue-400 hover:text-blue-300 transition-colors" title="Generate New">
                <RefreshCw size={14} />
             </button>
         </div>
      </div>

      {/* Input Group */}
      <div className="flex flex-col gap-1.5 flex-grow w-full">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Custom Input</span>
        <div className="relative">
             <input type="text" value={userInput} onChange={handleInputChange} placeholder="e.g., 50, 20, 80..." className={`w-full bg-gray-900 text-white pl-3 pr-3 py-2 rounded-lg border ${error ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'} focus:ring-1 focus:outline-none text-sm font-mono tracking-tight`} disabled={disabled} />
             {error && <span className="absolute right-3 top-2 text-xs text-red-500 font-medium">{error}</span>}
        </div>
      </div>
    </div>
  );
}