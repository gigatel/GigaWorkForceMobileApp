/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */

import { APIs, URLs } from '@apis';
import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { DataType } from '@types';
import { Common } from '@utils';

const PAYROLL = 'payroll';
const payrollEntityAdapter = createEntityAdapter();

export const getEmpMonthlySalaryApi = createAsyncThunk(
  `${PAYROLL}/monthlySalary`,
  async (params: any, thunkAPI) => {
    try {
      const res = await APIs.postRequestWithJson({
        path: URLs.monthlyEmpSalary,
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

interface PayrollStateType {
  monthlySalLoading: DataType.LoadingType,
  monthlySalaryData: DataType.MonthlySalary | null
}

const initialState: PayrollStateType = payrollEntityAdapter.getInitialState({
  monthlySalLoading: 'idel',
  monthlySalaryData: null,
});

const payrollSlice = createSlice({
  name: PAYROLL,
  initialState,
  reducers: {},
  extraReducers: builder => {
    // Monthly Salary
    builder.addCase(getEmpMonthlySalaryApi.pending, (state) => {
      state.monthlySalLoading = 'pending';
    });
    builder.addCase(getEmpMonthlySalaryApi.fulfilled, (state, action) => {
      state.monthlySalLoading = 'fulfilled';
      state.monthlySalaryData = action.payload?.data?.[0] ?? null;
    });
    builder.addCase(getEmpMonthlySalaryApi.rejected, (state) => {
      state.monthlySalLoading = 'rejected';

    });
  },
});

export const payrolReducer = payrollSlice.reducer;
