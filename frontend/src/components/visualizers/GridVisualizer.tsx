import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import type { AlgorithmStep } from '../../types';
import type { GridInputData, GridTool } from '../../types/input';
import { cn } from '../../lib/utils';

type Props = {
  step: AlgorithmStep | null;
  initialData: GridInputData;
  mode: GridTool;
  onUpdate: (data: GridInputData) => void;
  isInteracting: boolean;
  zoom: number;
  isFitToScreen: boolean;
};
export default function GridVisualizer({
  step,
  initialData,
  mode,
  onUpdate,
  isInteracting,
  zoom,
  isFitToScreen,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    data: GridInputData;
    wall: number;
    touched: Set<string>;
  } | null>(null);
  const [cellSize, setCellSize] = useState(24);
  const [focus, setFocus] = useState(0);
  const snapshot =
    step && !Array.isArray(step.snapshot) && step.snapshot.type === 'grid'
      ? step.snapshot
      : null;
  const visited = useMemo(
    () => new Set(snapshot?.visited.map(([r, c]) => `${r}-${c}`)),
    [snapshot],
  );
  const path = useMemo(
    () => new Set(snapshot?.path.map(([r, c]) => `${r}-${c}`)),
    [snapshot],
  );
  const { grid, start, end } = initialData;
  const cols = grid[0]?.length || 0;
  useEffect(() => {
    if (!isFitToScreen || !container.current || !cols || !grid.length) return;
    const element = container.current;
    const resize = () => {
      const { width, height } = element.getBoundingClientRect();
      setCellSize(
        Math.max(
          2,
          Math.min((width - 40) / cols - 1, (height - 40) / grid.length - 1),
        ),
      );
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => observer.disconnect();
  }, [isFitToScreen, cols, grid.length]);
  useEffect(() => {
    const endGesture = () => {
      gesture.current = null;
    };
    window.addEventListener('pointerup', endGesture);
    window.addEventListener('pointercancel', endGesture);
    window.addEventListener('blur', endGesture);
    return () => {
      window.removeEventListener('pointerup', endGesture);
      window.removeEventListener('pointercancel', endGesture);
      window.removeEventListener('blur', endGesture);
    };
  }, []);
  const paint = (r: number, c: number, dragging = false) => {
    if (!isInteracting || !cols || !grid[r]) return;
    const id = `${r}-${c}`;
    if (dragging && (!gesture.current || gesture.current.touched.has(id)))
      return;
    const data = structuredClone(
      dragging && gesture.current ? gesture.current.data : initialData,
    );
    if (mode === 'start') {
      data.start = { row: r, col: c };
      data.grid[r][c] = 0;
    } else if (mode === 'end') {
      data.end = { row: r, col: c };
      data.grid[r][c] = 0;
    } else if (
      (r !== start.row || c !== start.col) &&
      (r !== end.row || c !== end.col)
    )
      data.grid[r][c] =
        dragging && gesture.current
          ? gesture.current.wall
          : Number(data.grid[r][c] !== 1);
    if (!dragging)
      gesture.current = { data, wall: data.grid[r][c], touched: new Set([id]) };
    else if (gesture.current) {
      gesture.current.data = data;
      gesture.current.touched.add(id);
    }
    onUpdate(data);
  };
  const key = (
    event: KeyboardEvent<HTMLButtonElement>,
    r: number,
    c: number,
  ) => {
    let next = r * cols + c;
    if (event.key === 'ArrowRight')
      next = Math.min(grid.length * cols - 1, next + 1);
    else if (event.key === 'ArrowLeft') next = Math.max(0, next - 1);
    else if (event.key === 'ArrowDown')
      next = Math.min(grid.length * cols - 1, next + cols);
    else if (event.key === 'ArrowUp') next = Math.max(0, next - cols);
    else return;
    event.preventDefault();
    event.stopPropagation();
    setFocus(next);
    container.current
      ?.querySelector<HTMLButtonElement>(`[data-cell-index="${next}"]`)
      ?.focus();
  };
  if (!grid.length || !cols)
    return <p role="status">Initialize a valid grid to start.</p>;
  const size = isFitToScreen ? cellSize : 24 * zoom;
  return (
    <div
      ref={container}
      className={cn(
        'flex w-full h-full p-4 bg-gray-900/50 rounded-lg',
        isFitToScreen
          ? 'items-center justify-center overflow-hidden'
          : 'overflow-auto',
      )}
    >
      <div
        role="group"
        aria-label={`Grid, ${grid.length} rows and ${cols} columns. Arrow keys move; Enter or Space applies the ${mode} tool.`}
        className="grid gap-px m-auto"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${size}px)`,
          minWidth: 'max-content',
        }}
      >
        {grid.flatMap((row, r) =>
          row.map((value, c) => {
            const id = `${r}-${c}`;
            const isStart = r === start.row && c === start.col;
            const isEnd = r === end.row && c === end.col;
            const state = isStart
              ? 'start'
              : isEnd
                ? 'end'
                : value === 1
                  ? 'wall'
                  : path.has(id)
                    ? 'path'
                    : visited.has(id)
                      ? 'visited'
                      : value === 5
                        ? 'weight 5'
                        : 'open';
            return (
              <button
                key={id}
                type="button"
                data-cell-index={r * cols + c}
                aria-label={`Row ${r}, column ${c}: ${state}`}
                aria-disabled={!isInteracting}
                tabIndex={
                  r * cols + c === Math.min(focus, grid.length * cols - 1)
                    ? 0
                    : -1
                }
                onFocus={() => setFocus(r * cols + c)}
                onKeyDown={(event) => key(event, r, c)}
                onClick={(event) => {
                  if (event.detail === 0) paint(r, c);
                }}
                onPointerDown={(event) => {
                  if (event.button === 0) paint(r, c);
                }}
                onPointerEnter={(event) => {
                  if (event.buttons === 1 && gesture.current) paint(r, c, true);
                }}
                className={cn(
                  'rounded-sm border border-white/10 text-[9px] text-black touch-none',
                  isStart
                    ? 'bg-green-500'
                    : isEnd
                      ? 'bg-red-500'
                      : value === 1
                        ? 'bg-gray-500'
                        : path.has(id)
                          ? 'bg-yellow-400'
                          : visited.has(id)
                            ? 'bg-blue-500'
                            : value === 5
                              ? 'bg-purple-400'
                              : 'bg-gray-800',
                )}
                style={{ width: size, height: size }}
              >
                {isStart ? 'S' : isEnd ? 'E' : value === 5 ? '5' : ''}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
