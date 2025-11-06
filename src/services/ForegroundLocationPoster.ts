// src/services/ForegroundLocationPoster.ts
import { postOnceIfDue } from './LocationPosterCore';

let intervalId: ReturnType<typeof setInterval> | null = null;
const FG_INTERVAL_MS = 10_000; // 30s

export function startForegroundPoster() {
  if (intervalId) {
    __DEV__ && console.log('[FG Poster] already running');
    return;
  }
  __DEV__ && console.log('[FG Poster] starting…');
  void postOnceIfDue('fg');
  intervalId = setInterval(() => void postOnceIfDue('fg'), FG_INTERVAL_MS);
  __DEV__ && console.log('[FG Poster] started @60s');
}

export function stopForegroundPoster() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    __DEV__ && console.log('[FG Poster] stopped');
  }
}
