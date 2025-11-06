import { GEO_CODING_API } from '@env';
import Geolocation, { GeolocationResponse } from '@react-native-community/geolocation';
import { DataType } from '@types';
import { Linking, Platform } from 'react-native';
import { isLocationEnabled, promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';
import Geocoder from 'react-native-geocoding';
import { check, checkMultiple, openSettings, PERMISSIONS, request, requestMultiple } from 'react-native-permissions';
import { alert, error, log } from './common';
import { getData, setData } from './preferences';
Geocoder.init(GEO_CODING_API);
export const initializeConfig = async () => {
  Geolocation.setRNConfiguration(
    {
      skipPermissionRequests: false,
      authorizationLevel: 'always',
      enableBackgroundLocationUpdates: true,
      locationProvider: 'auto',
    }
  );
};
export const getAddressFromLatLong = async (): Promise<DataType.GeoAddress> => {
  const info = await getGeoLocation() as DataType.GeoLocation;
  log('info', info);
  if (!info) {
    return { address: 'Address Not Found', lat: 0, long: 0 };
  }
  const { latitude: lat, longitude: long } = info?.coords;
  return Geocoder.from(lat, long)
    .then(json => {
      // log('Geo Address', json);
      var addressComponent = {
        address: json.results[0]?.formatted_address,
        lat,
        long,
      };
      // success('Geo Address', addressComponent);
      return addressComponent;
    })
    .catch(err => {
      error('Error fetching address: ', err?.message ?? '');
      return { address: 'Address Not Found', lat: lat ?? 0, long: long ?? 0 };
    });
};

export const getAddressWithLatLong = async (lat: number, long: number): Promise<DataType.GeoAddress> => {
  console.info({lat},{long});
  
  return Geocoder.from(lat, long)
    .then(json => {
      // log('Geo Address', json);
      var addressComponent = {
        address: json.results[0]?.formatted_address,
        lat,
        long,
      };
      console.info('Geo Address',{addressComponent})
      // success('Geo Address', addressComponent);
      return addressComponent;
    })
    .catch(err => {
      error('Error fetching address: ', err?.message ?? '');
      return { address: '', lat: lat ?? 0, long: long ?? 0 };
    });
};

export const getGeoLocation = async (): Promise<GeolocationResponse> => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (info) => {
        // success('Location Position', info);
        const add = getData('LAST_GEO_ADDRESS') as DataType.GeoAddress;
        if (add && add?.address === '') {
          setData('LAST_GEO_ADDRESS', {
            ...add,
            lat: info.coords.latitude,
            long: info.coords.longitude,
          });
        } else {
          setData('LAST_GEO_ADDRESS', {
            ...add,
            lat: info.coords.latitude,
            long: info.coords.longitude,
          });
        }
        resolve(info);
      },
      err => {
        error('Error fetching address: ', err?.message ?? '');
        const loc = getData('LAST_GEO_ADDRESS');
        reject({
          coords: {
            latitude: loc?.lat ?? 0,
            longitude: loc?.long ?? 0,
          },
        });
      },
      {
        timeout: 10000,
        maximumAge: 0,
        enableHighAccuracy: false,
      },
    );
  });
};

export const watchGeoLocation = async () => {
  return new Promise((resolve, reject) => {
    Geolocation.watchPosition((res) => {
      resolve(res);
    }, (err) => {
      reject(err);
    }, {
      interval: 10000,
      // fastestInterval: 10000,
      timeout: 15000,
      maximumAge: 50000,
      enableHighAccuracy: true,
      distanceFilter: 10,
      useSignificantChanges: true,
    });
  });

};


/**
 * Calculate the distance between two latitude-longitude points using the Haversine formula.
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * @param unit Unit of measurement ('km' for kilometers, 'mi' for miles, 'm' for meters)
 * @returns Distance between the two points in the specified unit
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: 'km' | 'mi' | 'm' = 'm'
): number => {
  if (
    isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
  ) {
    console.warn('Invalid coordinates:', { lat1, lon1, lat2, lon2 });
    return Number.POSITIVE_INFINITY; // Avoid breaking sorting
  }

  const toRad = (value: number): number => (value * Math.PI) / 180;

  const R = unit === 'km' ? 6371 : unit === 'mi' ? 3958.8 : 6371000; // Earth's radius
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const lat1Rad = toRad(lat1);
  const lat2Rad = toRad(lat2);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1Rad) * Math.cos(lat2Rad);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

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
  minDistance: number, // Minimum distance in meters
): { chamber: any; distance: number } | null => {
  let nearestChamber = null;
  let minDistanceFound = Infinity;

  for (const chamber of chambers) {
    const chamberLat = parseFloat(chamber.chamber_latitude);
    const chamberLon = parseFloat(chamber.chamber_longitude);

    // Skip invalid coordinates
    if (isNaN(chamberLat) || isNaN(chamberLon)) {
      console.warn(`Invalid coordinates for chamber ${chamber.chamber_id}`);
      continue;
    }

    const distance = calculateDistance(currentLat, currentLon, chamberLat, chamberLon);

    if (distance < minDistanceFound) {
      minDistanceFound = distance;
      nearestChamber = { chamber, distance };
    }

    // Optional: Early exit if a chamber is within minDistance
    if (distance <= minDistance) {
      return nearestChamber;
    }
  }

  return minDistanceFound <= minDistance ? nearestChamber : null;
};

export const checkGps = async () => {
  const checkEnabled: boolean = await isLocationEnabled();
  if (!checkEnabled) {
    try {
      const enableResult = await promptForEnableLocationIfNeeded();
      log('GPS Result::', enableResult);
      return (enableResult === 'already-enabled' || enableResult === 'enabled');
    } catch (err: unknown) {
      if (err instanceof Error) {
        error('Error in on GPS::', err);
        return false;
      }
    }
  }
  return checkEnabled;
};

export const checkPermission = async () => {
  try {
    let permission;
    const gps = await checkGps();
    // log('GPS Enabled::', gps);
    permission = gps ? permission : 'denied';
    if (Platform.OS === 'android') {
      const perm = await checkMultiple([PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION, PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION]);
      // log('Fine Location | Background::', perm);
      if (perm['android.permission.ACCESS_BACKGROUND_LOCATION'] === 'granted' && perm['android.permission.ACCESS_FINE_LOCATION'] === 'granted') {
        permission = 'granted';
      } else {
        permission = await requestPermission();
      }
    } else {
      permission = await check(PERMISSIONS.IOS.LOCATION_ALWAYS);
      if (permission === 'denied') {
        permission = await requestPermission();
      }
    }
    return permission;
  } catch (err) {
    error('Location Error');
  }
};


export const requestPermission = async () => {
  let permission;
  if (Platform.OS === 'android') {

    const perm = await requestMultiple([PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION, PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION]);
    // log('Request Location Permission::', perm);
    if (perm['android.permission.ACCESS_BACKGROUND_LOCATION'] !== 'granted') {
      alert({
        title: 'Background Location',
        msg: 'Please enable background location to navigating\nPermissions > Location > "Allow all the time" to continue',
        onPress: () => {
          openLocationSetting();
        },
      });
    } else if (perm['android.permission.ACCESS_FINE_LOCATION'] !== 'granted') {
      alert({
        title: 'Location',
        msg: 'Please enable location permission to continue',
        onPress: () => {
          openLocationSetting();
        },
      });
    }
  } else if (Platform.OS === 'ios') {
    permission = await request(PERMISSIONS.IOS.LOCATION_ALWAYS);
  }

  return permission;
};

const openLocationSetting = () => {
  let intentId = '';
  if (Platform.OS === 'android' && Platform.Version >= 30) {
    intentId = 'android.settings.ACTION_LOCATION_SOURCE_SETTINGS';
  } else {

  }
  Linking.sendIntent('android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS')
    // Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS')
    .then(() => log('Location settings opened successfully'))
    .catch((err) => {
      openSettings();
      error('An error occurred', err);
    });
};
