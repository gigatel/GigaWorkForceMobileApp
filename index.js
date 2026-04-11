// // import { AppRegistry, Text, TextInput, Platform } from 'react-native';
// // import messaging from '@react-native-firebase/messaging';
// // import notifee, { EventType } from '@notifee/react-native';

// // import App from './src/App';
// // import { name as appName } from './app.json';
// // import NewIRScreen from '@screens/tickets/NewIRScreen';
// // import TubeCoreDetailsScreen from '@screens/tickets/TubeCoreDetailsScreen';
// // import ChamberDetailsScreen from '@screens/tickets/ChamberDetailsScreen';
// // // Optional foreground updater (keep if you use it)
// // import  './src/utils/BackgroundUpdate/Forground';
// // // Siren helpers
// // import { ensureAllSirenChannel, displayWithSiren } from './src/utils/AllSiren';
// // // Disable font scaling (optional)
// // Text.defaultProps = Text.defaultProps || {};
// // Text.defaultProps.allowFontScaling = false;
// // TextInput.defaultProps = TextInput.defaultProps || {};
// // TextInput.defaultProps.allowFontScaling = false;
// // // Ensure siren channel ASAP (Android)
// // if (Platform.OS === 'android') {
// //   ensureAllSirenChannel().catch(() => { });
// // }
// // // ✅ TOP-LEVEL BACKGROUND HANDLER (runs for DATA-ONLY pushes)
// // messaging().setBackgroundMessageHandler(async remoteMessage => {
// //   try {
// //     const n = (remoteMessage && remoteMessage.notification) || {};
// //     const d = (remoteMessage && remoteMessage.data) || {};
// //     // Log to verify BG execution (use `adb logcat | grep RNFirebase` on Android)
// //     console.log('[BG] FCM received:', { title: n.title || d.title, hasData: !!remoteMessage?.data });
// //     // Show our own local Notifee with siren
// //     await ensureAllSirenChannel(); // no-op on iOS
// //     await displayWithSiren({
// //       title: n.title || d.title || 'Alert',
// //       body: n.body || d.body || '',
// //       data: d,
// //     });
// //   } catch (e) {
// //     // never crash in bg
// //   }
// // });
// // // Notifee background events (press, etc.)
// // notifee.onBackgroundEvent(async ({ type, detail }) => {
// //   try {
// //     if (type === EventType.PRESS) {
// //       // handle deep link via detail.notification?.data if needed
// //     }
// //   } catch (e) { }
// // });

// // // Foreground service stub (optional)
// // notifee.registerForegroundService(() => {
// //   return new Promise(async resolve => {
// //     try {
// //       // long-running work if needed
// //     } finally {
// //       resolve();
// //     }
// //   });
// // });

// // AppRegistry.registerComponent(appName, () => App);
// import { AppRegistry, Text, TextInput, Platform } from 'react-native';
// import messaging from '@react-native-firebase/messaging';
// import notifee, { EventType } from '@notifee/react-native';
// import StartTicketScreen from '@screens/tickets/StartTicketScreen';
// import App from './src/App';
// import { name as appName } from './app.json';
// import NewIRScreen from '@screens/tickets/NewIRScreen';
// import TubeCoreDetailsScreen from '@screens/tickets/TubeCoreDetailsScreen';
// import ChamberDetailsScreen from '@screens/tickets/ChamberDetailsScreen';
// // Optional foreground updater (keep if you use it)
// import './src/utils/BackgroundUpdate/Forground';
// // Siren helpers
// import { ensureAllSirenChannel, displayWithSiren } from './src/utils/AllSiren';
// // Disable font scaling (optional)
// Text.defaultProps = Text.defaultProps || {};
// Text.defaultProps.allowFontScaling = false;
// TextInput.defaultProps = TextInput.defaultProps || {};
// TextInput.defaultProps.allowFontScaling = false;
// // Ensure siren channel ASAP (Android)
// if (Platform.OS === 'android') {
//   ensureAllSirenChannel().catch(() => { });
// }
// // ✅ TOP-LEVEL BACKGROUND HANDLER (runs for DATA-ONLY pushes)
// messaging().setBackgroundMessageHandler(async remoteMessage => {
//   try {
//     const n = (remoteMessage && remoteMessage.notification) || {};
//     const d = (remoteMessage && remoteMessage.data) || {};
//     // Log to verify BG execution (use `adb logcat | grep RNFirebase` on Android)
//     console.log('[BG] FCM received:', { title: n.title || d.title, hasData: !!remoteMessage?.data });
//     // Show our own local Notifee with siren
//     await ensureAllSirenChannel(); // no-op on iOS
//     await displayWithSiren({
//       title: n.title || d.title || 'Alert',
//       body: n.body || d.body || '',
//       data: d,
//     });
//   } catch (e) {
//     // never crash in bg
//   }
// });
// // Notifee background events (press, etc.)
// notifee.onBackgroundEvent(async ({ type, detail }) => {
//   try {
//     if (type === EventType.PRESS) {
//       // handle deep link via detail.notification?.data if needed
//     }
//   } catch (e) { }
// });

// // Foreground service stub (optional)
// notifee.registerForegroundService(() => {
//   return new Promise(async resolve => {
//     try {
//       // long-running work if needed
//     } finally {
//       resolve();
//     }
//   });
// });

// AppRegistry.registerComponent(appName, () => App);
import { AppRegistry, Text, TextInput, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { EventType } from '@notifee/react-native';
import StartTicketScreen from '@screens/tickets/StartTicketScreen';
import App from './src/App';
import { name as appName } from './app.json';
import NewIRScreen from '@screens/tickets/NewIRScreen';
import TubeCoreDetailsScreen from '@screens/tickets/TubeCoreDetailsScreen';
import ChamberDetailsScreen from '@screens/tickets/ChamberDetailsScreen';
// Optional foreground updater (keep if you use it)
import './src/utils/BackgroundUpdate/Forground';
// Siren helpers
import { ensureAllSirenChannel, displayWithSiren } from './src/utils/AllSiren';
// Disable font scaling (optional)
Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;
// Ensure siren channel ASAP (Android)
if (Platform.OS === 'android') {
  ensureAllSirenChannel().catch(() => { });
}
// ✅ TOP-LEVEL BACKGROUND HANDLER (runs for DATA-ONLY pushes)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  try {
    const n = (remoteMessage && remoteMessage.notification) || {};
    const d = (remoteMessage && remoteMessage.data) || {};
    // Log to verify BG execution (use `adb logcat | grep RNFirebase` on Android)
    console.log('[BG] FCM received:', { title: n.title || d.title, hasData: !!remoteMessage?.data });
    // Show our own local Notifee with siren
    await ensureAllSirenChannel(); // no-op on iOS
    await displayWithSiren({
      title: n.title || d.title || 'Alert',
      body: n.body || d.body || '',
      data: d,
    });
  } catch (e) {
    // never crash in bg
  }
});
// Notifee background events (press, etc.)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  try {
    if (type === EventType.PRESS) {
      // handle deep link via detail.notification?.data if needed
    }
  } catch (e) { }
});

// Foreground service stub (optional)
notifee.registerForegroundService(() => {
  return new Promise(async resolve => {
    try {
      // long-running work if needed
    } finally {
      resolve();
    }
  });
});

AppRegistry.registerComponent(appName, () => App);