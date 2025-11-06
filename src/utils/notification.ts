/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import { Platform, PermissionsAndroid } from 'react-native';
import messaging, {
  AuthorizationStatus,
  getMessaging,
  requestPermission,
} from '@react-native-firebase/messaging';
import { alert, error, log, success } from './common';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { openSettings } from 'react-native-permissions';
import { Common } from '@utils';

/**
 * Request iOS notification permission and get FCM token
 */
const requestIOSPermissionAndToken = async (): Promise<string | null> => {
  try {
    const msg = getMessaging();
    const authStatus = await requestPermission(msg);


    const isEnabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;


    if (!isEnabled) {
      alert({
        title: 'Permission Required',
        msg: 'Notification Permission Denied!\nAllow Notification permission from app settings.',
        onPress: () => {
          openSettings('notifications');
        },
      });
      return null;
    }

    const token = await messaging().getToken();
    success('FCM Token (iOS):', token);
    return token;
  } catch (err) {
    error('iOS Permission Error:', err);
    return null;
  }
};

/**
 * Request Android notification permission and get FCM token
 */
const requestAndroidPermissionAndToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      log('Android Permission:', granted);
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        alert({
          title: 'Permission Required',
          msg: 'Notification Permission Denied!',
          onPress: () => {
            openSettings('notifications');
          },
        });
        return null;
      }

    }

    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    success('FCM Token (Android):', token);
    return token;
  } catch (err) {
    error('Android Permission Error:', err);
    return null;
  }
};

/**
 * Main function to get FCM token depending on platform
 */
export const getFCMToken = async (): Promise<string | null> => {
  return Platform.OS === 'ios'
    ? await requestIOSPermissionAndToken()
    : await requestAndroidPermissionAndToken();
};

export async function createNotificationChannel() {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: 'gigaltel-notification-id',
      name: 'Gigatel Mobile App',
      importance: AndroidImportance.HIGH,
    });
  }
}

export async function displayLocalNotification(remoteMessage: any) {
  const { title, body } = remoteMessage?.notification || {};
  if (!title && !body) { return; }

  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: 'gigaltel-notification-id',
      importance: AndroidImportance.HIGH,
    },
  });
}
