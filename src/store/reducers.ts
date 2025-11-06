

import { combineReducers, UnknownAction } from 'redux';

import { store } from './store';
import { loginReducer } from './slices/login.slice';
import { permissionReducer } from './slices/permission.slice';
import { dashboardReducer } from './slices/dashboard.slice';
import { accountReducer } from './slices/account.slice';
import { attendanceReducer } from './slices/attendance.slice';
import { payrolReducer } from './slices/payroll.slice';
import { taskReducer } from './slices/task.slice';
import { deviceReducer } from './slices/device.slice';
import { chamberComplaintReducer } from './slices/chamber-complaint.slice';
import { leaveReducer } from './slices/leave.slice';
export const RESET_STORE = 'RESET_STORE';

export const resetStore = () => ({
  type: RESET_STORE,
});

const appReducer = combineReducers({
  login: loginReducer,
  permission: permissionReducer,
  dashboard: dashboardReducer,
  account: accountReducer,
  attendance: attendanceReducer,
  payroll: payrolReducer,
  task: taskReducer,
  device: deviceReducer,
  chamberComplaint: chamberComplaintReducer,
  leave: leaveReducer,
});
export const rootReducer = (
  state: RootState | undefined,
  action: UnknownAction,
): RootState => {
  if (action.type === RESET_STORE) {
    state = undefined;
  }
  return appReducer(state, action);
};

export type RootState = ReturnType<typeof appReducer>
export type StoreDispatch = typeof store.dispatch
