// src/services/ForegroundLocationPoster.ts
import { postOnceIfDue } from './LocationPosterCore';
import { startLocationWatch,stopLocationWatch } from '../../src/utils/location';

let intervalId: ReturnType<typeof setInterval> | null = null;
let started = false;
const FG_INTERVAL_MS = 5_000; // 30s

export function startForegroundPoster() {
  // if (intervalId) {
  //   __DEV__ && console.log('[FG Poster] already running');
  //   return;
  // }
  __DEV__ && console.log('[FG Poster] starting…');
  // void postOnceIfDue('fg');
  startLocationWatch();
  // intervalId = setInterval(() => void postOnceIfDue('fg'), FG_INTERVAL_MS);
  __DEV__ && console.log('[FG Poster] started @60s');
}

export function stopForegroundPoster() {
  // if (intervalId) {
  //   clearInterval(intervalId);
  //   intervalId = null;
  //   __DEV__ && console.log('[FG Poster] stopped');
    stopLocationWatch();
      __DEV__ && console.log('[FG Poster] started @60s2');

  // }
}
