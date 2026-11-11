import {
  Check,
  Circle,
  CircleAlert,
  LoaderCircle,
  Pause,
  Play,
} from 'lucide-react';
import {
  phaseDescriptions,
  phaseLabels,
  runPhase,
  type RunProgress,
} from '../../lib/runState';

export default function RunBadge(props: RunProgress) {
  const phase = runPhase(props);
  const Icon = {
    idle: Circle,
    receiving: LoaderCircle,
    playing: Play,
    paused: Pause,
    complete: Check,
    failed: CircleAlert,
  }[phase];
  return (
    <span
      className="run-badge"
      data-phase={phase}
      title={phaseDescriptions[phase]}
      aria-label={`Run state: ${phaseLabels[phase]}`}
    >
      <Icon size={13} aria-hidden="true" />
      {phaseLabels[phase]}
    </span>
  );
}
