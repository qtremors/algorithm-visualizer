import type { ReactNode } from 'react';
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
      className="tool-button"
    >
      <span className={active ? color : ''} aria-hidden="true">
        {icon}
      </span>
      {label}
    </button>
  );
}
