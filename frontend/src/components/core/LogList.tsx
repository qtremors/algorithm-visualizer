import { useEffect, useRef, useState } from 'react';
/** Fixed-height rows keep long execution histories scrollable without a huge DOM. */
export default function LogList({ messages }: { messages: string[] }) {
  const container = useRef<HTMLDivElement>(null);
  const follow = useRef(true);
  const [scroll, setScroll] = useState(0);
  const [height, setHeight] = useState(960);
  const row = 32;
  const visibleScroll = Math.min(
    scroll,
    Math.max(0, messages.length * row - height),
  );
  const start = Math.max(0, Math.floor(visibleScroll / row) - 3);
  const end = Math.min(
    messages.length,
    Math.ceil((visibleScroll + height) / row) + 3,
  );
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const resize = () => setHeight(element.clientHeight);
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (container.current && follow.current)
      container.current.scrollTop = container.current.scrollHeight;
  }, [messages.length, height]);
  return (
    <div
      ref={container}
      role="list"
      aria-label="Execution log"
      tabIndex={0}
      className="h-full min-h-48 overflow-auto font-mono text-sm"
      onScroll={(event) => {
        const el = event.currentTarget;
        follow.current = el.scrollHeight - el.clientHeight - el.scrollTop < 64;
        setScroll(el.scrollTop);
      }}
    >
      <div style={{ height: messages.length * row, position: 'relative' }}>
        {messages.slice(start, end).map((message, offset) => (
          <div
            key={start + offset}
            role="listitem"
            aria-posinset={start + offset + 1}
            aria-setsize={messages.length}
            title={message}
            style={{
              position: 'absolute',
              top: (start + offset) * row,
              height: row,
              width: '100%',
            }}
            className="truncate px-2 py-1 text-gray-300"
          >
            <span className="text-gray-500 mr-3">{start + offset + 1}.</span>
            {message}
          </div>
        ))}
      </div>
    </div>
  );
}
