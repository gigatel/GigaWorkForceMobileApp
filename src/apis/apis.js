/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
*/
import {Common, Preferences} from '@utils';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import {CONSTANT} from '@res';
import {BASE_URL} from './urls';
import {Alert} from 'react-native';
import {resetStore} from '@reducers';
import {store} from '../store/store';
import {reset} from '@navigation/services';
const TIMEOUT = 120000;
const axiosInstance = axios.create({
  timeout: TIMEOUT,
});
const toQueryString = (q) => {
  if (!q) return '';1
  if (typeof q === 'string') return q.startsWith('?') ? q : `?${q}`;
  const parts = [];
  Object.entries(q).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) {
      v.forEach((item) => {
        parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(item))}`);
      });
    } else {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  });
  return parts.length ? `?${parts.join('&')}` : '';
};
const standardizeError = (error, fallbackMessage = 'Request failed') => {
  if (axios.isCancel(error)) {
    return {
      message: 'Request cancelled',
      status: 0,
      success: false,
      data: null,
      cancelled: true,
    };
  }
  const status = error?.response?.status || error?.status || 500;
  const message =
    error?.response?.data?.message ||
    error?.message ||
    fallbackMessage;
  return { message, status, success: false, data: null };
};
const getAuthHeaders = async () => {
  const token = Preferences.getData('API_AUTH_TOKEN');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
export const logout = () => {
  Common.alert({
    title: 'Session Expired',
    msg: 'Please login again!',
    onPress: () => {
      Preferences.logout();
      store.dispatch(resetStore());
      reset('Login');
    },
  });
};
/**
 * Check connectivity (and optionally simple speed/ping)
 * @param {boolean} checkSpeed
 * @returns {Promise<boolean>}
 */
export const checkNetworkBeforeRequest = async (checkSpeed = false) => {
  const netInfo = await NetInfo.fetch();

  if (!netInfo.isConnected || netInfo.isInternetReachable === false) {
    Common.showToast('No Internet! Please check your connection.');
    return false;
  }

  if (!checkSpeed) return true;

  const startTime = Date.now();
  try {
    // lightweight connectivity probe
    await fetch('https://www.google.com/generate_204', { method: 'GET' });
    const ping = Date.now() - startTime;
    console.log('pingData:',{ping});
    

    if (ping > 1500) {
      Alert.alert('Slow Internet', 'Your connection is slow. Please try again later.');
      return false;
    }
    return true;
  } catch (err) {
    Alert.alert('Connection Issue', 'Unable to verify internet speed.');
    return false;
  }
};

/** Optional: basic response handler for non-2xx conditions we still receive */
const handleResponseSideEffects = (response) => {
  const { status } = response || {};
  if (status === 400) {
    Common.showToast('Something went wrong in API (400)');
  } else if (status === 401) {
    Common.showToast('Unauthorized');
  }
};

/** --------------------------------
 * Core Request Methods
 * ------------------------------- */

/**
 * GET with query already appended or built outside (`params` can be '?a=1' or '')
 */
export const getRequestWithQuery = async ({
  path,
  params = '',
  isAuth = false,
  checkNetSpeed = false,
  timeout = TIMEOUT,
}) => {
  const canSend = await checkNetworkBeforeRequest(checkNetSpeed);
  if (!canSend) {
    return Promise.reject({
      message: 'No Internet',
      status: 202,
      success: false,
      data: null,
    });
  }

  const url = `${path}${params}`;
  Common.log('GET | QUERY |', url);

  try {
    const headers = isAuth ? await getAuthHeaders() : {};
    console.log({headers});
    
    const response = await axiosInstance.get(url, { headers, timeout });
    Common.success(`GET | SUCCESS | ${path}`, response?.data);
    return response?.data;
  } catch (error) {
    Common.error('GET | ERROR', error?.message || error);
    // remove token on 401
    if ((error?.response?.status === 401) && isAuth) {
      await Preferences.removeData('API_AUTH_TOKEN');
    }
    throw standardizeError(error);
  }
};

export const postRequestWithQuery = async ({
  path,
  params = '',
  isAuth = true,
  checkNetSpeed = false,
  timeout = TIMEOUT,
}) => {
  const canSend = await checkNetworkBeforeRequest(checkNetSpeed);
  if (!canSend) {
    return {
      message: 'No Internet',
      status: 202,
      success: false,
      data: null,
    };
  }

  const url = `${path}${params}`;
  Common.log('POST | QUERY |', url);

  try {
    const headers = isAuth ? await getAuthHeaders() : {};
    const response = await axiosInstance.post(url, null, { headers, timeout });
    Common.success(`POST | QUERY | SUCCESS | ${path}`, response?.data);
    handleResponseSideEffects(response);
    return response?.data;
  } catch (error) {
    Common.error('POST | QUERY | ERROR', error?.message || error);
    if ((error?.response?.status === 401) && isAuth) {
      await Preferences.removeData('API_AUTH_TOKEN');
    }
    throw standardizeError(error);
  }
};
export const postRequestWithFormData = async ({
  path,
  body,
  params,
  isAuth = true,
  timeout = TIMEOUT,
  onUploadProgress, // <-- NEW
}) => {
  const form =
    body instanceof FormData
      ? body
      : params instanceof FormData
      ? params
      : new FormData();
  const url = `${path}`;
  Common.log('POST | FORM DATA |', url, form);
  try {
    const tokenHeaders = isAuth ? await getAuthHeaders() : {};
    const response = await axiosInstance.post(url, form, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...tokenHeaders,
      },
      timeout,
      onUploadProgress: (progressEvent) => {
        if (typeof onUploadProgress === 'function') {
          onUploadProgress({
            loaded: progressEvent && typeof progressEvent.loaded === 'number'
              ? progressEvent.loaded
              : 0,
            total: progressEvent && typeof progressEvent.total === 'number'
              ? progressEvent.total
              : undefined,
          });
        }
      },
    });
    Common.success(`POST | FORM | SUCCESS | ${path}`, response?.data);
    if (typeof handleResponseSideEffects === 'function') {
      handleResponseSideEffects(response);
    }
    return response?.data;
  } catch (error) {
    Common.error('POST | FORM | ERROR', error?.message || error);
    if (error?.response?.status === 401 && isAuth) {
      try {
        await Preferences.removeData('API_AUTH_TOKEN');
      } catch {}
    }
    return standardizeError(error);
    }
};





/**
 * POST JSON with query + body
 * @param {Object} options
 *  - path: string
 *  - query: string|object
 *  - body: object
 *  - isAuth: boolean
 *  - checkNetSpeed: boolean
 *  - timeout: number
 */
export const postRequestWithJsonWithBody = async ({
  path,
  query,
  params = {},   // ✅ new param support
  body = {},
  isAuth = true,
  checkNetSpeed = false,
  timeout = TIMEOUT,
  signal, // optional AbortSignal
}) => {
  const canSend = await checkNetworkBeforeRequest(checkNetSpeed);
  if (!canSend) {
    return Promise.reject({
      message: 'No Internet Connection!',
      status: 202,
      success: false,
      data: null,
    });
  }

  const url = `${path}${toQueryString(query)}`;
  Common.log('POST | JSON (query+body+params) |', url, body, params);

  try {
    const tokenHeaders = isAuth ? await getAuthHeaders() : {};
    const response = await axiosInstance.post(url, body, {
      headers: { 'Content-Type': 'application/json', ...tokenHeaders },
      params,   
      timeout,
      signal,  
    });
    Common.success(`POST | JSON (query+body+params) | SUCCESS | ${path}`, response?.data);
    handleResponseSideEffects(response);
    return response?.data;
  } catch (error) {
    Common.error('POST | JSON (query+body+params) | ERROR', error?.message || error);
    if ((error?.response?.status === 401) && isAuth) {
      Preferences.removeData('API_AUTH_TOKEN');
    }
    throw standardizeError(error);
  }
};



/**
 * Simple POST JSON (body only)
 */
export const postRequestWithJson = ({
  path,
  params = {},
  isAuth = true,
  checkNetSpeed = false,
  timeout = TIMEOUT,
}) => {
  return new Promise((resolve, reject) => {
    checkNetworkBeforeRequest(checkNetSpeed)
      .then(async (canSend) => {
        if (!canSend) {
          reject({
            message: 'No Internet Connection!',
            status: 202,
            success: false,
            data: null,
          });
          return;
        }

        const url = `${path}`;
        Common.log('POST | JSON |', url, params);

        try {
          const tokenHeaders = isAuth ? await getAuthHeaders() : {};
          axiosInstance
            .post(url, params, {
              headers: { 'Content-Type': 'application/json', ...tokenHeaders },
              timeout,
            })
            .then((response) => {
              Common.success(`POST | JSON | SUCCESS | ${path}`, response?.data);
              handleResponseSideEffects(response);
              resolve(response?.data);
            })
            .catch((error) => {
              Common.error('POST | JSON | ERROR', error?.message || error);
              if (error?.response?.status === 401 && isAuth) {
                Preferences.removeData('API_AUTH_TOKEN');
              }
              reject(standardizeError(error));
            });
        } catch (tokenError) {
          Common.error('TOKEN | ERROR', tokenError);
          reject({
            message: 'Failed to retrieve auth token',
            status: 500,
            success: false,
            data: null,
          });
        }
      })
      .catch((networkError) => {
        Common.error('NETWORK CHECK | ERROR', networkError);
        reject({
          message: 'Network check failed',
          status: 500,
          success: false,
          data: null,
        });
      });
  });
};

/** --------------------------------
 * Utilities
 * ------------------------------- */

/**
 * Reverse geocoding via Google Maps API
 */
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${CONSTANT.DIRECTION_API_KEY}`,
    );
    const json = await response.json();
    if (json.status === 'OK' && Array.isArray(json.results) && json.results.length > 0) {
      return json.results[0].formatted_address;
    } else {
      Common.error('Address not found');
      return null;
    }
  } catch (error) {
    Common.error('Error fetching address:', error?.message ?? '');
    return null;
  }
};

/** --------------------------------
 * Optional: Export a creator for CancelToken if you need to cancel requests
 * ------------------------------- */
export const createCancelToken = () => {
  const controller = new AbortController();
  return controller;
};
