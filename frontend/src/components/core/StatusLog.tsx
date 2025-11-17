import { useState, useEffect, useRef } from 'react';
import { History, X } from 'lucide-react';
import type { AlgorithmStep } from '../../types';

type StatusLogProps = {
  currentMessage: string;
  steps: AlgorithmStep[] | null;
  error: string | null;
  isRunning: boolean;
  isFinished: boolean;
  category: string;
  resetKey: number;
  logHistory: string[];
};

export default function StatusLog({ 
  logHistory, 
  error 

}: StatusLogProps) {
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const modalLogRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic for both the mini-view and the modal
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
    if (modalLogRef.current) {
      modalLogRef.current.scrollTop = modalLogRef.current.scrollHeight;
    }
  }, [logHistory, isModalOpen]);

  return (
    <>
      {/* Mini View (Sidebar) */}
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-gray-400 text-sm uppercase tracking-wider">Status</h4>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
            >
                <History size={14} /> History
            </button>
        </div>
        
        <div className="bg-black rounded-md p-2 h-auto flex-grow flex flex-col justify-end overflow-hidden border border-gray-800 min-h-[60px]">
            {error ? (
                <p className="text-red-500 text-sm">{error}</p>
            ) : (
                <div className="flex flex-col justify-end">
                     {/* Show the second to last message (history context) */}
                     {logHistory.length > 1 && (
                        <p className="text-gray-500 text-xs truncate">
                          {logHistory[logHistory.length - 2]}
                        </p>
                     )}
                     {/* Show the latest message (highlighted) */}
                     <p className="text-yellow-300 text-sm truncate">
                       {logHistory[logHistory.length - 1]}
                     </p>
                </div>
            )}
        </div>
      </div>

      {/* Independent History Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800/50">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <History size={20} className="text-blue-400"/> Execution Log
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                {/* Modal Content */}
                <div ref={modalLogRef} className="flex-grow overflow-y-auto p-4 space-y-1 font-mono text-sm">
                    {logHistory.map((msg, idx) => (
                        <div key={idx} className="flex gap-3 border-b border-gray-800/50 pb-1 mb-1 last:border-0">
                            <span className="text-gray-600 w-8 flex-shrink-0 text-right">{idx + 1}.</span>
                            <span className={idx === logHistory.length - 1 ? "text-yellow-300" : "text-gray-300"}>
                                {msg}
                            </span>
                        </div>
                    ))}
                </div>
                
                {/* Modal Footer */}
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