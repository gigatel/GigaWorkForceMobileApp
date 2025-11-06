import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';

/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝕂𝕦𝕞𝕒𝕣 ℙ𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚
 @ 𝔼𝕞𝕒𝕚𝕝: 𝕡𝕜𝕡𝕣𝕒𝕛𝕒𝕡𝕒𝕥𝕚𝟙𝟙𝟡𝟡𝟟@𝕘𝕞𝕒𝕚𝕝.𝕔𝕠𝕞
 */
const DEVICE = 'device';
const deviceAdapter = createEntityAdapter();

export interface DeviceSliceState {
  isGpsEnabled: boolean
  isNet: boolean
}

const intialState = deviceAdapter.getInitialState({
  isGpsEnabled: false,
  isNet: false,
});

const deviceSlice = createSlice({
  name: DEVICE,
  initialState: intialState,
  reducers: {
    updateGpsStatus: (state, action) => {
      state.isGpsEnabled = action.payload;
    },
    updateNetStatus: (state, action) => {
      state.isNet = action.payload;
    },
  },

});

export const deviceReducer = deviceSlice.reducer;
export const { updateGpsStatus, updateNetStatus } = deviceSlice.actions;
