// @utils/location.ts
import Geolocation, { GeolocationResponse } from '@react-native-community/geolocation';
import { DataType } from '@types';
import { Linking, Platform } from 'react-native';
import { isLocationEnabled, promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';
import {
  check,
  checkMultiple,
  openSettings,
  PERMISSIONS,
  request,
  requestMultiple,
} from 'react-native-permissions';
import { alert, error, log } from './common';
import { getData, setData } from './preferences';
import { postNowWithCoords } from '../../src/services/LocationPosterCore';
import { OLA_MAP_API } from '@env';

let watchId: number | null = null;
let lastFix: { lat: number; long: number; ts: number } | null = null;
let lastKnownAddress: string = '';

const OLA_REVERSE_GEOCODE_URL = 'https://api.olamaps.io/places/v1/reverse-geocode';
const OLA_API_KEY = OLA_MAP_API;

// ─────────────────────────────────────────────────────────────────────────────
export const initializeConfig = async () => {
  try {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'always',
      enableBackgroundLocationUpdates: true,
      locationProvider: 'auto',
    } as any);
  } catch (e) {
    __DEV__ && console.warn('initializeConfig error', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// XHR-based reverse geocode — more reliable than fetch() in Android 16 bg
// ─────────────────────────────────────────────────────────────────────────────
const olaReverseGeocode = (lat: number, long: number): Promise<string[]> => {
  return new Promise(resolve => {
    console.log('📍 olaReverseGeocode called:', { lat, long });

    if (!lat || !long || isNaN(lat) || isNaN(long)) {
      console.warn('❌ Invalid coordinates');
      return resolve([]);
    }
    if (!OLA_API_KEY) {
      console.error('❌ OLA_API_KEY missing');
      return resolve([]);
    }

    const url = `${OLA_REVERSE_GEOCODE_URL}?latlng=${lat},${long}&api_key=${OLA_API_KEY}`;
    console.log('🌐 Ola URL:', url);

    // Use XHR instead of fetch — survives Android 16 background suspension
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.timeout = 10000;

    xhr.onload = () => {
      try {
        if (xhr.status < 200 || xhr.status >= 300) {
          console.error('❌ Ola API error:', xhr.status, xhr.responseText);
          return resolve([]);
        }
        const json = JSON.parse(xhr.responseText);
        const results = json?.results || json?.geocodingResults || [];
        const addressList: string[] = results
          .map((item: any) => item?.formatted_address || item?.formattedAddress || '')
          .filter((a: string) => !!a)
          .slice(0, 5);
        console.log('✅ Ola address list:', addressList);
        resolve(addressList);
      } catch (e) {
        console.error('❌ Ola parse error:', e);
        resolve([]);
      }
    };

    xhr.onerror = () => {
      console.error('❌ Ola XHR network error');
      resolve([]);
    };

    xhr.ontimeout = () => {
      console.error('❌ Ola XHR timeout');
      resolve([]);
    };

    xhr.send();
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Public address helpers
// ─────────────────────────────────────────────────────────────────────────────
export const getAddressFromLatLong = async (): Promise<DataType.GeoAddress> => {
  try {
    const info = (await getGeoLocation()) as DataType.GeoLocation;
    if (!info) return { address: 'Address Not Found', addressList: [], lat: 0, long: 0 };
    const { latitude: lat, longitude: long } = info?.coords;
    const addressList = await olaReverseGeocode(lat, long);
    return {
      address: addressList?.[0] || 'Address Not Found',
      addressList: addressList || [],
      lat,
      long,
    };
  } catch (err: any) {
    return { address: 'Address Not Found', addressList: [], lat: 0, long: 0 };
  }
};

export const getAddressWithLatLong = async (
  lat: number,
  long: number,
): Promise<DataType.GeoAddress> => {
  try {
    if (typeof lat !== 'number' || typeof long !== 'number') {
      return { address: '', lat: lat ?? 0, long: long ?? 0 };
    }
    const addressList = await olaReverseGeocode(lat, long);
    const addressComponent: DataType.GeoAddress = {
      address: addressList[0] || '',
      addressList,
      lat,
      long,
    };
    console.info('Geo Address', { addressComponent });
    return addressComponent;
  } catch (err: any) {
    error('Error fetching address: ', err?.message ?? '');
    return { address: '', lat: lat ?? 0, long: long ?? 0 };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// startLocationWatch — Android 13 + Android 16 compatible
//
// ANDROID 16 KEY POINTS:
// 1. olaReverseGeocode now uses XHR (not fetch) — survives bg thread suspension
// 2. postNowWithCoords uses XHR internally when dispatchRef is null
// 3. watchPosition callback errors are fully isolated — one failure never
//    kills the watcher
// 4. distanceFilter=10 prevents Android 16 location rate-limiter from
//    throttling our updates
// ─────────────────────────────────────────────────────────────────────────────
export const startLocationWatch = () => {
  if (watchId !== null) {
    __DEV__ && console.log('[LocationWatch] already running — skip');
    return; // ✅ already running — clearWatch mat karo
  }

  console.log('[LocationWatch] starting…');

  watchId = Geolocation.watchPosition(
    async pos => {
      const lat = pos?.coords?.latitude;
      const long = pos?.coords?.longitude;

      console.log('[LocationWatch] position received:', { lat, long });

      if (typeof lat !== 'number' || typeof long !== 'number') return;

      // Update in-memory fix
      lastFix = { lat, long, ts: Date.now() };

      // Mirror to Preferences (best-effort)
      try {
        const prev = (getData('LAST_GEO_ADDRESS') ?? {}) as any;
        setData('LAST_GEO_ADDRESS', { ...prev, lat, long });
      } catch (e) {
        __DEV__ && console.warn('[LocationWatch] setData failed', e);
      }

      // Reverse geocode — XHR based, survives Android 16 background
      let addressList: string[] = [];
      try {
        if (OLA_API_KEY) {
          addressList = await olaReverseGeocode(lat, long);
        }
      } catch (e) {
        __DEV__ && console.warn('[LocationWatch] geocode failed', e);
      }

      const address = addressList[0] ?? '';

      if (address && address !== lastKnownAddress) {
        console.log('📍 Address changed:', address);
        lastKnownAddress = address;
        try {
          setData('LAST_GEO_ADDRESS', { lat, long, address });
        } catch (_) {}
      }

      // Post — throttled internally by MIN_GAP_MS
      // Passes full addressList so PosterCore picks [0] cleanly
      console.log('[LocationWatch] calling postNowWithCoords…');
      try {
        await postNowWithCoords(lat, long, 'bg', undefined, addressList);
      } catch (e) {
        __DEV__ && console.warn('[LocationWatch] postNowWithCoords error', e);
      }
    },
    err => {
      // Must never throw — keeps the watcher alive
      console.warn('[LocationWatch] watchPosition error:', err?.message);
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 10,
      interval: 10000,
      fastestInterval: 5000,
      timeout: 20000,
      maximumAge: 0,
      useSignificantChanges: false,
    },
  );

  console.log('[LocationWatch] started, watchId:', watchId);
};

export const stopLocationWatch = () => {
  if (watchId !== null) {
    try {
      Geolocation.clearWatch(watchId);
      console.log('[LocationWatch] stopped');
    } catch (e) {
      __DEV__ && console.warn('[LocationWatch] clearWatch failed', e);
    }
    watchId = null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
export const getGeoLocation = async (): Promise<GeolocationResponse> => {
  return new Promise((resolve, reject) => {
    try {
      Geolocation.getCurrentPosition(
        info => {
          try {
            const add = getData('LAST_GEO_ADDRESS') as DataType.GeoAddress;
            setData('LAST_GEO_ADDRESS', {
              ...add,
              lat: info.coords.latitude,
              long: info.coords.longitude,
            });
          } catch (e) {
            __DEV__ && console.warn('setData LAST_GEO_ADDRESS fail', e);
          }
          resolve(info);
        },
        err => {
          error('Error fetching address: ', err?.message ?? '');
          const loc = getData('LAST_GEO_ADDRESS');
          reject({
            coords: { latitude: loc?.lat ?? 0, longitude: loc?.long ?? 0 },
          });
        },
        { timeout: 10000, maximumAge: 0, enableHighAccuracy: false },
      );
    } catch (e) {
      reject(e);
    }
  });
};

export const watchGeoLocation = (): { id: number | null; stop: () => void } => {
  let localId: number | null = null;
  try {
    localId = Geolocation.watchPosition(
      res => {
        const lat = res?.coords?.latitude;
        const long = res?.coords?.longitude;
        if (typeof lat === 'number' && typeof long === 'number') {
          lastFix = { lat, long, ts: Date.now() };
          try {
            const prev = (getData('LAST_GEO_ADDRESS') ?? {}) as any;
            setData('LAST_GEO_ADDRESS', { ...prev, lat, long });
          } catch {}
        }
      },
      err => { if (__DEV__) console.warn('watchGeoLocation error', err?.message); },
      {
        interval: 10000,
        timeout: 15000,
        maximumAge: 50000,
        enableHighAccuracy: true,
        distanceFilter: 10,
        useSignificantChanges: true,
      },
    );
  } catch (e) {
    __DEV__ && console.warn('watchGeoLocation start failed', e);
  }
  return {
    id: localId,
    stop: () => {
      if (localId !== null) {
        try { Geolocation.clearWatch(localId); } catch (e) {}
      }
    },
  };
};

export const getLastFix = () => lastFix;

// ─────────────────────────────────────────────────────────────────────────────
export const calculateDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number,
  unit: 'km' | 'mi' | 'm' = 'm',
): number => {
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    return Number.POSITIVE_INFINITY;
  }
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = unit === 'km' ? 6371 : unit === 'mi' ? 3958.8 : 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return unit === 'm' ? Math.round(distance) : Number(distance.toFixed(2));
};

export const findNearestChamber = (
  currentLat: number,
  currentLon: number,
  chambers: Array<{
    id: number;
    chamber_id: string;
    chamber_name: string;
    chamber_longitude: string;
    chamber_latitude: string;
  }>,
  minDistance: number,
): { chamber: any; distance: number } | null => {
  let nearestChamber = null;
  let minDistanceFound = Infinity;
  for (const chamber of chambers) {
    const chamberLat = parseFloat(chamber.chamber_latitude);
    const chamberLon = parseFloat(chamber.chamber_longitude);
    if (isNaN(chamberLat) || isNaN(chamberLon)) continue;
    const distance = calculateDistance(currentLat, currentLon, chamberLat, chamberLon);
    if (distance < minDistanceFound) {
      minDistanceFound = distance;
      nearestChamber = { chamber, distance };
    }
    if (distance <= minDistance) return nearestChamber;
  }
  return minDistanceFound <= minDistance ? nearestChamber : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Permissions
// ─────────────────────────────────────────────────────────────────────────────
export const checkGps = async () => {
  try {
    const checkEnabled = await isLocationEnabled();
    if (!checkEnabled) {
      try {
        const enableResult = await promptForEnableLocationIfNeeded();
        log('GPS Result::', enableResult);
        return enableResult === 'already-enabled' || enableResult === 'enabled';
      } catch (err: unknown) {
        if (err instanceof Error) { error('Error in GPS::', err); return false; }
      }
    }
    return true;
  } catch (e) {
    __DEV__ && console.warn('checkGps error', e);
    return false;
  }
};

export const checkPermission = async () => {
  try {
    let permission;
    const gps = await checkGps();
    permission = gps ? permission : 'denied';
    if (Platform.OS === 'android') {
      const perm = await checkMultiple([
        PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
        PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
      ]);
      if (
        perm['android.permission.ACCESS_BACKGROUND_LOCATION'] === 'granted' &&
        perm['android.permission.ACCESS_FINE_LOCATION'] === 'granted'
      ) {
        permission = 'granted';
      } else {
        permission = await requestPermission();
      }
    } else {
      permission = await check(PERMISSIONS.IOS.LOCATION_ALWAYS);
      if (permission === 'denied') permission = await requestPermission();
    }
    return permission;
  } catch (err) {
    error('Location Error');
    return 'denied';
  }
};

export const requestPermission = async () => {
  let permission;
  if (Platform.OS === 'android') {
    const perm = await requestMultiple([
      PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION,
      PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
    ]);
    if (perm['android.permission.ACCESS_BACKGROUND_LOCATION'] !== 'granted') {
      alert({
        title: 'Background Location',
        msg: 'Please enable background location\nPermissions > Location > "Allow all the time"',
        onPress: () => openLocationSetting(),
      });
    } else if (perm['android.permission.ACCESS_FINE_LOCATION'] !== 'granted') {
      alert({
        title: 'Location',
        msg: 'Please enable location permission to continue',
        onPress: () => openLocationSetting(),
      });
    }
    permission = perm;
  } else if (Platform.OS === 'ios') {
    permission = await request(PERMISSIONS.IOS.LOCATION_ALWAYS);
  }
  return permission;
};

const openLocationSetting = () => {
  if (Platform.OS === 'android') {
    try {
      Linking.sendIntent('android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS')
        .then(() => log('Location settings opened'))
        .catch(err => { openSettings(); error('Settings error', err); });
    } catch (e) {
      openSettings();
    }
  } else {
    openSettings();
  }
};
