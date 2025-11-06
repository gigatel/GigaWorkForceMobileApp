import { APIs, URLs } from '@apis';
import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { DataType } from '@types';

const ACCOUNT = 'account';
const accountAdapter = createEntityAdapter();

//getAppModules
export const getAppModulesApi = createAsyncThunk(
  `${ACCOUNT}/getAppModulesApi`, async (params: string, thunkAPI) => {
    try {
      const res = await APIs.getRequestWithQuery({
        path: URLs.getAppModules,
        isAuth: true,
        params: params ?? '',
      });
      if (res.status === 200 && res.success) {
        return res;
      } else {
        thunkAPI.rejectWithValue(res);
      }
    } catch (error) {
      return thunkAPI.rejectWithValue(error);
    }
  },
);

interface AccountStateTypes extends DataType.Loading {
  appModules: DataType.AllowedModule | null;
}

const initialState: AccountStateTypes = accountAdapter.getInitialState({
  loading: 'idel',
  appModules: null,
});

const accountSlice = createSlice({
  name: ACCOUNT,
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(getAppModulesApi.pending, (state,) => {
      state.loading = 'pending';
    });
    builder.addCase(getAppModulesApi.fulfilled, (state, action) => {
      state.loading = 'fulfilled';
      state.appModules = action?.payload?.data ?? null;
    });
    builder.addCase(getAppModulesApi.rejected, (state,) => {
      state.loading = 'rejected';
    });

  },
});

export const accountReducer = accountSlice.reducer;
