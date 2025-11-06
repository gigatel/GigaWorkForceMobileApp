import React, {useEffect, useRef, useState} from 'react';
import {NativeEventEmitter, NativeModules, Platform} from 'react-native';
import {Provider} from 'react-redux';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {addEventListener as addNetListener} from '@react-native-community/netinfo';
import messaging, {
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
} from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import RootNavigator from '@navigation/navigator';
import {store} from './store/store';
import './locales/i18n';
import {startOfflineSync} from '@hooks/OfflineSyncService';
import {
  setupBackgroundServiceEvents,
  setupForegroundServiceEvents,
} from './utils/locationService';

import {updateGpsStatus, updateNetStatus} from '@slices/device.slice';
import {Common, Location, Voice, Preferences} from '@utils';
// ⬇️ NEW: import siren helpers
import {ensureAllSirenChannel, displayWithSiren} from './utils/AllSiren';

// (kept) your push service for token mgmt
import notificationService from './services/notificationService';

// ✅ Android-only: create the siren channel ASAP (no await at module scope)
if (Platform.OS === 'android') {
  ensureAllSirenChannel().catch(() => {});
}

// ✅ Optional: request permission & register for remote messages at module level (safe on iOS/Android)
const preparePushPermissions = async () => {
  try {
    await messaging().registerDeviceForRemoteMessages();

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      Common.warn?.('Push permission not granted');
    }
  } catch (e) {
    Common.error?.('Permission error: ' + (e as Error).message);
  }
};
preparePushPermissions().catch(() => {});

// 🔔 Background handler must be outside a component.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  try {
    // ⬇️ CHANGED: always show with siren
    const n = remoteMessage?.notification || {};
    const d = remoteMessage?.data || {};
    await displayWithSiren({
      title: n.title || (d as any)?.title,
      body: n.body || (d as any)?.body,
      data: d,
    });
  } catch (e) {
    // no-op
  }
});

const App = () => {
  const [isGPSEnabled, setIsGPSEnabled] = useState(true);
  const gpsSubscription = useRef<any>(null);

  // Debug/auth token (your existing read)
  const token = Preferences.getData('API_AUTH_TOKEN');
  Common.log?.('API_AUTH_TOKEN:', token);

  const initializeApp = async () => {
    try {
      // Request notification permissions and get FCM token
      const fcmToken = await notificationService.requestPermissions();
      console.log('FCM Token:', fcmToken);

      if (fcmToken) {
        await sendFCMTokenToBackend(fcmToken);
      }

      // Handle token refresh
      notificationService.onTokenRefresh(async token => {
        console.log('New FCM Token:', token);
        await sendFCMTokenToBackend(token);
      });
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    (async () => {
      await notifee.requestPermission({
        provisional: false,
      });
    })();
  }, []);

  // Ensure siren channel on mount too (safe no-op on iOS)
  useEffect(() => {
    ensureAllSirenChannel().catch(() => {});
  }, []);

  // ---- 1) Boot-time push setup (token + listeners) ----
  useEffect(() => {
    let unsubscribeOnMessage: (() => void) | undefined;
    let unsubscribeOpened: (() => void) | undefined;
    let unsubscribeTokenRefresh: (() => void) | undefined;

    const initNotifications = async () => {
      try {
        // Request permissions + token through your wrapper
        const fcmToken = await notificationService.requestPermissions();
        if (!fcmToken) {
          Common.warn?.('FCM token missing (permissions not granted?)');
        } else {
          Common.log?.('FCM Token:', fcmToken);
          await sendFCMTokenToBackend(fcmToken);
        }

        // 🔁 Token refresh
        unsubscribeTokenRefresh = messaging().onTokenRefresh(async newToken => {
          Common.log?.('FCM Token (refresh):', newToken);
          await sendFCMTokenToBackend(newToken);
        });

        // 💤 App opened from quit/cold state
        const initMsg = await messaging().getInitialNotification();
        if (initMsg) {
          Common.success?.('Opened from Quit State', initMsg);
          // TODO: navigate based on initMsg.data if needed
        }
        // ⏪ App opened from background by tapping notification
        unsubscribeOpened = messaging().onNotificationOpenedApp(
          remoteMessage => {
            Common.success?.('Opened from Background', remoteMessage);
            // TODO: navigate based on remoteMessage.data if needed
          },
        );

        // 🟢 App in foreground: show a siren local notification
        unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
          Common.success?.('Foreground FCM', remoteMessage);
          try {
            // ⬇️ CHANGED: always show with siren
            const n = remoteMessage?.notification || {};
            const d = remoteMessage?.data || {};
            await displayWithSiren({
              title: n.title || (d as any)?.title,
              body: n.body || (d as any)?.body,
              data: d,
            });
          } catch (e) {
            Common.error?.('Local notif error: ' + (e as Error).message);
          }
        });
      } catch (e) {
        Common.error?.('initNotifications failed: ' + (e as Error).message);
      }
    };
    initNotifications();
    return () => {
      try {
        unsubscribeOnMessage?.();
        unsubscribeOpened?.();
        unsubscribeTokenRefresh?.();
      } catch {}
    };
  }, []);

  // ---- 2) GPS / Services / NetInfo ----
  useEffect(() => {
    if (Platform.OS === 'android') {
      setupForegroundServiceEvents();
      setupBackgroundServiceEvents();

      Location.checkGps().then((enabled: boolean) => {
        setIsGPSEnabled(enabled);
        store.dispatch(updateGpsStatus(enabled));
      });

      const gpsEmitter = new NativeEventEmitter(NativeModules.GpsStatusModule);
      gpsSubscription.current = gpsEmitter.addListener(
        'GpsStatusChanged',
        (enabled: boolean) => {
          setIsGPSEnabled(enabled);
          store.dispatch(updateGpsStatus(enabled));
          Common.log('GPS STATUS::', enabled);
        },
      );
    }

    startOfflineSync();
    Voice.setLanguage('hi-IN');

    const ttsEmitter = new NativeEventEmitter(NativeModules.TextToSpeech);
    const ttsStart = ttsEmitter.addListener('tts-start', () =>
      Common.log('TTS started'),
    );
    const ttsFinish = ttsEmitter.addListener('tts-finish', () =>
      Common.log('TTS Finish'),
    );
    const ttsCancel = ttsEmitter.addListener('tts-cancel', () =>
      Common.log('TTS Canceled'),
    );

    const netUnsubscribe = addNetListener(net => {
      const isOnline =
        (net.isConnected ?? false) || (net.isInternetReachable ?? false);
      store.dispatch(updateNetStatus(!!isOnline));
    });

    return () => {
      try {
        ttsStart.remove();
        ttsFinish.remove();
        ttsCancel.remove();
      } catch {}
      netUnsubscribe();
      if (Platform.OS === 'android' && gpsSubscription.current) {
        gpsSubscription.current.remove();
        gpsSubscription.current = null;
      }
    };
  }, []);

  // ---- 3) GPS prompt if disabled ----
  useEffect(() => {
    if (!isGPSEnabled) {
      Common.alert({
        title: 'GPS Disabled',
        msg: 'Please enable GPS to use this app.',
        onPress: async () => {
          try {
            const enabled = await Location.checkGps();
            store.dispatch(updateGpsStatus(enabled));
          } catch (error: unknown) {
            if (error instanceof Error) {
              Common.error(error.message);
            }
          }
        },
      });
    }
  }, [isGPSEnabled]);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;

// ----------------- helpers -----------------
async function sendFCMTokenToBackend(token: string) {
  // TODO: call your API to save token for the logged-in user/device
  Common.log?.('Sending FCM Token to Backend:', token);
}
