/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟤𝟛@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 @ services/OfflineSyncService.js
*/
import {APIs, URLs} from '@apis';
import NetInfo from '@react-native-community/netinfo';
import {Common, Preferences, Voice} from '@utils';
import {AppState} from 'react-native';

// Singleton to manage offline sync
let intervalId = null;
let appStateSubscription = null;
let netInfoUnsubscribe = null;
let isSyncServiceRunning = false;

let isAlreadyRequested = 0;
const syncOfflineRequests = async () => {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    return;
  }

  const patrollerTaskData = Preferences.getData('SUBMIT_TASK_DATA');
  const attData = Preferences.getData('OFFLINE_ATTENDANCE');

  if (patrollerTaskData?.length > 0) {
    isAlreadyRequested += 1;
    try {
      if (isAlreadyRequested <= 1) {
        const taskRes = await APIs.postRequestWithJson({
          path: URLs.submitDailyReport,
          isAuth: true,
          checkNetSpeed: true,
          params: patrollerTaskData,
        });
        Common.success('Task Synced Successfully', taskRes);
        if (taskRes?.status === 200 && taskRes?.success) {
          Common.showToast('Task Synced Successfully');
          Voice.speak('अपका ऑफलाइन सबमिट किया हुआ डेटा सिंक हो चुका है।');
          Preferences.removeData('SUBMIT_TASK_DATA');
          isAlreadyRequested = 0;
        }
      }
    } catch (error) {
      isAlreadyRequested = 0;
      Common.error('Error in Task Sync', error);
    }
  }

  if (attData?.length > 0) {
    try {
      let param = [];
      attData?.map(item => {
        param.push(item.params);
      });
      const res = await APIs.postRequestWithJson({
        path: URLs.syncOfflineAttendance,
        params: {
          attendanceList: param,
        },
        isAuth: true,
      });
      if (res?.status === 200 && res.success) {
        Common.showToast('Attendance Offline data sync successfully to server');
        Voice.speak('अपका ऑफलाइन उपस्थिति डेटा सिंक हो चुका है।');
        Preferences.removeData('OFFLINE_ATTENDANCE');
      } else {
        Common.log('Attendance Offline data sync failed to server', res);
      }
    } catch (error) {
      Common.error('Error in Attendance Sync', error);
    }
  }
};

export const startOfflineSync = () => {
  if (isSyncServiceRunning) {
    Common.log('Offline sync already running, skipping initialization');
    return;
  }
  isSyncServiceRunning = true;

  // Start interval
  const startSyncInterval = () => {
    if (intervalId) {
      Common.log('Offline Sync Interval Alreaddy Runnning:', intervalId);
      // clearInterval(intervalId);
      return;
    }
    Common.success('App foregrounded, starting sync');
    intervalId = setInterval(() => {
      // Common.log('Interval Running...');
      syncOfflineRequests();
    }, 60000); // 60 seconds
  };

  // Stop interval
  const stopSyncInterval = () => {
    if (intervalId) {
      // Common.log('Stopping interval:', intervalId);
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  // Handle app state changes
  const handleAppStateChange = nextAppState => {
    if (nextAppState === 'active') {
      syncOfflineRequests(); // Immediate sync on foreground
      startSyncInterval();
    } else if (nextAppState.match(/inactive|background/)) {
      // Common.log('App backgrounded, stopping sync');
      // stopSyncInterval();
    }
  };

  // Initial sync
  syncOfflineRequests();
  startSyncInterval();

  // Subscribe to app state changes
  appStateSubscription = AppState.addEventListener(
    'change',
    handleAppStateChange,
  );

  // Subscribe to network changes
  netInfoUnsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      // Common.log('Internet restored, triggering sync');
      syncOfflineRequests();
    }
  });
};

export const stopOfflineSync = () => {
  if (!isSyncServiceRunning) {
    Common.log('Offline sync not running, nothing to stop');
    return true;
  }
  Common.error('Stopping offline sync service');
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = null;
  }
  isSyncServiceRunning = false;
};
