import { APIs, URLs } from '@apis';
import notifee, { AndroidColor, AndroidForegroundServiceType, AndroidImportance, AuthorizationStatus, EventType } from '@notifee/react-native';
import Geolocation from '@react-native-community/geolocation';
import { openSettings } from 'react-native-permissions';
import { error, getNetConnection, log, success } from '../../src/utils/common';
import { getData, removeData, setData } from '../../src/utils/preferences';
import { checkPermission } from '../../src/utils/location';
import { getFormatedTime } from './times';
const UPDATE_INTERVAL = 0.25 * 60 * 1000; // 15 seconds
const NOTIFICATION_ID = 'gigatel-location-tracking';
let watchId: number | null;
let isServiceStarted = false;
// Create a notification channel for the foreground service
async function createNotificationChannel() {
  const channelId = await notifee.createChannel({
    id: 'locationGigatelChannel',
    name: 'Gigatel Location Tracking',
    importance: AndroidImportance.HIGH,
  }); 
  // log('Notification channel created:', channelId);
  return channelId;
}
// Check if we can start the foreground service
async function canStartForegroundService() {
  const permission = await notifee.requestPermission();
  const channelId = await createNotificationChannel();
  return permission.authorizationStatus === AuthorizationStatus.AUTHORIZED && channelId;
}

// Start the foreground service with a notification
export const startLocationService = async (): Promise<boolean> => {
  if (isServiceStarted) {
    success('Foreground Service Already Running');
    return true;
  }
  try {
    // Check if we can start the service
    if (!(await canStartForegroundService())) {
      log('Cannot start foreground service: missing permissions or connection');
      return false;
    }
    if (!(await checkPermission())) {
      log('Cannot start foreground service: missing location permissions');
      return false;
    }
    const channelId = await createNotificationChannel();

    isServiceStarted = true;

    // Display foreground service notification
    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: 'gigaWorkforce is Running',
      body: 'For update the task and data, tap for more information',
      android: {
        channelId: channelId,
        asForegroundService: true,
        smallIcon: 'ic_launcher',
        color: AndroidColor.PURPLE,
        colorized: true,
        ongoing: true,
        importance: AndroidImportance.HIGH,
        foregroundServiceTypes: [AndroidForegroundServiceType.FOREGROUND_SERVICE_TYPE_LOCATION],
        actions: [
          {
            title: 'More Details',
            pressAction: { id: 'details' },
          },
        ],
      },
    });
    // log('Foreground service notification displayed');
    return true;
  } catch (err) {
    error('Failed to start service:', err);
    setData('FOREGROUND_SERVICE', 'no');
    return false;
  }
};
// Handle foreground notification events
export function setupForegroundServiceEvents() {
  const unsubscribe = notifee.onForegroundEvent(({ type, detail }: { type: any, detail: any }) => {
    console.log('setupForegroundServiceEvents', type, detail);
    console.log('detail', detail?.notification?.data?.body);
    console.log('type:',type);
    
    
    if (type === EventType.ACTION_PRESS && detail?.pressAction.id === 'details') {
      log('Stop tracking action pressed');
      // notifee.stopForegroundService();
      openSettings();
    }
  });
  return unsubscribe;
}

// Handle background notification events
export function setupBackgroundServiceEvents() {
  notifee.onBackgroundEvent(async ({ type, detail }: { type: any, detail: any }) => {
    console.log('setupBackgroundServiceEvents', type, detail);
    if (type === EventType.ACTION_PRESS && detail.pressAction.id === 'details') {
      log('Stop tracking action pressed in background');
      // await notifee.stopForegroundService();
      openSettings();
    }
  });
}

// Headless task for background execution
export const startLocationTracking = async (): Promise<number | null> => {
  isServiceStarted = true;
  log('Starting location tracking in the background...');
  try {
    if (!(await checkPermission())) {
      log('Cannot start foreground service: missing location permissions');
      return null;
    }
    watchId = Geolocation.watchPosition(
      async position => {
        const { latitude, longitude } = position?.coords;
        log('BG Location::', position?.coords, getFormatedTime('HH:mm:ss'));
        const isnet = await getNetConnection();
        if (isnet) {
          // Save Last Location With Address
          // Geocoder.from(latitude, longitude).then(json => {
          //   const add = {
          //     address: json.results[0]?.formatted_address,
          //     lat: latitude,
          //     long: longitude,
          //   };
          //   setData('LAST_GEO_ADDRESS', add);
          // });

          // Get The Offline Attendance and Sync With Server
          const lastAtt = getData('OFFLINE_ATTENDANCE');
          if (lastAtt && lastAtt.length > 0) {
            log('Last Attendance Data::::::', lastAtt);
            try {
              let param: any = [];
              lastAtt?.map((item: any) => {
                param.push(item.params);
              });
              const res = await APIs.postRequestWithJson({
                path: URLs.syncOfflineAttendance,
                params: {
                  attendanceList: param,
                },
                isAuth: true,
              });
              log('Sync Attendance::::::', res);
              if (res?.status === 200 && res.success) {
                removeData('OFFLINE_ATTENDANCE');
              }
            } catch (err) {
              error('Error in Sync', err);
            }
          }

        } else {
          setData('LAST_GEO_ADDRESS', {
            lat: latitude,
            long: longitude,
            addres: 'not found',
          });
        }
      },
      err => {
        error('Location error:', err);
      },
      {
        distanceFilter: 10,
        interval: UPDATE_INTERVAL,
        fastestInterval: UPDATE_INTERVAL / 2,
        enableHighAccuracy: true,
      }
    );
    log('Location tracking started with watchId:', watchId);
    return watchId;
  }
  catch (err) {
    error('Failed to start location tracking:', err);
    return null;
  }
};

// Stop location tracking
export const stopLocationTracking = (wId: number | null) => {
  if (wId) {
    Geolocation.clearWatch(wId);
    log('Location tracking stopped, watch Id:', wId);
  }
};