import type { AlgorithmsData } from '../types';
import { parseAlgorithms } from './protocol';
const KEY = 'algoviz.catalog.v1';
const MAX_AGE = 24 * 60 * 60 * 1000;
const MAX_BYTES = 256 * 1024;
export function readCatalog(): AlgorithmsData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw || raw.length > MAX_BYTES) return null;
    const value = JSON.parse(raw);
    if (
      typeof value.saved !== 'number' ||
      Date.now() - value.saved > MAX_AGE ||
      value.saved > Date.now()
    )
      return null;
    return parseAlgorithms(value.algorithms);
  } catch {
    return null;
  }
}
export function saveCatalog(algorithms: AlgorithmsData): void {
  try {
    const text = JSON.stringify({ saved: Date.now(), algorithms });
    if (text.length <= MAX_BYTES) localStorage.setItem(KEY, text);
  } catch {
    /* Browsing still works without local storage. */
  }
}
