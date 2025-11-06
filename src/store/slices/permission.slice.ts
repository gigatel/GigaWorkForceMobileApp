import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { Common, Preferences } from '@utils';
import { Platform } from 'react-native';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

const PERMISSION = 'permission';
const permissionAdapter = createEntityAdapter();


const checkPermission = async (type: string) => {
  let permission;
  if (Platform.OS === 'android') {
    if (type === 'camera') {
      permission = await check(PERMISSIONS.ANDROID.CAMERA);
    }
  } else if (Platform.OS === 'ios') {
    if (type === 'camera') {
      permission = await check(PERMISSIONS.IOS.CAMERA);
    }
  } else {
    Common.showToast('Platform not supported!');
  }
  if (permission === RESULTS.DENIED) {
    return await requestPermission(type);
  }
  return permission;
};
const requestPermission = async (type: string) => {
  let permission;
  if (Platform.OS === 'android') {
    if (type === 'camera') {
      permission = await request(PERMISSIONS.ANDROID.CAMERA);
    }
  }
  else if (Platform.OS === 'ios') {
    if (type === 'camera') {
      permission = await request(PERMISSIONS.IOS.CAMERA);
    }
  }

  return permission;
};



export const checkLocationPermission = createAsyncThunk(
  `${PERMISSION}/checkLocationPermission`,
  async (_, thunkAPI) => {
    try {
      return (Preferences.getData('ALLOWED_ACCESS_FOR_LOCATION_BACKGROUND') === 'yes');
    } catch (error) {
      return thunkAPI.rejectWithValue('denied');
    }
  },
);

export const checkCameraPermission = createAsyncThunk(
  `${PERMISSION}/checkCameraPermission`,
  async (_, thunkAPI) => {
    try {
      const res = await checkPermission('camera');
      return res;
    } catch (error) {
      return thunkAPI.rejectWithValue('denied');
    }
  },
);

const initialState = permissionAdapter.getInitialState({
  loading: 'idel',
  location: false,
  camera: '',
});

const permissionSlice = createSlice({
  name: PERMISSION,
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(checkLocationPermission.pending, (state,) => {
      state.loading = 'pending';
    });
    builder.addCase(checkLocationPermission.fulfilled, (state, action) => {
      state.loading = 'fulfilled';
      state.location = action.payload ?? false;
    });
    builder.addCase(checkLocationPermission.rejected, (state,) => {
      state.loading = 'rejected';
      state.location = false;
    });
    //! Camera
    builder.addCase(checkCameraPermission.pending, (state,) => {
      state.loading = 'pending';
    });
    builder.addCase(checkCameraPermission.fulfilled, (state, action) => {
      state.loading = 'fulfilled';
      state.camera = action.payload ?? '';
    });
    builder.addCase(checkCameraPermission.rejected, (state,) => {
      state.loading = 'rejected';
      state.camera = 'denied';
    });
  },

});

export const permissionReducer = permissionSlice.reducer;
