// import NetInfo from '@react-native-community/netinfo';
// import Geolocation from '@react-native-community/geolocation';
// import DeviceInfo from 'react-native-device-info';
// import { Preferences, Common, Location } from '@utils';
// import { PostLocationApi } from '@slices/attendance.slice';
// import type { StoreDispatch } from '@reducers';
// import { log } from 'src/utils/common';

// let dispatchRef: StoreDispatch | null = null;

// export function attachPosterDispatch(d: StoreDispatch) {
//   dispatchRef = d;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // STATIC BACKGROUND URL — bundled directly, no .env needed in bg
// // ─────────────────────────────────────────────────────────────────────────────
// const BG_POST_URL = 'http://tech1.gigatel.work:60201/api/Location/PostLocation';

// // ─────────────────────────────────────────────────────────────────────────────
// // TIMEOUT WRAPPER
// // Android 16 background: NetInfo/DeviceInfo awaits can hang forever.
// // ─────────────────────────────────────────────────────────────────────────────
// function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
//   return Promise.race([
//     promise,
//     new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
//   ]);
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // XHR POST — more reliable than fetch() in Android 16 background
// // ─────────────────────────────────────────────────────────────────────────────
// function xhrPost(url: string, body: Record<string, any>, token: string): Promise<void> {
//   return new Promise((resolve, reject) => {
//     const xhr = new XMLHttpRequest();
//     xhr.open('POST', url, true);
//     xhr.setRequestHeader('Content-Type', 'application/json');
//     xhr.setRequestHeader('Authorization', `Bearer ${token}`);
//     xhr.timeout = 15000;
//     xhr.onload = () => {
//       if (xhr.status >= 200 && xhr.status < 300) {
//         console.log('[Poster] XHR ✅', xhr.status);
//         resolve();
//       } else {
//         reject(new Error(`[Poster] XHR HTTP ${xhr.status}: ${xhr.responseText}`));
//       }
//     };
//     xhr.onerror = () => reject(new Error('[Poster] XHR network error'));
//     xhr.ontimeout = () => reject(new Error('[Poster] XHR timeout'));
//     xhr.send(JSON.stringify(body));
//   });
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // HELPERS
// // ─────────────────────────────────────────────────────────────────────────────
// export function formatServerDateTimeIST(d: Date = new Date()) {
//   const pad = (n: number) => String(n).padStart(2, '0');
//   const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
//   const ist = new Date(utcMs + 330 * 60000);
//   return `${pad(ist.getDate())}-${pad(ist.getMonth() + 1)}-${ist.getFullYear()} ${pad(ist.getHours())}:${pad(ist.getMinutes())}:${pad(ist.getSeconds())}`;
// }

// function resolveAddress(address?: string | string[]): string {
//   if (!address) return '';
//   if (Array.isArray(address)) return address[0] ?? '';
//   return address;
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // CORE SEND
// // ─────────────────────────────────────────────────────────────────────────────
// async function sendLocationToServer({
//   lat,
//   long,
//   address = '',
//   source = 'bg',
//   forceDispatch,
// }: {
//   lat: number;
//   long: number;
//   address?: string | string[];
//   source?: 'fg' | 'bg';
//   forceDispatch?: StoreDispatch;
// }) {
//   console.log(`[Poster:${source}] sendLocationToServer START`, { lat, long });

//   // Network check (timeout 3s)
//   const net = await withTimeout(NetInfo.fetch(), 3000, {
//     isConnected: true,
//     isInternetReachable: true,
//   } as any);

//   const online = (net.isConnected ?? true) && (net.isInternetReachable ?? true);
//   if (!online) {
//     console.log(`[Poster:${source}] offline — skip`);
//     return;
//   }

//   // Battery (timeout 2s, non-critical)
//   const power = await withTimeout(
//     DeviceInfo.getPowerState(),
//     2000,
//     { batteryLevel: 0 } as any,
//   );
//   const batteryNum = Math.round(((power?.batteryLevel ?? 0) as number) * 100);
//   const batteryStatus = `${batteryNum}%`;

//   // Auth
//   const token = String(Preferences.getData(Preferences.KEY.API_AUTH_TOKEN) ?? '');
//   const employeeID = Number(Preferences.getData(Preferences.KEY.EMPLOYEE_ID) ?? 0);
//   const companyId = Number(Preferences.getData(Preferences.KEY.COMPANY_ID) ?? 11) || 11;
//   const OrganizationCode = String(Preferences.getData(Preferences.KEY.ORGANIZATION_CODE) ?? '');

//   if (!token || !employeeID || !companyId) {
//     console.warn(`[Poster:${source}] Missing auth — skip`);
//     return;
//   }

//   const resolvedAddr = resolveAddress(address);
//   console.log(`[Poster:${source}] address: "${resolvedAddr}"`);

//   const body = {
//     token,
//     employeeID,
//     address: resolvedAddr,
//     batteryStatus,
//     delay: '0',
//     dateTime: formatServerDateTimeIST(),
//     distance: 0,
//     isActive: true,
//     latitude: String(lat),
//     longitude: String(long),
//     companyId,
//     OrganizationCode,
//   };

//   console.log(`[Poster:${source}] posting...`, body);

//   // ─────────────────────────────────────────────────────────────────────────
//   // KEY FIX:
//   // Background (source === 'bg') ALWAYS uses XHR directly to BG_POST_URL.
//   // Redux dispatch is unreliable in background — even if dispatchRef exists,
//   // the JS runtime may be suspended and the thunk will silently fail.
//   //
//   // Foreground (source === 'fg') uses Redux dispatch as before.
//   // ─────────────────────────────────────────────────────────────────────────
//   if (source === 'bg') {
//     // ── BACKGROUND: always XHR ──────────────────────────────────────────────
//     console.log(`[Poster:bg] postLocation → XHR → ${BG_POST_URL}`);
//     await xhrPost(BG_POST_URL, body, token);
//     console.log(`[Poster:bg] postLocation XHR ✅ done`);
//   } else {
//     // ── FOREGROUND: Redux dispatch ──────────────────────────────────────────
//     const dispatchToUse = forceDispatch ?? dispatchRef;

//     if (dispatchToUse) {
//       console.log(`[Poster:fg] postLocation → via Redux dispatch`);
//       console.log('running api')
//       const action = PostLocationApi({ body });
//       const result: any = dispatchToUse(action);
//       if (result && typeof result.unwrap === 'function') {
//         await result.unwrap();
//       } else {
//         await result;
//       }
//       console.log(`[Poster:fg] postLocation Redux ✅ done`);
//     } else {
//       // Foreground but no dispatch (edge case) — fallback to XHR
//       console.warn(`[Poster:fg] dispatchRef null — fallback to XHR`);
//       await xhrPost(BG_POST_URL, body, token);
//       console.log(`[Poster:fg] postLocation XHR fallback ✅ done`);
//     }
//   }

//   Preferences.setData(Preferences.KEY.LAST_POST_TS, Date.now());
//   console.log(`[Poster:${source}] ✅ SUCCESS @ ${body.dateTime}`);
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // PUBLIC API
// // ─────────────────────────────────────────────────────────────────────────────

// // ─── Separate throttle trackers ───────────────────────────────────────────────
// // postNowWithCoords (bg watchPosition) — 25s gap
// const BG_MIN_GAP_MS = 25_000;
// let bgLastTs = 0;
// let bgPosting = false;

// // postOnceIfDue (fg interval) — 25s gap
// const FG_MIN_GAP_MS = 25_000;
// let fgPosting = false;

// /**
//  * postNowWithCoords — called from watchPosition (background)
//  *
//  * Uses its OWN timestamp tracker (bgLastTs) instead of
//  * reading LAST_POST_TS from Preferences. This prevents the
//  * "too soon" skip that was happening because the foreground
//  * poster had already set LAST_POST_TS recently.
//  *
//  * source='bg' → ALWAYS goes through XHR (never Redux)
//  */
// export async function postNowWithCoords(
//   lat: number,
//   long: number,
//   source: 'fg' | 'bg' = 'bg',
//   forceDispatch?: StoreDispatch,
//   address?: string | string[],
// ) {
//   const now = Date.now();
//   const gap = now - bgLastTs;

//   console.log(`[Poster:${source}] postNowWithCoords called`, { lat, long, bgPosting, gap });

//   if (bgPosting) {
//     console.log(`[Poster:${source}] already posting — skip`);
//     return;
//   }
//   if (bgLastTs > 0 && gap < BG_MIN_GAP_MS) {
//     console.log(`[Poster:${source}] too soon (${gap}ms < ${BG_MIN_GAP_MS}ms) — skip`);
//     return;
//   }

//   try {
//     bgPosting = true;
//     bgLastTs = now; // set immediately to prevent double-fire
//     await sendLocationToServer({ lat, long, address, source, forceDispatch });
//   } catch (e: any) {
//     console.error(`[Poster:${source}] ❌ FAILED:`, e?.message ?? e);
//     bgLastTs = 0; // reset so next attempt is not blocked on failure
//   } finally {
//     bgPosting = false;
//   }
// }

// /**
//  * postOnceIfDue — called from foreground (app active / resume)
//  */
// export async function postOnceIfDue(
//   source: 'fg' | 'bg' = 'fg',
//   forceDispatch?: StoreDispatch,
// ) {
//   console.log(`[Poster:${source}] postOnceIfDue called`);

//   if (fgPosting) {
//     console.log(`[Poster:${source}] already posting — skip`);
//     return;
//   }

//   const lastTs = Number(Preferences.getData(Preferences.KEY.LAST_POST_TS) ?? 0);
//   if (Date.now() - lastTs < FG_MIN_GAP_MS) {
//     console.log(`[Poster:${source}] too soon — skip`);
//     return;
//   }

//   try {
//     fgPosting = true;

//     const net = await withTimeout(NetInfo.fetch(), 3000, {
//       isConnected: true,
//       isInternetReachable: true,
//     } as any);

//     const online = (net.isConnected ?? true) && (net.isInternetReachable ?? true);
//     if (!online) {
//       console.log(`[Poster:${source}] offline — skip`);
//       return;
//     }

//     // Get current coords
//     let lat: number | null = null;
//     let long: number | null = null;

//     await withTimeout(
//       new Promise<void>(resolve => {
//         Geolocation.getCurrentPosition(
//           pos => {
//             lat = pos?.coords?.latitude ?? null;
//             long = pos?.coords?.longitude ?? null;
//             resolve();
//           },
//           _err => resolve(),
//           { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
//         );
//       }),
//       6000,
//       undefined,
//     );

//     // Fallback to last saved
//     if (!lat || !long) {
//       const last = (Preferences.getData(Preferences.KEY.LAST_GEO_ADDRESS) ?? {}) as any;
//       lat = last?.lat ?? null;
//       long = last?.long ?? null;
//     }

//     if (!lat || !long) {
//       console.log(`[Poster:${source}] no coords — skip`);
//       return;
//     }

//     // Get fresh address
//     let address = 'NA';
//     try {
//       const geo = await withTimeout(
//         Location?.getAddressWithLatLong?.(lat, long),
//         5000,
//         { address: '' } as any,
//       );
//       const resolved = resolveAddress(geo?.address);
//       if (resolved) {
//         address = resolved;
//         const prev = Preferences.getData(Preferences.KEY.LAST_GEO_ADDRESS) as any;
//         if (!prev || prev?.address !== address) {
//           Preferences.setData(Preferences.KEY.LAST_GEO_ADDRESS, { lat, long, address });
//         }
//       }
//     } catch (e) {
//       console.log(`[Poster:${source}] address fetch failed — using NA`);
//     }

//     await sendLocationToServer({ lat, long, address, source, forceDispatch });
//   } catch (e: any) {
//     console.error(`[Poster:${source}] ❌ FAILED:`, e?.message ?? e);
//   } finally {
//     fgPosting = false;
//   }
// }

// export default { attachPosterDispatch, postOnceIfDue, formatServerDateTimeIST };
import NetInfo from '@react-native-community/netinfo';
import Geolocation from '@react-native-community/geolocation';
import DeviceInfo from 'react-native-device-info';
import { Preferences, Common, Location } from '@utils';
import { PostLocationApi } from '@slices/attendance.slice';
import type { StoreDispatch } from '@reducers';
import { log } from 'src/utils/common';


let dispatchRef: StoreDispatch | null = null;

export function attachPosterDispatch(d: StoreDispatch) {
  dispatchRef = d;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATIC BACKGROUND URL — bundled directly, no .env needed in bg
// ─────────────────────────────────────────────────────────────────────────────
const BG_POST_URL = 'http://tech1.gigatel.work:60201/api/Location/PostLocation';

// ─────────────────────────────────────────────────────────────────────────────
// THROTTLE CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const BG_MIN_GAP_MS = 25_000;
const FG_MIN_GAP_MS = 25_000;

// ─────────────────────────────────────────────────────────────────────────────
// PERSISTENT BG TIMESTAMP KEY
// Stored in Preferences so it survives Android 13 bg JS instance restarts.
// Module-level variables reset every time Android kills/restarts the JS engine
// in background — Preferences (AsyncStorage/MMKV) persists across restarts.
// ─────────────────────────────────────────────────────────────────────────────
const PREF_BG_LAST_TS = 'BG_POSTER_LAST_TS';

// In-memory posting guards (reset per JS instance — fine, just prevents
// double-fire within the SAME instance/session)
let bgPosting = false;
let fgPosting = false;

// ─────────────────────────────────────────────────────────────────────────────
// TIMEOUT WRAPPER
// Android 16 background: NetInfo/DeviceInfo awaits can hang forever.
// ─────────────────────────────────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// XHR POST — more reliable than fetch() in Android background (13 & 16)
// ─────────────────────────────────────────────────────────────────────────────
function xhrPost(url: string, body: Record<string, any>, token: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = 15000;
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log('[Poster] XHR ✅', xhr.status);
        resolve();
      } else {
        reject(new Error(`[Poster] XHR HTTP ${xhr.status}: ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => reject(new Error('[Poster] XHR network error'));
    xhr.ontimeout = () => reject(new Error('[Poster] XHR timeout'));
    xhr.send(JSON.stringify(body));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
export function formatServerDateTimeIST(d: Date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
  const ist = new Date(utcMs + 330 * 60000);
  return `${pad(ist.getDate())}-${pad(ist.getMonth() + 1)}-${ist.getFullYear()} ${pad(ist.getHours())}:${pad(ist.getMinutes())}:${pad(ist.getSeconds())}`;
}

function resolveAddress(address?: string | string[]): string {
  if (!address) return '';
  if (Array.isArray(address)) return address[0] ?? '';
  return address;
}

// ─────────────────────────────────────────────────────────────────────────────
// BG TIMESTAMP — Preferences-backed (persists across Android bg JS restarts)
// ─────────────────────────────────────────────────────────────────────────────
function getBgLastTs(): number {
  return Number(Preferences.getData(PREF_BG_LAST_TS) ?? 0);
}

function setBgLastTs(ts: number): void {
  Preferences.setData(PREF_BG_LAST_TS, ts);
}

function clearBgLastTs(): void {
  Preferences.setData(PREF_BG_LAST_TS, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// CORE SEND
// ─────────────────────────────────────────────────────────────────────────────
async function sendLocationToServer({
  lat,
  long,
  address = '',
  source = 'bg',
  forceDispatch,
}: {
  lat: number;
  long: number;
  address?: string | string[];
  source?: 'fg' | 'bg';
  forceDispatch?: StoreDispatch;
}) {
  console.log(`[Poster:${source}] sendLocationToServer START`, { lat, long });

  // Network check (timeout 3s)
  const net = await withTimeout(NetInfo.fetch(), 3000, {
    isConnected: true,
    isInternetReachable: true,
  } as any);

  const online = (net.isConnected ?? true) && (net.isInternetReachable ?? true);
  if (!online) {
    console.log(`[Poster:${source}] offline — skip`);
    return;
  }

  // Battery (timeout 2s, non-critical)
  const power = await withTimeout(
    DeviceInfo.getPowerState(),
    2000,
    { batteryLevel: 0 } as any,
  );
  const batteryNum = Math.round(((power?.batteryLevel ?? 0) as number) * 100);
  const batteryStatus = `${batteryNum}%`;

  // Auth
  const token = String(Preferences.getData(Preferences.KEY.API_AUTH_TOKEN) ?? '');
  const employeeID = Number(Preferences.getData(Preferences.KEY.EMPLOYEE_ID) ?? 0);
  const companyId = Number(Preferences.getData(Preferences.KEY.COMPANY_ID) ?? 11) || 11;
  const OrganizationCode = String(Preferences.getData(Preferences.KEY.ORGANIZATION_CODE) ?? '');

  if (!token || !employeeID || !companyId) {
    console.warn(`[Poster:${source}] Missing auth — skip`);
    return;
  }

  const resolvedAddr = resolveAddress(address);
  console.log(`[Poster:${source}] address: "${resolvedAddr}"`);

  const body = {
    token,
    employeeID,
    address: resolvedAddr,
    batteryStatus,
    delay: '0',
    dateTime: formatServerDateTimeIST(),
    distance: 0,
    isActive: true,
    latitude: String(lat),
    longitude: String(long),
    companyId,
    OrganizationCode,
  };

  console.log(`[Poster:${source}] posting...`, body);

  // ─────────────────────────────────────────────────────────────────────────
  // ROUTING:
  // source='bg' → ALWAYS XHR — Redux thunks unreliable in Android bg (13+16)
  // source='fg' → Redux dispatch (with XHR fallback if dispatchRef is null)
  // ─────────────────────────────────────────────────────────────────────────
  if (source === 'bg') {
    console.log(`[Poster:bg] postLocation → XHR → ${BG_POST_URL}`);
    await xhrPost(BG_POST_URL, body, token);
    console.log(`[Poster:bg] postLocation XHR ✅ done`);
  } else {
    const dispatchToUse = forceDispatch ?? dispatchRef;
    if (dispatchToUse) {
      console.log(`[Poster:fg] postLocation → via Redux dispatch`);
      console.log('running api');
      const action = PostLocationApi({ body });
      const result: any = dispatchToUse(action);
      if (result && typeof result.unwrap === 'function') {
        await result.unwrap();
      } else {
        await result;
      }
      console.log(`[Poster:fg] postLocation Redux ✅ done`);
    } else {
      console.warn(`[Poster:fg] dispatchRef null — fallback to XHR`);
      await xhrPost(BG_POST_URL, body, token);
      console.log(`[Poster:fg] postLocation XHR fallback ✅ done`);
    }
  }

  Preferences.setData(Preferences.KEY.LAST_POST_TS, Date.now());
  console.log(`[Poster:${source}] ✅ SUCCESS @ ${body.dateTime}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * postNowWithCoords — called from watchPosition (background)
 *
 * ✅ FIX — bgLastTs now read/written via Preferences (not module variable).
 *
 * WHY THIS MATTERS:
 * Android 13: Each background task wakes a FRESH JS instance. Module-level
 * variables like `let bgLastTs = 0` are always 0 on every wake, so the
 * 25s throttle was never effective — every wake fired a new POST.
 *
 * Android 16: Same module instance may persist, but Preferences ensures
 * consistent behaviour regardless of OS version.
 *
 * source='bg' → ALWAYS XHR (never Redux) — works on Android 13 and 16.
 */
export async function postNowWithCoords(
  lat: number,
  long: number,
  source: 'fg' | 'bg' = 'bg',
  forceDispatch?: StoreDispatch,
  address?: string | string[],
) {
  const now = Date.now();
  const bgLastTs = getBgLastTs(); // ← from Preferences, not module variable
  const gap = now - bgLastTs;

  console.log(`[Poster:${source}] postNowWithCoords called`, {
    lat,
    long,
    bgPosting,
    gap,
    bgLastTs,
  });

  if (bgPosting) {
    console.log(`[Poster:${source}] already posting — skip`);
    return;
  }
  if (bgLastTs > 0 && gap < BG_MIN_GAP_MS) {
    console.log(`[Poster:${source}] too soon (${gap}ms < ${BG_MIN_GAP_MS}ms) — skip`);
    return;
  }

  try {
    bgPosting = true;
    setBgLastTs(now); // persist immediately — prevents double-fire even across JS instances
    await sendLocationToServer({ lat, long, address, source, forceDispatch });
  } catch (e: any) {
    console.error(`[Poster:${source}] ❌ FAILED:`, e?.message ?? e);
    clearBgLastTs(); // reset on failure so next attempt isn't blocked
  } finally {
    bgPosting = false;
  }
}

/**
 * postOnceIfDue — called from foreground (app active / resume)
 */
export async function postOnceIfDue(
  source: 'fg' | 'bg' = 'fg',
  forceDispatch?: StoreDispatch,
) {
  console.log(`[Poster:${source}] postOnceIfDue called`);

  if (fgPosting) {
    console.log(`[Poster:${source}] already posting — skip`);
    return;
  }

  const lastTs = Number(Preferences.getData(Preferences.KEY.LAST_POST_TS) ?? 0);
  if (Date.now() - lastTs < FG_MIN_GAP_MS) {
    console.log(`[Poster:${source}] too soon — skip`);
    return;
  }

  try {
    fgPosting = true;

    const net = await withTimeout(NetInfo.fetch(), 3000, {
      isConnected: true,
      isInternetReachable: true,
    } as any);

    const online = (net.isConnected ?? true) && (net.isInternetReachable ?? true);
    if (!online) {
      console.log(`[Poster:${source}] offline — skip`);
      return;
    }

    // Get current coords
    let lat: number | null = null;
    let long: number | null = null;

    await withTimeout(
      new Promise<void>(resolve => {
        Geolocation.getCurrentPosition(
          pos => {
            lat = pos?.coords?.latitude ?? null;
            long = pos?.coords?.longitude ?? null;
            resolve();
          },
          _err => resolve(),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
        );
      }),
      6000,
      undefined,
    );

    // Fallback to last saved
    if (!lat || !long) {
      const last = (Preferences.getData(Preferences.KEY.LAST_GEO_ADDRESS) ?? {}) as any;
      lat = last?.lat ?? null;
      long = last?.long ?? null;
    }

    if (!lat || !long) {
      console.log(`[Poster:${source}] no coords — skip`);
      return;
    }

    // Get fresh address
    let address = 'NA';
    try {
      const geo = await withTimeout(
        Location?.getAddressWithLatLong?.(lat, long),
        5000,
        { address: '' } as any,
      );
      const resolved = resolveAddress(geo?.address);
      if (resolved) {
        address = resolved;
        const prev = Preferences.getData(Preferences.KEY.LAST_GEO_ADDRESS) as any;
        if (!prev || prev?.address !== address) {
          Preferences.setData(Preferences.KEY.LAST_GEO_ADDRESS, { lat, long, address });
        }
      }
    } catch (e) {
      console.log(`[Poster:${source}] address fetch failed — using NA`);
    }

    await sendLocationToServer({ lat, long, address, source, forceDispatch });
  } catch (e: any) {
    console.error(`[Poster:${source}] ❌ FAILED:`, e?.message ?? e);
  } finally {
    fgPosting = false;
  }
}

export default { attachPosterDispatch, postOnceIfDue, formatServerDateTimeIST };
