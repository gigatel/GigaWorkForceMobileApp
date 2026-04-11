// src/services/ForegroundLocationPoster.ts
import {startLocationWatch, stopLocationWatch} from '../../src/utils/location';

let started = false;

export function startForegroundPoster() {
  if (started) {
    __DEV__ && console.log('[FG Poster] already running — skip');
    return;
  }
  started = true;
  __DEV__ && console.log('[FG Poster] starting…');
  startLocationWatch();
  __DEV__ && console.log('[FG Poster] started ✅');
}

// ⚠️ ONLY call on logout/app destroy — NEVER on background
export function stopForegroundPoster() {
  if (!started) return; // ✅ already stopped — do nothing
  stopLocationWatch();
  started = false;
  __DEV__ && console.log('[FG Poster] stopped ✅');
}

// ✅ Safe — only restarts if actually stopped
export function restartForegroundPoster() {
  if (started) {
    __DEV__ && console.log('[FG Poster] restart skipped — already running');
    return;
  }
  __DEV__ && console.log('[FG Poster] restarting…');
  startForegroundPoster();
}