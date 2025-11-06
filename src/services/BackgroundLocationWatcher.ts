// src/services/BackgroundLocationWatcher.ts
import { Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { Preferences } from '@utils';

let bgWatchId: number | null = null;


export function startBackgroundLocationWatcher() {
  if (bgWatchId != null) {
    __DEV__ && console.log('[BG Watcher] already running');
    return;
  }

  try {
    // @ts-ignore
    Geolocation.setRNConfiguration?.({
      skipPermissionRequests: false,
      authorizationLevel: 'always',
    });
  } catch { }
  const iosOpts = {
    enableHighAccuracy: true,
    distanceFilter: 0,
    useSignificantChanges: false,
    timeout: 15000,
    maximumAge: 0,
  } as const;

  const androidOpts = {
    enableHighAccuracy: true,
    distanceFilter: 0,
    interval: 5000,
    fastestInterval: 3000,
    forceRequestLocation: false,
    showLocationDialog: false,
    timeout: 15000,
    maximumAge: 0,
  } as const;

  const options = Platform.select<any>({
    ios: iosOpts,
    android: androidOpts,
    default: iosOpts,
  });

  bgWatchId = Geolocation.watchPosition(onPosition, onError, options);
  __DEV__ && console.log('[BG Watcher] started', options);
}

export function stopBackgroundLocationWatcher() {
  if (bgWatchId != null) {
    Geolocation.clearWatch(bgWatchId);
    bgWatchId = null;
    try {
      // @ts-ignore
      Geolocation.stopObserving?.();
    } catch { }
    __DEV__ && console.log('[BG Watcher] stopped');
  }
}

function onPosition(pos: any): void {
  try {
    const latitude = Number(pos?.coords?.latitude);
    const longitude = Number(pos?.coords?.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      __DEV__ && console.log('[BG Watcher] invalid coords; skip');
      return;
    }

    // quick cache for Poster
    Preferences.setData(Preferences.KEY.LAST_GEO_ADDRESS, {
      address: '',
      lat: latitude,
      long: longitude,
    });

    // If you perform reverse geocoding elsewhere, you can keep it here as fire-and-forget.
    // (async () => {
    //   try {
    //     const addr = await Location.getAddressWithLatLong(latitude, longitude);
    //     if (addr && typeof addr === 'object') {
    //       Preferences.setData(Preferences.KEY.LAST_GEO_ADDRESS, addr);
    //     }
    //   } catch (e) {
    //     __DEV__ && console.log('[BG Watcher] reverse geocode failed (non-fatal)', e);
    //   }
    // })();
  } catch (e) {
    __DEV__ && console.warn('[BG Watcher] onPosition error', e);
  }
}

function onError(err: any) {
  if (__DEV__) {
    console.warn?.('[BG Watcher] error', err);
  }
}
