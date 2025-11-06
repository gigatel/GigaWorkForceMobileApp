import { APIs, URLs } from '@apis';
import { goBack } from '@navigation/services';
import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { DataType } from '@types';
import { Common, Location, Preferences } from '@utils';

const TASK = 'task';
const taskAdapter = createEntityAdapter();

export const getPatrollerTaskAssinmentApi = createAsyncThunk(
  `${TASK}/getPatrollerTaskAssinment`, async (params: any, thunkAPI) => {


    try {
      console.log('2data',params.param)
      const isNet = await APIs.checkNetworkBeforeRequest(true);
      const offRes = Preferences.getData('OFFLINE_PATROLLER_TASK_DATA');
      // Common.error('RES', offRes);
      const now = Date.now();
      const isValidCache = offRes && typeof offRes === 'object' && offRes?.lastCalled && now - offRes?.lastCalled < offRes?.interval;

      if ((isValidCache && !params.isRefresh) || !isNet) {
        return offRes?.res;
      }
      const res = await APIs.postRequestWithJson({
        path: URLs.getTaskList,
        params: params.param ?? {},
        isAuth: true,
      });
      if (res?.status === 200 && res.success) {
        if (res?.data?.taskChamberList?.length <= 0 && res.data.chamberCount === 0) {
          Common.alert({
            title: 'Alert',
            msg: 'Your task has not assigned yet. Please ask your team to assign task.\n\nआपका कार्य अभी तक असाइन नहीं किया गया है। कृपया अपनी टीम को कार्य सौंपने के लिए कहें',
            onPress: () => goBack(),
          });
        }
        Preferences.setData('OFFLINE_PATROLLER_TASK_DATA', {
          res,
          interval: 12 * 60 * 60 * 1000, // 8 hours,
          lastCalled: now,
        });
        return res;
      } else if (res?.status === 200 && !res?.success) {
        Common.alert({
          title: 'Alert',
          msg: res?.message ?? 'Something went wrong in API Request!',
          onPress: () => goBack(),
        });
        thunkAPI.rejectWithValue(res);
      }
      else {
        Common.alert({
          title: 'Error in API',
          msg: res?.message ?? 'Something went wrong in API Request!',
          onPress: () => goBack(),
        });
        thunkAPI.rejectWithValue(res);
      }
    } catch (error) {
      thunkAPI.rejectWithValue(error);
    }
  }
);
// Get Chamber Issue List API
export const getChamberIssueListApi = createAsyncThunk(
  `${TASK}/getChamberIssueList`, async (params: any, thunkAPI) => {
    try {
            console.log('1data')

      const offRes = Preferences.getData('OFFLINE_CHMABER_ISSUE_LIST');
      const now = Date.now();
      const isValidCache = offRes && typeof offRes === 'object' && offRes?.lastCalled && now - offRes?.lastCalled < offRes?.interval;
      if (isValidCache && !params?.isRefresh) {
        return offRes?.res;
      }
      const res = await APIs.getRequestWithQuery({
        path: URLs.getTypeOfWorkDD,
        params: params?.params ?? '',
        isAuth: true,
      });
      if (res?.status === 200 && res.success) {
        Preferences.setData('OFFLINE_CHMABER_ISSUE_LIST', {
          res,
          interval: 12 * 60 * 60 * 1000, // 8 hours,
          lastCalled: now,
        });
        return res;
      } else {
        thunkAPI.rejectWithValue(res);
      }
    } catch (error) {
      thunkAPI.rejectWithValue(error);
    }
  }
);
// Submit Patroller Task Api
export const submitPatrollerTaskApi = createAsyncThunk(
  `${TASK}/submitPatrollerTask`, async (params: any, thunkAPI) => {
    try {
                  console.log('3data')
      const res = await APIs.postRequestWithJson({
        path: URLs.submitDailyReport,
        params: params ?? {},
        isAuth: true,
        timeout: 15000,
      });

      if (res?.status === 200 && res.success) {
        return res;
      } else {
        Common.alert({
          title: 'Error in API',
          msg: res?.message ?? 'Something went wring in API Request!',
        });
        thunkAPI.rejectWithValue(res);
      }
    } catch (error) {
      console.log('submitPatrollerTaskApi', error);
      return thunkAPI.rejectWithValue(error);
    }
  }
);

interface TaskState {
  taskListLoading: DataType.LoadingType
  chamberIssueLoading: DataType.LoadingType
  submitTaskLoading: DataType.LoadingType
  taskListData: DataType.PatrollerTask | null
  chamberIssueData: DataType.IdName[] | null
  submitTaskData: null
  isAllTaskSubmitted: boolean
}

const initialState: TaskState = taskAdapter.getInitialState({
  taskListLoading: 'idel',
  chamberIssueLoading: 'idel',
  submitTaskLoading: 'idel',
  taskListData: null,
  chamberIssueData: null,
  submitTaskData: null,
  isAllTaskSubmitted: false,
});

const taskSlice = createSlice({
  name: TASK,
  initialState,
  reducers: {
    clearChamberTaskData: (state) => {
      state.taskListData = null;
      state.isAllTaskSubmitted = false;
      Preferences.removeData('OFFLINE_PATROLLER_TASK_DATA');
    },
    updateSubmitPatrollerTask: (state, action) => {
      Common.log('Task Submit Start');
      if (!action.payload?.chamberId) {
        Common.warn('Invalid payload: chamberId missing', action.payload);
        return;
      }
      if (!state.taskListData?.taskChamberList) {
        Common.warn('Invalid state: taskListData or taskChamberList missing', state.taskListData);
        return;
      }
      const findTask = state.taskListData.taskChamberList.find(
        (item) => item.chamberId === action.payload.chamberId
      );
      Common.log('FIND TASK::', findTask);
      if (!findTask) {
        Common.log('No tasks found for chamberId:', action.payload.chamberId);
        return;
      }
      Common.log('Task Submit Middle');
      // Update successTaskChamberList
      if (state.taskListData.successTaskChamberList) {
        state.taskListData.successTaskChamberList = [
          ...state.taskListData.successTaskChamberList,
          findTask,
        ];
      } else {
        state.taskListData.successTaskChamberList = [findTask]; // Initialize as array
      }
      // Remove tasks from taskChamberList
      state.taskListData.taskChamberList = state.taskListData.taskChamberList.filter(
        (item) => item.chamberId !== action.payload.chamberId
      );




      const res = Preferences.getData('OFFLINE_PATROLLER_TASK_DATA');
      // Common.warn('OFFLINE_PATROLLER_TASK_DATA SLICE', res);
      Preferences.setData('OFFLINE_PATROLLER_TASK_DATA', {
        ...res,
        res: {
          data: {
            ...res.res.data,
            taskChamberList: state.taskListData.taskChamberList,
            successTaskChamberList: state.taskListData.successTaskChamberList,
          },
        },
      });
      if (state.taskListData && state.taskListData?.successTaskChamberList.length >= state.taskListData?.chamberCount) {
        state.isAllTaskSubmitted = true;
      } else {
        state.isAllTaskSubmitted = false;
      }
      Common.log('Task Submit End');
    },

    updateChamberTaskListDistance: (state, action) => {
      Common.log('Task Distance Start');

      const lat = action.payload.lat ?? 0;
      const lng = action.payload.lng ?? 0;

      const taskDataWithDistance = state.taskListData?.taskChamberList?.map((item: DataType.Chamber) => {
        const chamberLat = parseFloat(item?.chamberLat);
        const chamberLong = parseFloat(item?.chamberLong);

        // Default fallback distance
        let distance = 999999;

        // Validate and calculate distance safely
        if (!isNaN(chamberLat) && !isNaN(chamberLong)) {
          try {
            distance = Location.calculateDistance(chamberLat, chamberLong, lat, lng, 'm');
          } catch (error) {
            Common.log(`Distance calculation failed for chamber ID ${item.chamberId}: ${error}`);
          }
        } else {
          Common.log(`Invalid coordinates for chamber ID ${item.chamberId}: lat=${item.chamberLat}, lng=${item.chamberLong}`);
        }

        // Common.log(`Task Distance Updated for chamber ${item.chamberId}: ${distance} meters`);

        return {
          ...item,
          distance,
        };
      });

      // Common.log('Task Distance Middle');

      // Update state with sorted chamber list
      if (state.taskListData && taskDataWithDistance) {
        state.taskListData = {
          ...state.taskListData,
          taskChamberList: [...taskDataWithDistance].sort((a, b) => a.distance - b.distance),
        };
      }

      // Common.log('Task Distance End');
    },
    updateCompletedChamberStatus: (state) => {
      state.isAllTaskSubmitted = false;
    },
  },
  extraReducers: builder => {
    // PAtroller Task List
    builder.addCase(getPatrollerTaskAssinmentApi.pending, state => {
      state.taskListLoading = 'pending';
    });
    builder.addCase(getPatrollerTaskAssinmentApi.fulfilled, (state, action) => {
      state.taskListLoading = 'fulfilled';
      const lat = action.meta.arg.param.lat ?? 0;
      const lng = action.meta.arg.param.lng ?? 0;

      // console.log('getPatrollerTaskAssinmentApi', action.payload?.data);
      const taskDataWithDistance = action.payload?.data?.taskChamberList.map((item: DataType.Chamber) => {
        const chamberLat = parseFloat(item?.chamberLat);
        const chamberLong = parseFloat(item?.chamberLong);

        // Ensure valid coordinates before calculating distance
        const distance = !isNaN(chamberLat) && !isNaN(chamberLong) && lat !== undefined && lng !== undefined
          ? Location.calculateDistance(chamberLat, chamberLong, lat, lng, 'm')
          : parseInt(item.distance + '', 10); // or a default value like 0
        return {
          ...item,
          distance,
        };

      });

      // Ensure deep copy to avoid mutating original state
      if (state.taskListData?.taskChamberList) {
        state.taskListData = {
          ...state.taskListData,
          taskChamberList: [...taskDataWithDistance],
        };
      } else {
        state.taskListData = action.payload?.data ?? null;
      }
      if (state.taskListData && state.taskListData?.successTaskChamberList.length >= state.taskListData?.chamberCount) {
        state.isAllTaskSubmitted = true;
      } else {
        state.isAllTaskSubmitted = false;
      }
    });
    builder.addCase(getPatrollerTaskAssinmentApi.rejected, (state) => {
      state.taskListLoading = 'rejected';
    });

    // Get Chamber Issue List Api
    builder.addCase(getChamberIssueListApi.pending, state => {
      state.chamberIssueLoading = 'pending';
    });
    builder.addCase(getChamberIssueListApi.fulfilled, (state, action) => {
      state.chamberIssueLoading = 'fulfilled';
      state.chamberIssueData = action.payload?.data ?? [];
    });
    builder.addCase(getChamberIssueListApi.rejected, (state) => {
      state.chamberIssueLoading = 'rejected';
    });
    // Submit Patroller Task Api
    builder.addCase(submitPatrollerTaskApi.pending, state => {
      state.submitTaskLoading = 'pending';
    });
    builder.addCase(submitPatrollerTaskApi.fulfilled, (state, action) => {
      state.submitTaskLoading = 'fulfilled';
      state.submitTaskData = action.payload?.data ?? null;
    });
    builder.addCase(submitPatrollerTaskApi.rejected, (state) => {
      state.submitTaskLoading = 'rejected';
    });
  },
});

export const taskReducer = taskSlice.reducer;
export const {
  updateSubmitPatrollerTask,
  updateChamberTaskListDistance,
  updateCompletedChamberStatus,
  clearChamberTaskData,
} = taskSlice.actions;
