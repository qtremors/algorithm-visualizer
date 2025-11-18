import Pseudocode from '../core/Pseudocode';
import StatusLog from '../core/StatusLog';
import type { AlgorithmMetadata, AlgorithmStep } from '../../types';

type WorkspaceSidebarProps = {
  algorithmMetadata: AlgorithmMetadata | null;
  currentStep: AlgorithmStep | undefined;
  currentStepIndex: number;
  steps: AlgorithmStep[];
  error: string | null;
  isRunning: boolean;
  isPlaying: boolean;
  category: string;
  resetKey: number;
  logHistory: string[];
};

export default function WorkspaceSidebar({
  algorithmMetadata,
  currentStep,
  currentStepIndex,
  steps,
  error,
  isRunning,
  isPlaying,
  category,
  resetKey,
  logHistory
}: WorkspaceSidebarProps) {
  return (
    <div className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-4 h-full">
      {/* Pseudocode Panel */}
      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg flex-1 flex flex-col min-h-0 overflow-hidden">
        <Pseudocode 
            code={algorithmMetadata?.pseudocode || []} 
            highlightedLine={currentStep?.line || 0} 
        />
      </div>
      
      {/* Status Log Panel */}
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
  );
}