/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */

import { APIs, URLs } from '@apis';
import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { DataType } from '@types';
import { Common } from '@utils';

const LEAVE = 'leave';
const leaveEntityAdapter = createEntityAdapter();

export const getLeaveStatusApi = createAsyncThunk(
  `${LEAVE}/leaveStatus`,
  async (params: any, thunkAPI) => {
    try {

      const res = await APIs.postRequestWithJson({
        path: URLs.leaveStatus,
        params: params,
        isAuth: true,
      });

      if (res?.status === 200 && res?.success) {
        return res;
      } else {
        Common.alert({
          title: 'Alert',
          msg: res?.message,
        });
        thunkAPI.rejectWithValue(res);
      }
    } catch (error) {
      thunkAPI.rejectWithValue(error);
    }
  });

// Holiday List
export const getHolidayListApi = createAsyncThunk(
  `${LEAVE}/getHolidayList`,
  async (params: any, thunkAPI) => {
    try {

      const res = await APIs.getRequestWithQuery({
        path: URLs.getHolidayList,
        params: '',
        isAuth: true,
      });

      if (res?.status === 200 && res?.success) {
        return res;
      } else {
        Common.alert({
          title: 'Alert',
          msg: res?.message,
        });
        thunkAPI.rejectWithValue(res);
      }
    } catch (error) {
      thunkAPI.rejectWithValue(error);
    }
  });

// Apply Optional Holiday
export const applyOptionalHolidayApi = createAsyncThunk(
  `${LEAVE}/applyOptionalHoliday`,
  async (params: any, thunkAPI) => {
    try {

      const res = await APIs.postRequestWithJson({
        path: URLs.insertUpdateEmpHolidayRequest,
        params: params,
        isAuth: true,
      });

      if (res?.status === 200 && res?.success) {
        Common.alert({
          title: 'Success',
          msg: 'Leave Applied Successfully.',
        });
        return res;
      } else {
        Common.alert({
          title: 'Alert',
          msg: res?.message,
        });
        thunkAPI.rejectWithValue(res);
      }
    } catch (error) {
      thunkAPI.rejectWithValue(error);
    }
  });


interface PayrollStateType {
  leaveStatusLoading: DataType.LoadingType,
  leaveStatusData: DataType.LeaveStatus[]
  holidayListLoading?: DataType.LoadingType,
  holidayListData?: DataType.HolidayList[] | []
  applyHolidayLoading: DataType.LoadingType
}

const initialState: PayrollStateType = leaveEntityAdapter.getInitialState({
  leaveStatusLoading: 'idel',
  leaveStatusData: [],
  holidayListLoading: 'idel',
  holidayListData: [],
  applyHolidayLoading: 'idel',
});

const leaveSlice = createSlice({
  name: LEAVE,
  initialState,
  reducers: {},
  extraReducers: builder => {
    // Leave Status
    builder.addCase(getLeaveStatusApi.pending, (state) => {
      state.leaveStatusLoading = 'pending';
    });
    builder.addCase(getLeaveStatusApi.fulfilled, (state, action) => {
      state.leaveStatusLoading = 'fulfilled';
      state.leaveStatusData = action.payload?.data ?? [];
    });
    builder.addCase(getLeaveStatusApi.rejected, (state) => {
      state.leaveStatusLoading = 'rejected';
    });
    // Holiday List
    builder.addCase(getHolidayListApi.pending, (state) => {
      state.holidayListLoading = 'pending';
    }
    );
    builder.addCase(getHolidayListApi.fulfilled, (state, action) => {
      state.holidayListLoading = 'fulfilled';
      state.holidayListData = action.payload?.data ?? [];
    }
    );
    builder.addCase(getHolidayListApi.rejected, (state) => {
      state.holidayListLoading = 'rejected';
    }
    );
    // Apply Optional Holiday
    builder.addCase(applyOptionalHolidayApi.pending, (state) => {
      state.applyHolidayLoading = 'pending';
    }
    );
    builder.addCase(applyOptionalHolidayApi.fulfilled, (state,) => {
      state.applyHolidayLoading = 'fulfilled';
    }
    );
    builder.addCase(applyOptionalHolidayApi.rejected, (state) => {
      state.applyHolidayLoading = 'rejected';
    }
    );
  },
});

export const leaveReducer = leaveSlice.reducer;
