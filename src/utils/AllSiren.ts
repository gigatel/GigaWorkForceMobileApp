// utils/AllSiren.ts
import { Platform } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';

// ======= Constants =======
export const ALL_SIREN_CHANNEL_ID = 'gigatel-siren-all-v1';

// ======= Channel setup (Android only) =======
export async function ensureAllSirenChannel() {
  if (Platform.OS !== 'android') return;

  await notifee.createChannel({
    id: ALL_SIREN_CHANNEL_ID,
    name: 'All Siren Alerts',
    sound: 'siren', 
    importance: AndroidImportance.HIGH,
  });
}

export async function displayWithSiren({
  title,
  body,
  data,
}: {
  title?: string;
  body?: string;
  data?: any;
}) {
  await notifee.displayNotification({
    title: title || 'Alert',
    body: body || '',
    data,
    android: {
      channelId: ALL_SIREN_CHANNEL_ID,
      pressAction: { id: 'default' },
    },
    ios: {
      sound: 'siren.wav',
      foregroundPresentationOptions: {
    alert: true,
    sound: true,
    badge: true,
  },
    },
  });
}
