/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */

import { APIs, URLs } from '@apis';
import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { DataType } from '@types';
import { Common } from '@utils';

const CHAMBER_COMPLAINT = 'chamberComplaint';
const chamberComplaintEntityAdapter = createEntityAdapter();

// Get Chamber Complaints
export const getChamberComplaintListApi = createAsyncThunk(
  `${CHAMBER_COMPLAINT}/chamberComplaints`,
  async (params: any, thunkAPI) => {
    try {
      const res = await APIs.postRequestWithJson({
        path: URLs.getChamberComplaintList,
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

// getChamberComplaintAlert
export const getChamberComplaintAlertApi = createAsyncThunk(
  `${CHAMBER_COMPLAINT}/chamberComplaintAlert`,
  async (params: string, thunkAPI) => {
    try {
      const res = await APIs.getRequestWithQuery({
        path: URLs.getChamberComplaintAlert,
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

// Get Nearest Chambers | getNearestChambers
export const getNearestChambersApi = createAsyncThunk(
  `${CHAMBER_COMPLAINT}/getNearestChambers`,
  async (params: string, thunkAPI) => {
    try {
      const res = await APIs.getRequestWithQuery({
        path: URLs.getNearestChambers,
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
      return thunkAPI.rejectWithValue(error);
    }
  });

// getChamberComplaintPriority
export const getChamberComplaintPriorityApi = createAsyncThunk(
  `${CHAMBER_COMPLAINT}/chamberComplaintPriority`,
  async (params: string, thunkAPI) => {
    try {
      const res = await APIs.getRequestWithQuery({
        path: URLs.getChamberComplaintPriority,
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

// getPrevNextChamberById
export const getPrevNextChamberByIdApi = createAsyncThunk(
  `${CHAMBER_COMPLAINT}/getPrevNextChamberById`,
  async (params: string, thunkAPI) => {
    try {
      const res = await APIs.getRequestWithQuery({
        path: URLs.getPrevNextChamberById,
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

//submitChamberComplaint
export const submitChamberComplaintApi = createAsyncThunk(
  `${CHAMBER_COMPLAINT}/submitChamberComplaint`,
  async (params: any, thunkAPI) => {
    try {
      const res = await APIs.postRequestWithJson({
        path: URLs.submitChamberComplaint,
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


interface ChamberComplaintStateType {
  complaintListLoading: DataType.LoadingType
  complaintListData: DataType.ChamberComplaint[]
  complaintTotalPage: number
  nearestChambersLoading: DataType.LoadingType
  nearestChambersData: DataType.NearestChamber[]
  chamberAlertLoading: DataType.LoadingType
  chamberAlertData: DataType.IdName[]
  chamberPriorityLoading: DataType.LoadingType
  chamberPriorityData: DataType.IdName[]
  nextChamberLoading: DataType.LoadingType
  nextChamberData: DataType.NearestChamber[]
  submitComplaintLoading: DataType.LoadingType
}

const initialState: ChamberComplaintStateType = chamberComplaintEntityAdapter.getInitialState({
  complaintListLoading: 'idel',
  complaintListData: [],
  complaintTotalPage: 1,
  nearestChambersLoading: 'idel',
  nearestChambersData: [],
  chamberAlertLoading: 'idel',
  chamberAlertData: [],
  chamberPriorityLoading: 'idel',
  chamberPriorityData: [],
  nextChamberLoading: 'idel',
  nextChamberData: [],
  submitComplaintLoading: 'idel',
});

const chamberComplaintSlice = createSlice({
  name: CHAMBER_COMPLAINT,
  initialState,
  reducers: {
    selectChamberComplaintAlerts: (state, action) => {
      state.chamberAlertData = state.chamberAlertData.map((item: any) => {
        if (item.id === action.payload.id) {
          return { ...item, isChecked: !action.payload.isChecked };
        } else {
          return item;
        }
      });
    },
    resetNextComplaintChambers: (state) => {
      state.nextChamberData = [];
    },
  },
  extraReducers: builder => {
    // Monthly Salary
    builder.addCase(getChamberComplaintListApi.pending, (state) => {
      state.complaintListLoading = 'pending';
    });
    builder.addCase(getChamberComplaintListApi.fulfilled, (state, action) => {
      state.complaintListLoading = 'fulfilled';

      const newData = action.payload?.data ?? [];
      const page = action.meta.arg.page;

      if (page === 1) {
        // First page — reset the list
        state.complaintListData = newData;
      } else {
        // Append new data to existing list
        const existingData = state.complaintListData ?? [];

        // Optional: avoid duplicates by ID (if needed)
        const combined = [...existingData, ...newData];

        // If needed, filter duplicates by unique key (like complaintId or id)
        // const uniqueData = Array.from(new Map(combined.map(item => [item.id, item])).values());

        state.complaintListData = combined;
      }

      // Set total page count
      const totalRecords = action?.payload?.recordsTotal ?? 0;
      state.complaintTotalPage = Math.ceil(totalRecords / 100) || 1;
    });
    builder.addCase(getChamberComplaintListApi.rejected, (state) => {
      state.complaintListLoading = 'rejected';
    });

    // Nearest Chambers
    builder.addCase(getNearestChambersApi.pending, (state) => {
      state.nearestChambersLoading = 'pending';
    });
    builder.addCase(getNearestChambersApi.fulfilled, (state, action) => {
      state.nearestChambersLoading = 'fulfilled';
      state.nearestChambersData = action.payload?.data ?? [];
    });
    builder.addCase(getNearestChambersApi.rejected, (state) => {
      state.nearestChambersLoading = 'rejected';
    });

    // Chamber Alerts
    builder.addCase(getChamberComplaintAlertApi.pending, (state) => {
      state.chamberAlertLoading = 'pending';
    });
    builder.addCase(getChamberComplaintAlertApi.fulfilled, (state, action) => {
      state.chamberAlertLoading = 'fulfilled';
      state.chamberAlertData = action.payload?.data?.map((item: any) => ({ ...item, isChecked: false })) ?? [];
    });
    builder.addCase(getChamberComplaintAlertApi.rejected, (state) => {
      state.chamberAlertLoading = 'rejected';
    });

    // Chamber Priority
    builder.addCase(getChamberComplaintPriorityApi.pending, (state) => {
      state.chamberPriorityLoading = 'pending';
    });
    builder.addCase(getChamberComplaintPriorityApi.fulfilled, (state, action) => {
      state.chamberPriorityLoading = 'fulfilled';
      state.chamberPriorityData = action.payload?.data ?? [];
    });
    builder.addCase(getChamberComplaintPriorityApi.rejected, (state) => {
      state.chamberPriorityLoading = 'rejected';
    });
    // getPrevNextChamberByIdApi
    builder.addCase(getPrevNextChamberByIdApi.pending, (state) => {
      state.nextChamberLoading = 'pending';
    });
    builder.addCase(getPrevNextChamberByIdApi.fulfilled, (state, action) => {
      state.nextChamberLoading = 'fulfilled';
      state.nextChamberData = action.payload?.data ?? [];
    });
    builder.addCase(getPrevNextChamberByIdApi.rejected, (state) => {
      state.nextChamberLoading = 'rejected';
    });
    // submitChamberComplaintApi
    builder.addCase(submitChamberComplaintApi.pending, (state) => {
      state.submitComplaintLoading = 'pending';
    });
    builder.addCase(submitChamberComplaintApi.fulfilled, (state) => {
      state.submitComplaintLoading = 'fulfilled';
    });
    builder.addCase(submitChamberComplaintApi.rejected, (state) => {
      state.submitComplaintLoading = 'rejected';
    });

  },
});

export const chamberComplaintReducer = chamberComplaintSlice.reducer;
export const { selectChamberComplaintAlerts, resetNextComplaintChambers } = chamberComplaintSlice.actions;
