import { X, Info, CheckCircle2, XCircle, Clock, Database } from 'lucide-react';
import type { AlgorithmMetadata } from '../../types';

type InfoModalProps = {
  metadata: AlgorithmMetadata;
  onClose: () => void;
};

export default function InfoModal({ metadata, onClose }: InfoModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gray-800/50">
          <h3 className="text-2xl font-bold text-white flex items-center gap-3">
            <Info size={24} className="text-blue-400" /> 
            {metadata.name}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* Description */}
          <div>
            <p className="text-gray-300 leading-relaxed text-lg">
              {metadata.description}
            </p>
          </div>

          {/* Complexity Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Clock size={18} /> <span className="text-sm font-bold uppercase tracking-wider">Time Complexity</span>
              </div>
              <div className="text-xl font-mono text-white">{metadata.complexity?.time || "N/A"}</div>
            </div>
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Database size={18} /> <span className="text-sm font-bold uppercase tracking-wider">Space Complexity</span>
              </div>
              <div className="text-xl font-mono text-white">{metadata.complexity?.space || "N/A"}</div>
            </div>
          </div>

          {/* Pros & Cons */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-green-400 font-bold flex items-center gap-2 mb-3">
                <CheckCircle2 size={18} /> Advantages
              </h4>
              <ul className="space-y-2">
                {metadata.pros?.map((pro, i) => (
                  <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/50 mt-1.5 flex-shrink-0"></span>
                    {pro}
                  </li>
                )) || <li className="text-gray-500">No data available.</li>}
              </ul>
            </div>
            <div>
              <h4 className="text-red-400 font-bold flex items-center gap-2 mb-3">
                <XCircle size={18} /> Disadvantages
              </h4>
              <ul className="space-y-2">
                {metadata.cons?.map((con, i) => (
                  <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-1.5 flex-shrink-0"></span>
                    {con}
                  </li>
                )) || <li className="text-gray-500">No data available.</li>}
              </ul>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-800/30 text-right">
          <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}