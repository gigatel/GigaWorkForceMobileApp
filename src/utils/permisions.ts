/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
import { PermissionsAndroid, Platform } from 'react-native';
import { error, log } from './common';

export async function requestStoragePermission() {
  if (Platform.OS !== 'android') {
    return {
      type: 'legacy',
      value: true,
    };
  }

  try {
    if (Platform.Version >= 33) {
      //! ✅ Android 13+ (API 33+): Request separate permissions for media files
      // log('✅ Android 13+ (API 33+): Request separate permissions for media files');
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
      ]);

      log('Permissions:', granted);
      return granted;
    }
    else if (Platform.Version >= 30) {
      // log('✅ Android 11+ (API 30-32): MANAGE_EXTERNAL_STORAGE (Must be granted manually)');
      //! ✅ Android 11+ (API 30-32): MANAGE_EXTERNAL_STORAGE (Must be granted manually)
      if (Platform.OS === 'android' && Platform.Version >= 30) {
        // log('Res Permission::', 'granted');
        return {
          type: 'manage',
          value: 'granted',
        };
      }
    }
    else {
      //! ✅ Android 10 and below
      // log('✅ Android 10 and below');
      const granted = await PermissionsAndroid.requestMultiple([PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE, PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE]);

      // log('Permissions Result:', granted);
      if (granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED && granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED) {
        return {
          type: 'legacy',
          value: true,
        };
      } else {
        return {
          type: 'legacy',
          value: false,
        };
      }
    }
  } catch (err) {
    error('Permission request error:', err);
    return {
      type: 'legacy',
      value: false,
    };
  }
}

export const requestPermission = async () => {

  try {
    const granted = await requestStoragePermission();
    if (granted) {
      // log('Permission granted');
      // Continue your process...
      return true;
    } else {
      log('Permission denied');
      return false;
    }
  } catch (err) {
    error('Permission err:', error);
    return false;
  }
};
