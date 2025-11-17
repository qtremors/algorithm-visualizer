import { useState } from 'react';
import { Maximize2, X, Code } from 'lucide-react';
import { cn } from '../../lib/utils';

type PseudocodeProps = {
  code: string[];
  highlightedLine: number;
};

export const CodeRenderer = ({ code, highlightedLine, className }: PseudocodeProps & { className?: string }) => (
  <pre className={cn("text-sm bg-black p-3 rounded-md overflow-auto flex-grow font-mono", className)}>
    <code>
      {code.map((line, index) => (
        <div
          key={index}
          className={cn(
            'transition-colors py-0.5 px-2 border-l-2 border-transparent whitespace-pre-wrap',
            highlightedLine === index + 1
              ? 'bg-blue-900/50 border-blue-500 text-white rounded-sm'
              : 'text-gray-400'
          )}
        >
          {line}
        </div>
      ))}
    </code>
  </pre>
);

export default function Pseudocode({ code, highlightedLine }: PseudocodeProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Panel View */}
      <div className="flex-grow flex flex-col overflow-hidden h-full">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
             <Code size={18} className="text-blue-400" /> Pseudocode
          </h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
            title="Maximize"
          >
            <Maximize2 size={16} />
          </button>
        </div>
        <CodeRenderer code={code} highlightedLine={highlightedLine} />
      </div>

      {/* Individual Modal View */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800/50">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Code size={20} className="text-blue-400"/> Algorithm Logic
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-grow overflow-hidden p-4 flex flex-col">
                   <CodeRenderer code={code} highlightedLine={highlightedLine} className="h-full text-base" />
                </div>
                <div className="p-4 border-t border-gray-800 bg-gray-800/30 text-right">
                    <button onClick={() => setIsModalOpen(false)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}