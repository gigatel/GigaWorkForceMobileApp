
import { MMKV, Mode } from 'react-native-mmkv';
import { log } from './common';
import { Common } from '@utils';

const storage = new MMKV({
  id: 'gigatel-gtpl-mobileapp',
  mode: Mode.MULTI_PROCESS,
});

export const KEY = {
  LANGUAGE: 'LANGUAGE',
  ALLOWED_ACCESS_FOR_LOCATION_BACKGROUND: 'ALLOWED_ACCESS_FOR_LOCATION_BACKGROUND',
  FOREGROUND_SERVICE: 'FOREGROUND_SERVICE',
  FIRST_OPEN: 'FIRST_OPEN',
  PEM_KEY: 'PEM_KEY',
  PUBLIC_KEY: 'PUBLIC_KEY',
  API_AUTH_TOKEN: 'API_AUTH_TOKEN',
  LOGIN_RESPONSE: 'LOGIN_RESPONSE',
  LOGIN_POLICIES: 'LOGIN_POLICIES',
  PREF_BG_LAST_TS: 'PREF_BG_LAST_TS',
  OFFLINE_ATTENDANCE: 'OFFLINE_ATTENDANCE',
  USER_DATA:'USER_DATA',
  ORGANIZATION_ID:'ORGANIZATION_ID',
  ORGANIZATION_CODE:'ORGANIZATION_CODE',
  LOCATION_PERMISSION: 'LOCATION_PERMISSION',
  EMPLOYEE_OFFICE_BRANCHES: 'EMPLOYEE_OFFICE_BRANCHES',
  EMPLOYEE_ZONE_CHAMBERS: 'EMPLOYEE_ZONE_CHAMBERS',
  EMPLOYEE_WORKING_ON_BEHALF: 'EMPLOYEE_WORKING_ON_BEHALF',
  OFFLINE_DASHBOARD_LIST: 'OFFLINE_DASHBOARD_LIST',
  VIEW_ATTENDANCE_CALENDER: 'VIEW_ATTENDANCE_CALENDER',
  VIEW_ATTENDANCE_INOUT_REPORT: 'VIEW_ATTENDANCE_INOUT_REPORT',
  LAST_GEO_ADDRESS: 'LAST_GEO_ADDRESS',
  BG_POSTER_LAST_TS: 'BG_POSTER_LAST_TS',
  LAST_CHAMBER_GEO_ADDRESS: 'LAST_CHAMBER_GEO_ADDRESS',
  OFFLINE_TODAY_ATTENDANCE_DATA: 'OFFLINE_TODAY_ATTENDANCE_DATA',
  OFFLINE_TODAY_WORKING_BEHALKF_OF: 'OFFLINE_TODAY_WORKING_BEHALKF_OF',
  OFFLINE_CHAMBERS_DATA: 'OFFLINE_CHAMBERS_DATA',
  OFFLINE_BRANCHES_DATA: 'OFFLINE_BRANCHES_DATA',
  OFFLINE_PATROLLER_TASK_DATA: 'OFFLINE_PATROLLER_TASK_DATA',
  SUBMIT_TASK_DATA: 'SUBMIT_TASK_DATA',
  OFFLINE_CHMABER_ISSUE_LIST: 'OFFLINE_CHMABER_ISSUE_LIST',
  MARK_ATTENDANCE_STATUS: 'MARK_ATTENDANCE_STATUS',
  TILE_CACHE_PROGRESS: 'TILE_CACHE_PROGRESS',
  IS_MAP_DOWNLOADED: 'IS_MAP_DOWNLOADED',
  OFFLINE_EMPLOYEE_LIST_FOR_CONTACT: 'OFFLINE_EMPLOYEE_LIST_FOR_CONTACT',
  GOOGLE_MAPS_API_KEY: 'GOOGLE_MAPS_API_KEY',
  EMPLOYEE_ID: 'EMPLOYEE_ID',
  COMPANY_ID: 'COMPANY_ID',
  LAST_POST_TS: 'LAST_POST_TS',
  CACHE_KEY:'CACHE_KEY',
  FORCE_UPDATE_REQUIRED: 'FORCE_UPDATE_REQUIRED'

} as const;
export const OFFLINE_TODAY_WORKING_ON_BEHALF_PREFIX =
  'OFFLINE_TODAY_WORKING_BEHALKF_OF' as const;


export const logout = async () => {
  removeData('PEM_KEY');
  removeData('PUBLIC_KEY');
  removeData('API_AUTH_TOKEN');
  removeData('LOGIN_RESPONSE');
  removeData('LOGIN_POLICIES');
  removeData('OFFLINE_ATTENDANCE');
  removeData('LOCATION_PERMISSION');
  removeData('EMPLOYEE_OFFICE_BRANCHES');
  removeData('EMPLOYEE_ZONE_CHAMBERS');
  removeData('EMPLOYEE_WORKING_ON_BEHALF');
  removeData('OFFLINE_DASHBOARD_LIST');
  removeData('VIEW_ATTENDANCE_CALENDER');
  removeData('VIEW_ATTENDANCE_INOUT_REPORT');
  removeData('OFFLINE_TODAY_ATTENDANCE_DATA');
  removeData('PREF_BG_LAST_TS');
  removeData('OFFLINE_TODAY_WORKING_BEHALKF_OF');
  removeData('OFFLINE_CHAMBERS_DATA');
  removeData('OFFLINE_BRANCHES_DATA');
  removeData('OFFLINE_PATROLLER_TASK_DATA');
  removeData('SUBMIT_TASK_DATA');
  removeData('OFFLINE_CHMABER_ISSUE_LIST');
  removeData('MARK_ATTENDANCE_STATUS');
  removeData('TILE_CACHE_PROGRESS');
  removeData('BG_POSTER_LAST_TS');
  removeData('GOOGLE_MAPS_API_KEY');
  removeData('EMPLOYEE_ID');
  removeData('COMPANY_ID');
  removeData('LAST_POST_TS');
  removeData('FOREGROUND_SERVICE');
  removeData('CACHE_KEY');
  removeData('FORCE_UPDATE_REQUIRED');
  removeData('USER_DATA')
  removeData('ORGANIZATION_CODE');
  removeData('ORGANIZATION_ID');
  };
export type KeyType = keyof typeof KEY;
export type PreferenceKey =
  | KeyType
  | `${typeof OFFLINE_TODAY_WORKING_ON_BEHALF_PREFIX}${string}`;


export const setData = (key: PreferenceKey, value: any) => {
  try {
    storage.set(key, JSON.stringify(value));
  } catch (e) {
    log('Error in Set Data for ->', key, e);
  }
};

export const getData = (key: PreferenceKey) => {
  try {
    const jsonValue = storage.getString(key);
    if (!jsonValue) { return null; }
    return JSON.parse(jsonValue);
  } catch (e) {
    Common.error('Error in Get Data for ->', key, e);
    return null; // Return null on error
  }
};
export const removeData = async (key: PreferenceKey) => {
  try {
    storage.delete(key);
  } catch (e) {
    log('Error in Remove Data for ->', key, e);
  }
};
export const clearAll = async () => {
  try {
    storage.clearAll();
  } catch (e) {
    log('Error in Clear Data for ->', e);
  }
};
export const mmkvStorage = {
  setItem: (key: string, value: any) => {
    storage.set(key, value);
    return Promise.resolve(true);
  },
  getItem: (key: string) => {
    const value = storage.getString(key);
    return Promise.resolve(value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
    return Promise.resolve();
  },
};
