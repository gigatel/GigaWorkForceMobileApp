import Geolocation, {
  GeolocationOptions,
} from '@react-native-community/geolocation';
import notifee, {
  AndroidColor,
  AndroidForegroundServiceType,
  AndroidImportance,
  AuthorizationStatus,
  Notification,
  NotificationPressAction,
} from '@notifee/react-native';
import { Event, EventType } from '@notifee/react-native';
import { error, getNetConnection, log, openSettings, success } from '../common';
import { checkPermission } from '../location';
import { getFormatedTime } from '../times';
import { getData, removeData, setData } from '../preferences';
import { APIs, URLs } from '@apis';

let watchID: number | null = null;
const UPDATE_INTERVAL = 0.25 * 60 * 1000; // 15 seconds
const NOTIFICATION_ID = 'gigatel-location-tracking';
let watchId: number | null;

export type LocationData = {
  platform: 'android' | 'ios';
  location: {
    lat: number;
    lng: number;
  };
  angle: number | null;
};

export interface ForegroundEvent {
  type: EventType;
  detail: {
    notification?: Notification;
    pressAction?: NotificationPressAction;
    input?: string;
  };
}

export const onEventRecieved = ({ type, detail }: Event) => {
  switch (type) {
    case EventType.PRESS:
      console.log('Notification pressed:', detail.notification);
      break;
    case EventType.ACTION_PRESS:
      console.log('Action pressed:', detail.pressAction?.id);
      if (detail.input) {
        console.log('User input:', detail.input);
      }
      break;
    case EventType.DISMISSED:
      console.log('Notification dismissed:', detail.notification);
      break;
    case EventType.DELIVERED:
      console.log('Notification delivered:', detail.notification);
      break;
    default:
      console.log('Other event:', { type, detail });
  }
};

// Create a notification channel for the foreground service
async function createNotificationChannel() {
  const channelId = await notifee.createChannel({
    id: 'locationGigatelChannel',
    name: 'Gigatel Location Tracking',
    importance: AndroidImportance.HIGH,
  });
  log('Notification channel created:', channelId);
  return channelId;
}
// Check if we can start the foreground service
async function canStartForegroundService() {
  const permission = await notifee.requestPermission();
  const channelId = await createNotificationChannel();

  return permission.authorizationStatus === AuthorizationStatus.AUTHORIZED && channelId;
}
// Handle foreground notification events
export function setupForegroundServiceEvents() {
  const unsubscribe = notifee.onForegroundEvent(({ type, detail }: { type: any, detail: any }) => {
    if (type === EventType.ACTION_PRESS && detail?.pressAction.id === 'stop-tracking') {
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
    if (type === EventType.ACTION_PRESS && detail.pressAction.id === 'stop-tracking') {
      log('Stop tracking action pressed in background');
      // await notifee.stopForegroundService();
      openSettings();
    }
  });
}


// Service registration which is called when startWatch is called.
notifee.registerForegroundService(notification => {
  return new Promise(async () => {
    try {
      if (!(await checkPermission())) {
        log('Cannot start foreground service: missing location permissions');
        return null;
      }

      watchId = Geolocation.watchPosition(
        async position => {
          const { latitude, longitude } = position?.coords;

          // log('****** BG Location ******* ', position?.coords, getFormatedTime('HH:mm:ss'));
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
            // const lastAtt = getData('OFFLINE_ATTENDANCE');
            // if (lastAtt && lastAtt.length > 0) {
            //   log('Last Attendance Data::::::', lastAtt);
            //   try {
            //     let param: any = [];
            //     lastAtt?.map((item: any) => {
            //       param.push(item.params);
            //     });
            //     const res = await APIs.postRequestWithJson({
            //       path: URLs.syncOfflineAttendance,
            //       params: {
            //         attendanceList: param,
            //       },
            //       isAuth: true,
            //     });
            //     log('Sync Attendance::::::', res);
            //     if (res?.status === 200 && res.success) {
            //       removeData('OFFLINE_ATTENDANCE');
            //     }
            //   } catch (err) {
            //     error('Error in Sync', err);
            //   }
            // }

          } else {
            setData('LAST_GEO_ADDRESS', {
              lat: latitude,
              long: longitude,
              addres: 'NA',
            });
          }
        },
        err => {
          error('Location error:', err);
        },
        {
          distanceFilter: 10,
          timeout: 300000,
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
  });
});

export const clearWatch = async () => {
  if (watchID != null) {
    Geolocation.clearWatch(watchID);
  }
  await notifee.stopForegroundService();
};

const alreadyRunning = async () => {
  let notifs = await notifee.getDisplayedNotifications();
  return notifs.some(item => item.notification.android?.asForegroundService);
};

/**
 * Starts tracking in the background, ensuring the process is unkillable.
 * @param id - An optional identifier to uniquely identify the running task (default is 'default').
 * @returns A promise that resolves when the task has started.
 */
export const startWatch = async (id = 'default') => {
  const running = await alreadyRunning();
  console.log('Foreground watch already running', running);
  if (running) {
    return;
  }
  // Create tracking channel if not exist
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

    await notifee.displayNotification({
      id: NOTIFICATION_ID,
      title: 'gigatrack is Running',
      body: 'Tracking your location tap for more information',
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
            pressAction: { id: 'stop-tracking' },
          },
        ],
      },
    });
  } catch (err) {
    console.log('Error in start tracking: ', err);
  }
};
