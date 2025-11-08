import NetInfo from '@react-native-community/netinfo';
import Geolocation from '@react-native-community/geolocation';
import DeviceInfo from 'react-native-device-info';
import { Preferences, Common, Location } from '@utils';
import { PostLocationApi } from '@slices/attendance.slice';
import type { StoreDispatch } from '@reducers';

let dispatchRef: StoreDispatch | null = null;

export function attachPosterDispatch(d: StoreDispatch) {
  dispatchRef = d;
}

async function sendLocationToServer({
  lat, long, address = '',
  source = 'bg' as 'fg'|'bg',
  forceDispatch,
}: {
  lat: number; long: number; address?: string;
  source?: 'fg' | 'bg'; forceDispatch?: StoreDispatch;
}) {
  const net = await NetInfo.fetch();
  const online = (net.isConnected ?? false) && (net.isInternetReachable ?? true);
  if (!online) return;

  const power = await DeviceInfo.getPowerState().catch(() => null as any);
  const batteryNum = Math.round(((power?.batteryLevel ?? 0) as number) * 100);
  const batteryStatus = `${batteryNum}%`;

  const token: string = String(Preferences.getData(Preferences.KEY.API_AUTH_TOKEN) ?? '');
  const employeeID = Number(Preferences.getData(Preferences.KEY.EMPLOYEE_ID) ?? 0);
  const companyId = Number(Preferences.getData(Preferences.KEY.COMPANY_ID) ?? 11) || 11;
  const OrganizationCode = String(Preferences.getData(Preferences.KEY.ORGANIZATION_CODE) ?? '');

  if (!token || !employeeID || !companyId) return;

  const body = {
    token,
    employeeID,
    address: address ?? '',
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

  const dispatchToUse = forceDispatch ?? dispatchRef;
  if (!dispatchToUse) return;

  const action = PostLocationApi({ body });
  const result: any = dispatchToUse(action);
  if (result && typeof result.unwrap === 'function') {
    await result.unwrap();
  } else {
    await result;
  }
  Preferences.setData(Preferences.KEY.LAST_POST_TS, Date.now());
  __DEV__ && console.log(`[Poster:${source}] ✅ posted @ ${body.dateTime}`, { lat, long, address });
}

export async function postNowWithCoords(
  lat: number,
  long: number,
  source: 'fg' | 'bg' = 'bg',
  forceDispatch?: StoreDispatch,
  address?: string,
) {
  const lastTs: number = Number(Preferences.getData(Preferences.KEY.LAST_POST_TS) ?? 0);
  if (posting || Date.now() - lastTs < MIN_GAP_MS) return;

  try {
    posting = true;
    await sendLocationToServer({ lat, long, address, source, forceDispatch });
  } catch (e) {
    Common?.warn?.(`[Poster:${source}] ❌ failed`, e);
  } finally {
    posting = false;
  }
}

export function formatServerDateTimeIST(d: Date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
  const ist = new Date(utcMs + 330 * 60000);
  const YYYY = ist.getFullYear();
  const MM = pad(ist.getMonth() + 1);
  const DD = pad(ist.getDate());
  const HH = pad(ist.getHours());
  const mm = pad(ist.getMinutes());
  const ss = pad(ist.getSeconds());
  return `${DD}-${MM}-${YYYY} ${HH}:${mm}:${ss}`;
}

const MIN_GAP_MS = 5_000;
let posting = false;
let lastLat: number | null = null;
let lastLong: number | null = null;
let lastAddress: string | null = null;

export async function postOnceIfDue(
  source: 'fg' | 'bg' = 'fg',
  forceDispatch?: StoreDispatch,
) {
  if (posting) return;

  const lastTs: number = Number(
    Preferences.getData(Preferences.KEY.LAST_POST_TS) ?? 0,
  );
  if (Date.now() - lastTs < MIN_GAP_MS) return;

  try {
    posting = true;
    const net = await NetInfo.fetch();
    const online =
      (net.isConnected ?? false) && (net.isInternetReachable ?? true);
    if (!online) {
      __DEV__ && console.log(`[Poster:${source}] skipped (offline)`);
      return;
    }

    const last = (Preferences.getData(Preferences.KEY.LAST_GEO_ADDRESS) ??
      {}) as { address?: string; lat?: number; long?: number };

    let lat = last?.lat;
    let long = last?.long;
    let address: string = typeof last?.address === 'string' ? last.address : '';

    // 🟢 Always get current coordinates
    await new Promise<void>(resolve => {
      Geolocation.getCurrentPosition(
        pos => {
          lat = pos?.coords?.latitude;
          long = pos?.coords?.longitude;
          resolve();
        },
        _err => resolve(),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
      );
    });

    if (!lat || !long) {
      __DEV__ && console.log(`[Poster:${source}] no lat/long; skip`);
      return;
    }

    // 🟢 Always get fresh address from live location
    try {
      const geo = await Location?.getAddressWithLatLong?.(lat, long);
      if (geo?.address) {
        address = geo.address;

        // 🟢 If address changed → update Preferences
        const prev = Preferences.getData(Preferences.KEY.LAST_GEO_ADDRESS);
        if (!prev || prev?.address !== address) {
          Preferences.setData(Preferences.KEY.LAST_GEO_ADDRESS, {
            lat,
            long,
            address,
          });
          __DEV__ && console.log('[Poster] updated saved address:', address);
        }
      }
    } catch (err) {
      __DEV__ && console.log('[Poster] address fetch failed', err);
    }

    if (!address) {
      __DEV__ && console.log(`[Poster:${source}] address empty; skip sending`);
      return;
    }

    const power = await DeviceInfo.getPowerState().catch(() => null as any);
    const batteryNum = Math.round(((power?.batteryLevel ?? 0) as number) * 100);
    const batteryStatus = `${batteryNum}%`;

    const token: string = String(
      Preferences.getData(Preferences.KEY.API_AUTH_TOKEN) ?? '',
    );
    const employeeID = Number(
      Preferences.getData(Preferences.KEY.EMPLOYEE_ID) ?? 0,
    );
    const companyId =
      Number(Preferences.getData(Preferences.KEY.COMPANY_ID) ?? 11) || 11;
    const OrganizationCode = String(
      Preferences.getData(Preferences.KEY.ORGANIZATION_CODE) ?? '',
    );

    if (!token || !employeeID || !companyId) {
      __DEV__ &&
        console.warn(`[Poster:${source}] Missing token/employeeID/companyId; skip`);
      return;
    }

    const body = {
      token,
      employeeID,
      address: address ?? '',
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

    __DEV__ && console.log(`[Poster:${source}] sending @ ${body.dateTime}`, {
      lat,
      long,
      address,
      batteryStatus,
    });

    const dispatchToUse = forceDispatch ?? dispatchRef;
    if (!dispatchToUse) {
      __DEV__ && console.warn(`[Poster:${source}] No dispatch; skip`);
      return;
    }

    const action = PostLocationApi({ body });
    const result: any = dispatchToUse(action);

    if (result && typeof result.unwrap === 'function') {
      await result.unwrap();
    } else {
      await result;
    }

    Preferences.setData(Preferences.KEY.LAST_POST_TS, Date.now());
    __DEV__ && console.log(`[Poster:${source}] ✅ success @ ${body.dateTime}`);
  } catch (e) {
    Common?.warn?.(`[Poster:${source}] ❌ failed`, e);
  } finally {
    posting = false;
  }
}

export default { attachPosterDispatch, postOnceIfDue, formatServerDateTimeIST };
