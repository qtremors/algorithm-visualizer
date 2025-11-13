/** One host/protocol policy for metadata and visualization connections. */
export function apiUrl(path: string, websocket = false): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  const fallback = import.meta.env.PROD
    ? window.location.origin
    : 'http://127.0.0.1:8000';
  const base = configured
    ? /^https?:\/\//.test(configured)
      ? configured
      : `${window.location.protocol}//${configured}`
    : fallback;
  const url = new URL(`${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`);
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error('The backend URL must use HTTP or HTTPS.');
  if (websocket) url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
