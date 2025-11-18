import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
export default function ToolButton({
  active,
  onClick,
  icon,
  label,
  color,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  color: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
        active ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800',
      )}
    >
      <span className={active ? color : ''} aria-hidden="true">
        {icon}
      </span>
      {label}
    </button>
  );
}
