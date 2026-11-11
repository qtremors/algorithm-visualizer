import { useId, useState } from 'react';
import type { AlgorithmStep } from '../../types';
import Pseudocode from './Pseudocode';
import LearningPanel from './LearningPanel';
import LogList from './LogList';

export default function LearningTabs({
  code,
  step,
  steps,
  index,
  algorithm,
  messages,
  breakpoints,
  onToggleBreakpoint,
}: {
  code: string[];
  step?: AlgorithmStep;
  steps: AlgorithmStep[];
  index: number;
  algorithm: string;
  messages: string[];
  breakpoints?: number[];
  onToggleBreakpoint?: (line: number) => void;
}) {
  const [tab, setTab] = useState('code');
  const id = useId();
  const tabs = [
    ['code', 'Pseudocode'],
    ['state', 'State'],
    ['history', 'History'],
  ];
  return (
    <section className="learning-tabs" aria-label="Algorithm learning panels">
      <div
        role="tablist"
        aria-label="Learning panels"
        className="learning-tablist"
      >
        {tabs.map(([value, label], i) => (
          <button
            key={value}
            id={`${id}-${value}-tab`}
            role="tab"
            aria-selected={tab === value}
            aria-controls={`${id}-${value}-panel`}
            tabIndex={tab === value ? 0 : -1}
            onClick={() => setTab(value)}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
                return;
              event.preventDefault();
              const next =
                tabs[(i + (event.key === 'ArrowRight' ? 1 : 2)) % 3][0];
              setTab(next);
              document.getElementById(`${id}-${next}-tab`)?.focus();
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className="learning-tab-content"
        role="tabpanel"
        id={`${id}-${tab}-panel`}
        aria-labelledby={`${id}-${tab}-tab`}
        tabIndex={0}
      >
        {tab === 'code' && (
          <Pseudocode
            code={code}
            highlightedLine={step?.line || 0}
            breakpoints={breakpoints}
            onToggleBreakpoint={onToggleBreakpoint}
          />
        )}
        {tab === 'state' && (
          <LearningPanel steps={steps} index={index} algorithm={algorithm} />
        )}
        {tab === 'history' && <LogList messages={messages} />}
      </div>
    </section>
  );
}
