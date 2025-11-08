// src/services/LocationBatteryService.ts
import { Platform } from 'react-native';
import BackgroundActions from 'react-native-background-actions';
import type { StoreDispatch } from '@reducers';
import { postOnceIfDue } from './LocationPosterCore';
import {
  startBackgroundLocationWatcher,
  stopBackgroundLocationWatcher,
} from './BackgroundLocationWatcher';
import { Preferences } from '@utils';

let dispatchRef: StoreDispatch | null = null;
export function attachDispatch(d: StoreDispatch) {
  dispatchRef = d;
}

const TASK_NAME = 'LocationBatteryBGTask';
const SLEEP_MS = 5_000;

// Android-only icon/channel hints
const ANDROID_ICON_NAME = 'ic_launcher';
const ANDROID_ICON_TYPE = 'mipmap';

// Build options safely per-platform (avoid unsupported fields on iOS)
const baseOptions: any = {
  taskName: TASK_NAME,
  taskTitle: 'Location running',
  taskDesc: 'Posting location & battery periodically',
  color: '#0A84FF',
  parameters: {}, // library expects an object
};

const optionsWithIcon: any =
  Platform.select({
    android: {
      ...baseOptions,
      taskIcon: { name: ANDROID_ICON_NAME, type: ANDROID_ICON_TYPE },
    },
    ios: { ...baseOptions },
    default: baseOptions,
  }) || baseOptions;

const optionsWithoutIcon: any = { ...baseOptions };

// ---- Fallback loop for iOS / OEMs when BackgroundActions fails ----
// Use ReturnType<typeof setInterval> to avoid RN/Node timer mismatch
type IntervalHandle = ReturnType<typeof setInterval>;
let fallbackInterval: IntervalHandle | null = null;

function startFallbackLoop() {
  if (fallbackInterval) return;
  try { startBackgroundLocationWatcher(); } catch {}
  fallbackInterval = setInterval(async () => {
    try {
      await postOnceIfDue('bg', (dispatchRef ?? undefined) as any);
    } catch (e) {
      if (__DEV__) console.warn('[BG Fallback] postOnceIfDue error', e);
    }
  }, SLEEP_MS);
  __DEV__ && console.log('[BG Fallback] interval started @', SLEEP_MS, 'ms');
}

function stopFallbackLoop() {
  if (fallbackInterval) {
    // Cast to any to silence mixed RN/Node typings if present
    clearInterval(fallbackInterval as any);
    fallbackInterval = null;
    __DEV__ && console.log('[BG Fallback] interval stopped');
  }
  try { stopBackgroundLocationWatcher(); } catch {}
}

// ---- Helpers ----
async function safeIsRunning(): Promise<boolean> {
  try {
    const maybeFn: any = (BackgroundActions as any)?.isRunning;
    if (typeof maybeFn === 'function') {
      const r = await maybeFn.call(BackgroundActions);
      return !!r;
    }
    // Some older libs expose a boolean prop instead of a function
    if (typeof maybeFn === 'boolean') return !!maybeFn;
    return false;
  } catch {
    return false;
  }
}

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

async function bgTask() {
  __DEV__ && console.log('[BG Service] task started');
  try { startBackgroundLocationWatcher(); } catch {}

  try {
    while (await safeIsRunning()) {
      try {
        await postOnceIfDue('bg', (dispatchRef ?? undefined) as any);
      } catch (e) {
        if (__DEV__) console.warn('[BG Service] postOnceIfDue error', e);
      }
      __DEV__ && console.log('[BG Service] tick');
      await sleep(SLEEP_MS);
    }
  } catch (e) {
    __DEV__ && console.warn('[BG Service] loop error', e);
  } finally {
    try { stopBackgroundLocationWatcher(); } catch {}
    __DEV__ && console.log('[BG Service] task finished');
  }
}
// Singleton guard to avoid racing multiple starts
let starting = false;

export async function startLocationBatteryService(
  userId: string,
  { companyId }: { companyId: number },
) {
  try {
    // Validate inputs early to avoid crashes inside native layer
    const uidNum = Number(userId);
    const cidNum = Number(companyId);
    const hasValidUser = Number.isFinite(uidNum) && uidNum > 0;
    const hasValidCompany = Number.isFinite(cidNum) && cidNum > 0;

    if (hasValidUser) {
      try { Preferences.setData(Preferences.KEY.EMPLOYEE_ID, uidNum); } catch {}
    }
    if (hasValidCompany) {
      try { Preferences.setData(Preferences.KEY.COMPANY_ID, cidNum); } catch {}
    }

    // If userId is invalid, don't start anything. Foreground poster will still run elsewhere.
    if (!hasValidUser) {
      __DEV__ && console.log('[BG Service] skip start: invalid userId', { userId });
      return;
    }

    // If already starting, skip
    if (starting) {
      __DEV__ && console.log('[BG Service] start skipped (already starting)');
      return;
    }

    // iOS: prefer fallback loop (BackgroundActions limitations on iOS)
    if (Platform.OS === 'ios') {
      if (!(await safeIsRunning()) && !fallbackInterval) {
        __DEV__ && console.log('[BG Service] iOS -> using fallback loop');
        startFallbackLoop();
      } else {
        __DEV__ && console.log('[BG Service] iOS -> already running');
      }
      return;
    }

    // ANDROID path
    const alreadyRunning = await safeIsRunning();
    if (alreadyRunning) {
      __DEV__ && console.log('[BG Service] already running');
      try { startBackgroundLocationWatcher(); } catch {}
      return;
    }

    starting = true;
    __DEV__ && console.log('[BG Service] starting… (Android)');

    // Try with icon first
    try {
      if (typeof (BackgroundActions as any)?.start === 'function') {
        await BackgroundActions.start(bgTask, optionsWithIcon);
        __DEV__ && console.log('[BG Service] started (with icon)');
      } else {
        // Library not available or API mismatch -> fallback
        __DEV__ && console.warn('[BG Service] BackgroundActions.start not a function; using fallback');
        startFallbackLoop();
      }
    } catch (e: any) {
      const msg = String(e?.message || e || '');
      if (/icon/i.test(msg)) {
        __DEV__ && console.warn('[BG Service] retry w/o icon due to:', msg);
        try {
          await BackgroundActions.start(bgTask, optionsWithoutIcon);
          __DEV__ && console.log('[BG Service] started (no icon fallback)');
        } catch (e2: any) {
          __DEV__ && console.warn('[BG Service] second start failed; using fallback', e2?.message || e2);
          startFallbackLoop();
        }
      } else {
        // If anything else fails, use the fallback interval
        __DEV__ && console.warn('[BG Service] start failed; using fallback loop', msg);
        startFallbackLoop();
      }
    } finally {
      starting = false;
    }
  } catch (err) {
    starting = false;
    __DEV__ && console.warn('[BG Service] start failed (outer)', err);
    // Ensure something is running even on unexpected failures
    startFallbackLoop();
  }
}

export async function stopLocationBatteryService() {
  try {
    const running = await safeIsRunning();
    if (running) {
      try {
        if (typeof (BackgroundActions as any)?.stop === 'function') {
          await BackgroundActions.stop();
        }
      } catch (e) {
        if (__DEV__) console.warn('[BG Service] stop() error', e);
      }
    }
  } catch {}
  stopFallbackLoop();
  __DEV__ && console.log('[BG Service] stopped');
}
