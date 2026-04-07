import { APIs, URLs } from '@apis';
import { goBack } from '@navigation/services';
import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { DataType } from '@types';
import { Common, Preferences } from '@utils';
import { clearChamberTaskData } from './task.slice';
import { log } from 'src/utils/common';
import { OFFLINE_TODAY_WORKING_ON_BEHALF_PREFIX, type PreferenceKey } from './../../utils/preferences';
const ATTENDANCE = 'attendance';
const PROJECT = 'project';
const attendanceAddapter = createEntityAdapter();
const checkOfflineData = async <T = any>(key: Preferences.PreferenceKey): Promise<T | null> => {
  const isNetOn = await Common.getNetConnection();
  if (!isNetOn) {
    Common.showToast('No Internet! Showing Offline Data');
    return Preferences.getData(key) as T | null;
  }
  return null;
};
/* =========================  
   Types for Project List API
   ========================= */
type QueryValue = string | number | boolean | null | undefined;
export interface ProjectListArgs {
  query?: Record<string, QueryValue>;
  params?: Record<string, QueryValue>;
  body?: Record<string, any>;
}
export interface PostLocationArgs {
  query?: Record<string, QueryValue>;
  params?: Record<string, QueryValue>;
  body?: Record<string, any>;
}

export interface ApiSuccess<T> {
  status: number;
  success: boolean;
  message?: string;
  data: T;
}

export interface ApiError {
  status?: number;
  success?: false;
  message?: string;
  data?: any;
}
export type InsertUpdateProjectPathArgs = {
  projectId: string | number;
  latLng?: string;            // fallback string
  latLngFileUri?: string;     // file uri for WKT text file
  directionResult?: string;   // '' from caller
  video?: { uri: string; name?: string; type?: string } | any;
};
// Normalize any incoming latLng string to a WKT LINESTRING with lon first.
// - Accepts already-WKT strings (kept as-is, but ensures >=2 pairs)
// - Accepts "lat,lng|lat,lng|..." and converts to "LINESTRING (lng lat, ...)"
// keep this near the top of attendance.slice.ts
// Parse: "LINESTRING (lng lat, lng lat, ...)" -> Array<{latitude, longitude}>
const parseWktLineString = (wkt?: string) => {
  const coords: Array<{ latitude: number; longitude: number }> = [];
  if (!wkt || typeof wkt !== 'string') return coords;

  const m = wkt.trim().match(/^LINESTRING\s*\((.*)\)\s*$/i);
  if (!m) return coords;
  const inside = m[1];
  for (const pair of inside.split(',')) {
    const [lngStr, latStr] = pair.trim().split(/\s+/);
    const lng = Number(lngStr);
    const lat = Number(latStr);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      coords.push({ latitude: lat, longitude: lng });
    }
  }
  return coords;
};


const normalizeLatLngToWKT = (input?: string): string => {
  if (!input || typeof input !== 'string') return '';
  const s = input.trim();
  if (/^LINESTRING\s*\(/i.test(s)) {
    const inside = s.match(/\((.*)\)/)?.[1] ?? '';
    const pairs = inside.split(',').map(t => t.trim()).filter(Boolean);
    if (pairs.length === 1) return `LINESTRING (${pairs[0]}, ${pairs[0]})`;
    return s;
  }
  const parts = s.split(/[|;\n]/);
  const out: string[] = [];
  for (const p of parts) {
    const cleaned = p.replace(/[()]/g, '').trim();
  
    if (!cleaned) continue;
    const hasComma = cleaned.includes(',');
    const [a, b] = (hasComma ? cleaned.split(',') : cleaned.split(/\s+/)).map(x => x.trim());
    const lat = Number(a), lng = Number(b);
    if (Number.isFinite(lat) && Number.isFinite(lng)) out.push(`${lng} ${lat}`); // lon lat
  }
  if (out.length === 1) out.push(out[0]);
  return out.length >= 2 ? `LINESTRING (${out.join(', ')})` : '';
};
// Selector to get parsed coords for a projectId
export const selectProjectPathCoords = (
  state: any,
  projectId: string | number
): Array<{ latitude: number; longitude: number }> => {
  const pid = String(projectId);
  return state?.attendance?.projectPathById?.[pid]?.coords ?? [];
};
// Get Employee List For Contact
export const getEmployeeListForContactApi = createAsyncThunk(
  `${ATTENDANCE}/getEmployeeListForContactApi`,
  async (params: any, thunkApi) => {
    try {
      const localContact = Preferences.getData('OFFLINE_EMPLOYEE_LIST_FOR_CONTACT');
      if (!params?.refresh && localContact) {
        return localContact;
      }
      const res = await APIs.getRequestWithQuery({
        path: URLs.getEmployeeListForContact,
        params: '',
        isAuth: true,
      });
      if (res?.status === 200 && res.success) {
        const sorted = res?.data?.sort((a: DataType.EmployeeDetails, b: DataType.EmployeeDetails) => {
          const aFirst = a.firstName ?? '';
          const bFirst = b.firstName ?? '';
          return aFirst.localeCompare(bFirst, undefinedAttendanceDashboard, { sensitivity: 'base' });
        });
        Preferences.setData('OFFLINE_EMPLOYEE_LIST_FOR_CONTACT', sorted);
        return sorted;
      } else {
        thunkApi.rejectWithValue(res);
      }
    } catch (error) {
      thunkApi.rejectWithValue(error);
    }
  },
);
export const getprojectPathApi = createAsyncThunk<
  { projectId: string; wkt: string; coords: Array<{ latitude: number; longitude: number }> },
  { projectId: string | number; refresh?: boolean },
  { state: any; rejectValue: ApiError }
>(
  `${PROJECT}/GetProjectApprovePath`,
  async ({ projectId, refresh }, thunkApi) => {
    try {
      // console.log('getProjectPathListApi');
      const pid = String(projectId);
      const isNetOn = await Common.getNetConnection();

      const state = thunkApi.getState();
      const existing = state?.attendance?.projectPathById?.[pid];
      if (!isNetOn && existing?.wkt) {
        return { projectId: pid, wkt: existing.wkt, coords: existing.coords ?? parseWktLineString(existing.wkt) };
      }
      if (!isNetOn && !existing?.wkt) {
        const err: ApiError = {
          status: 0,
          success: false,
          message: 'Offline and no cached project path available',
          data: { projectId: pid }, 
        };
        return thunkApi.rejectWithValue(err);
      }
      // 2) Fetch fresh (if online, or refresh requested)
      if (isNetOn || refresh) {
        const res = await APIs.getRequestWithQuery({
          path: `http://mob.gigatel.me:40701/api/Project/GetProjectApprovePath?projectId=${pid}`,
          params: '',
          isAuth: true,
        });
        const status = Number(res?.status ?? 0);
        const success = !!res?.success;
        const wkt = (res?.data ?? '') as string;
        if (status === 200 && success && typeof wkt === 'string') {
          const coords = parseWktLineString(wkt);
          return { projectId: pid, wkt, coords };
        }
        const err: ApiError = {
          status,
          success: false,
          message: res?.message ?? 'Failed to fetch project path',
          data: res?.data,
        };
        return thunkApi.rejectWithValue(err);
      }
      const err: ApiError = {
        status: 0,
        success: false,
        message: 'Unknown state while fetching project path',
      };
      return thunkApi.rejectWithValue(err);
    } catch (error: any) {
      const err: ApiError = {
        status: error?.status ?? error?.response?.status,
        success: false,
        message: error?.message ?? 'Network/unknown error',
        data: error?.data ?? error?.response?.data,
      };
      return thunkApi.rejectWithValue(err);
    }
  }
);
//viewAttendanceApi
export const viewAttendanceApi = createAsyncThunk(
  `${ATTENDANCE}/viewAttendanceApi`,
  async (params: any, thunkApi) => {
    try {
      const offData = await checkOfflineData('VIEW_ATTENDANCE_CALENDER');
      if (offData) {
        return offData;
      }
      const param = params ?? {};
      const res = await APIs.postRequestWithJson({
        path: URLs.viewAttendance,
        params: param,
        isAuth: true,

      });
      if (res?.status === 200 && res.success) {

        Preferences.setData('VIEW_ATTENDANCE_CALENDER', res);
        return res;
      } else {
        thunkApi.rejectWithValue(res);
      }
      return res;
    } catch (error) {
      thunkApi.rejectWithValue(error);
    }
  },  
);
//viewAttendanceInOutReportApi
export const viewAttendanceInOutReportApi = createAsyncThunk(
  `${ATTENDANCE}/viewAttendanceInOutReport`,
  async (params: any, thunkApi) => {
    try {
      const offRes = Preferences.getData('VIEW_ATTENDANCE_INOUT_REPORT');
      const now = Date.now();
      const isValidCache = offRes && typeof offRes === 'object' && offRes?.lastCalled && now - offRes?.lastCalled < offRes?.interval;
      if (isValidCache) {
        return offRes?.res;
      }

      const param = params ?? {};
      const res = await APIs.postRequestWithJson({
        path: URLs.viewAttendanceInOutReport,
        params: param,
        isAuth: true,
      });
      if (res?.status === 200 && res.success) {
        Preferences.setData('VIEW_ATTENDANCE_INOUT_REPORT', {
          res: res?.attendanceInOutList,
          interval: 0,//8 * 60 * 60 * 1000, // 8 hours,
          lastCalled: now,
        });
        return res?.attendanceInOutList;
      } else {
        thunkApi.rejectWithValue(res);
      }
      return res;
    } catch (error) {
      thunkApi.rejectWithValue(error);
    }
  },

);
//getTodayWorkingOnBehalfApi
export const getTodayWorkingOnBehalfApi = createAsyncThunk(
  `${ATTENDANCE}/getTodayWorkingOnBehalfApi`,
  async (params: string | undefined, thunkApi) => {
    const paramStr = typeof params === 'string' ? params : '';
    const cacheKey = `${OFFLINE_TODAY_WORKING_ON_BEHALF_PREFIX}${paramStr}` as PreferenceKey;
    // console.log('attendenceSliceBehalf',{paramStr}{buster});
    
    try {
      // hit network FIRST; add cache-buster to avoid stale proxies
      const buster = `${paramStr.includes('?') ? '&' : '?'}_=${Date.now()}`;
      const res = await APIs.getRequestWithQuery({
        path: URLs.getTodayWorkingOnBehalf,
        params: `${paramStr}${buster}`, // e.g. "?empId=500&_={ts}"
        isAuth: true,
      });
      console.log('getTodayWorkingOnBehalfApiparams',`${paramStr}${buster}`)

      if (res?.status === 200 && res?.success) {
        Preferences.setData(cacheKey, res); // refresh cache for this param
        return res;
      }

      // fallback to cached (param-scoped) data if API didn’t succeed
      const offData = await checkOfflineData(cacheKey);
      if (offData) return offData;

      return thunkApi.rejectWithValue(res);
    } catch (error) {
      // offline/error → try cache
      const offData = await checkOfflineData(cacheKey);
      if (offData) return offData;

      return thunkApi.rejectWithValue(error);
    }
  },
);

// getEmpZoneChambers
export const getEmpZoneChambersApi = createAsyncThunk(
  `${ATTENDANCE}/getEmpZoneChambersApi`,
  async (_, thunkApi) => {
    try {
      const offData = await checkOfflineData('OFFLINE_CHAMBERS_DATA');
      if (offData) {
        return offData;
      }
      const res = await APIs.getRequestWithQuery({
        path: URLs.getEmpZoneChambers,
        params: '',
        isAuth: true,
      });
      if (res?.status === 200 && res.success) {
        Preferences.setData('OFFLINE_CHAMBERS_DATA', res);
        return res;
      } else {
        thunkApi.rejectWithValue(res);
      }
      return res;
    } catch (error) {
      thunkApi.rejectWithValue(error);
    }
  },
);

//getEmpOfficeBranches
export const getEmpOfficeBranchesApi = createAsyncThunk(
  `${ATTENDANCE}/getEmpOfficeBranchesApi`,
  async (_, thunkApi) => {
    try {
      const offData = await checkOfflineData('OFFLINE_BRANCHES_DATA');
      if (offData) {
        return offData;
      }
      const res = await APIs.getRequestWithQuery({
        path: URLs.getEmpOfficeBranches,
        params: '',
        isAuth: true,
      });
      if (res?.status === 200 && res.success) {
        Preferences.setData('OFFLINE_BRANCHES_DATA', res);
        return res;
      } else {
        thunkApi.rejectWithValue(res);
      }
      return res;
    } catch (error) {
      thunkApi.rejectWithValue(error);
    }
  },
);
// markAttendance
export const markAttendanceApi = createAsyncThunk(
  `${ATTENDANCE}/markAttendanceApi`,
  async (params: any, thunkApi) => {
    try {
      console.log('attendanceParams',{params})
      const param = params ?? {};
      const res = await APIs.postRequestWithJson({
        path: URLs.markAttendance,
        params: param,
        isAuth: true,
        checkNetSpeed: true,
      });
      if (res?.status === 200 && res.success) {
        if (res?.isLogoutRequired) {
          APIs.logout();
          return;
        }
        thunkApi.dispatch(viewAttendanceApi({
          page: '1',
          size: '31',
          year: Common.getCurrentYear(),
          month: Common.getCurrentMonth(),
          showAttPolicy: true,
          search: '',
        }));
        console.log('attendance1');
        if (param?.direction === 'in') {
          thunkApi.dispatch(clearChamberTaskData());
        }
        Common.alert({
          title: 'Alert',
          msg: 'Attendance Marked Successfully',
          onPress: () => {
            goBack();
          },
        });
        return res;
      } else {
        Common.alert({
          title: 'API Error',
          msg: res?.message,
        });
        thunkApi.rejectWithValue(res);
      }
      return res;
    } catch (error) {
      return thunkApi.rejectWithValue(error);
    }
  },
);
// todayAttendance
export const todayAttendanceApi = createAsyncThunk(
  `${ATTENDANCE}/todayAttendanceApi`,
  async (params: any, thunkApi) => {
    try {
      console.log('todayAttendanceApi');
      const offData = await checkOfflineData('OFFLINE_TODAY_ATTENDANCE_DATA');
      if (offData) {
        return offData;
      }
      const param = params ?? {};
      console.log('paramData==>',{param})
      const res = await APIs.postRequestWithJson({
        path: URLs.todayAttendance,
        params: param,
        isAuth: true,
      });
      if (res?.status === 200 && res.success) {
        console.log('datanew', res) 
        Preferences.setData('OFFLINE_TODAY_ATTENDANCE_DATA', res);
        const mark = {
          status: res.todayDuty?.status,
          isDD: res?.todayDoubleDuty?.empId !== 0 ? true : false,
          ddStatus: res?.todayDoubleDuty?.status,
          ddEmpId: res?.todayDoubleDuty?.empId,
          tddEmpName: res?.todayDoubleDuty?.empName,
        };
        Common.log('MARK_ATTENDANCE_STATUS2', mark);
        Preferences.setData('MARK_ATTENDANCE_STATUS', mark);
        return res;
      } else {
        thunkApi.rejectWithValue(res);
      }
    } catch (error) {
      thunkApi.rejectWithValue(error);
    }
  },
);
export const projectListApi = createAsyncThunk<
  DataType.Project[],
  ProjectListArgs | undefined,
  { rejectValue: ApiError }
>(
  'ProjectList/projectListByName',
  async (args, thunkApi) => {
    try {
      const { query = {}, params = {}, body = {} } = args ?? {};
      console.log({ body })
      const res = await APIs.postRequestWithJsonWithBody({
        path: `http://mob.gigatel.me:40701/api/ProjectList/GetProjectListByNameAndRange`,
        query,
        params,
        body,
        isAuth: true,
        checkNetSpeed: true,
      });

      const ok = res as ApiSuccess<DataType.Project[]>;
      if (ok?.status === 200 && ok?.success) {
        return ok.data ?? [];
      }

      // standardize error shape for rejected action
      const err: ApiError = {
        status: (res as any)?.status,
        success: false,
        message: (res as any)?.message ?? 'Request failed',
        data: (res as any)?.data,
      };
      return thunkApi.rejectWithValue(err);
    } catch (error: any) {
      const err: ApiError = {
        status: error?.status ?? error?.response?.status,
        success: false,
        message: error?.message ?? 'Network/unknown error',
        data: error?.data ?? error?.response?.data,
      };
      return thunkApi.rejectWithValue(err);
    }
  }
);
// ✅ Post Location (separate action type + separate state + updated data type)
export const PostLocationApi = createAsyncThunk<
  DataType.PostLocationResponse,
  PostLocationArgs | undefined,
  { rejectValue: ApiError }
>(
  'Location/PostLocation',
  async (args, thunkApi) => {
    try {
      const { query = {}, params = {}, body = {} } = args ?? {};
      const res = await APIs.postRequestWithJsonWithBody({
        path: `${URLs.postLocationAPI}`,
        query,
        params,
        body,
        isAuth: true,
        checkNetSpeed: true,
      });
      // Normalize fields from wrapper/axios/fetch-ish shapes
      const status = Number((res as any)?.status ?? 0);
      const success = (res as any)?.success;
      const message = (res as any)?.message ?? (res as any)?.msg ?? '';
      const data =
        (res as any)?.data !== undefined
          ? (res as any)?.data
          : (res as any)?.payload ?? undefined;
      // ✅ Consider success if HTTP OK and either success===true OR message sounds successful
      const isHttpOk = status >= 200 && status < 300;
      const msgSoundsOk = typeof message === 'string' && /success|updated/i.test(message);
      const semanticOk = success === true || msgSoundsOk;
      if (isHttpOk && semanticOk) {
        // Always return an object (your slice expects a shape)
        return (data ?? {}) as DataType.PostLocationResponse;
      }
      // ❌ Treat everything else as a server-declared failure
      const err: ApiError = {
        status: status || 400,
        success: false,
        message: message || 'Request failed',
        data,
      };
      // Only warn on real rejects
      if (__DEV__) console.warn('[PostLocationApi] Server reject =>', err);
      return thunkApi.rejectWithValue(err);
    } catch (error: any) {
      const maybeAxiosStatus = error?.response?.status ?? error?.status ?? 0;
      const maybeAxiosData = error?.response?.data ?? error?.data;
      const message =
        error?.response?.data?.message ??
        error?.message ??
        'Network/unknown error';

      const err: ApiError = {
        status: maybeAxiosStatus,
        success: false,
        message,
        data: maybeAxiosData,
      };

      if (__DEV__) console.warn('[PostLocationApi] Exception =>', err, error);
      return thunkApi.rejectWithValue(err);
    }
  }
);
export const insertUpdateProjectPathByVendorApi = createAsyncThunk<
  any,
  InsertUpdateProjectPathArgs & {
    onProgress?: (sent: number, total?: number | null) => void;
    fallbackTotalBytes?: number | null; // optional, if you want to pass stat size from caller
  },
  { rejectValue: ApiError }
>('Project/InsertUpdateProjectPathByVendor', async (args, thunkApi) => {
  try {
    const form = new FormData();
    form.append('ProjectId', String(args.projectId));
    form.append('LatLng', normalizeLatLngToWKT(args.latLng));
    form.append('DirectionResult', args.directionResult ?? '');
    if (args.video) {
      if (typeof (args.video as any).uri === 'string') {
        const v = args.video as { uri: string; name?: string; type?: string };
        form.append('Video', {
          uri: v.uri,
          name: v.name ?? 'video.mp4',
          type: v.type ?? 'video/mp4',
        } as any);
      } else {
        form.append('Video', args.video as any);
      }
    }
    const res = await (APIs as any).postRequestWithFormData({
      path: 'http://mob.gigatel.me:40701/api/Project/InsertUpdateProjectPathByVendor',
      body: form,
      isAuth: true,

      onUploadProgress: (pe: { loaded: number; total?: number }) => {
        // Forward to component
        args.onProgress?.(pe.loaded ?? 0, pe.total ?? args.fallbackTotalBytes ?? null);
      },
    });

    const status = Number((res as any)?.status ?? 200);
    const success = (res as any)?.success ?? (status >= 200 && status < 300);
    const message = (res as any)?.message ?? (res as any)?.msg ?? '';

    if (success) return res ?? {};

    const err: ApiError = {
      status,
      success: false,
      message: message || 'Request failed',
      data: (res as any)?.data,
    };
    return thunkApi.rejectWithValue(err);
  } catch (error: any) {
    const err: ApiError = {
      status: error?.status ?? error?.response?.status,
      success: false,
      message: error?.message ?? 'Network/unknown error',
      data: error?.data ?? error?.response?.data,
    };
    return thunkApi.rejectWithValue(err);
  }
});

type LoadingState = 'idle' | 'pending' | 'fulfilled' | 'rejected';
interface AttendanceSliceState {
  viewAttLoading: LoadingState;
  inoutLoading: LoadingState;
  onBehalfLoading: LoadingState;
  zoneChambersLoading: LoadingState;
  officeBranchesLoading: LoadingState;
  markAttLoading: LoadingState;
  todayAttendanceLoading: LoadingState;
  projectListLoading: LoadingState;
  postLocationLoading: LoadingState;
  contactListLoading: LoadingState;
  insertPathLoading: LoadingState;       // ✅ added
  error: null,
  calenderAttendanceData: DataType.AttendanceData[] | null,
  inoutReportData: DataType.AttendanceInOutReport[] | null,
  allowedShifts: DataType.AllowedShift[] | [],
  employeeShift: DataType.EmployeeShift | null,
  todayAttendanceData: DataType.AttendanceData | null,
  todayDoubleDuty: DataType.TodayDoubleDuty | null,
  todayDuty: DataType.TodayDuty | null,
  todayWorkingOnBehalfData: DataType.TodayBehalfOf[] | null
  zoneChambersData: DataType.EmployeeZoneChamber[] | null,
  employeeOfficeBranchesData: DataType.EmployeeOfficeBranch[] | null,
  attendancePolicy: DataType.AttendancePolicy | null
  contactList: DataType.EmployeeDetails[] | null
  projectList: DataType.Project[] | null;
  postLocation: DataType.PostLocationResponse | null;
  insertPathResponse: any | null;
}
const initialState: AttendanceSliceState = attendanceAddapter.getInitialState({
  viewAttLoading: 'idle',
  inoutLoading: 'idle',
  onBehalfLoading: 'idle',
  zoneChambersLoading: 'idle',
  officeBranchesLoading: 'idle',
  markAttLoading: 'idle',
  todayAttendanceLoading: 'idle',
  contactListLoading: 'idle',
  calenderAttendanceData: null,
  todayAttendanceData: null,
  inoutReportData: null,
  todayWorkingOnBehalfData: null,
  projectListLoading: 'idle',
  zoneChambersData: null,
  insertPathLoading: 'idle',             // ✅ added
  employeeOfficeBranchesData: null,
  allowedShifts: [],
  employeeShift: null,
  todayDoubleDuty: null,
  todayDuty: null,
  attendancePolicy: null,
  contactList: null,
  error: null,
  projectList: null,
  postLocationLoading: 'idle',
  postLocation: null,
  insertPathResponse: null,              // ✅ added
});
const attendanceSlice = createSlice({
  name: ATTENDANCE,
  initialState,
  reducers: {},
  extraReducers: builder => {
    //! Attendance Data
    builder.addCase(viewAttendanceApi.pending, (state,) => {
      state.viewAttLoading = 'pending';
    });
    builder.addCase(viewAttendanceApi.fulfilled, (state, action) => {
      state.viewAttLoading = 'fulfilled';
      state.calenderAttendanceData = action.payload?.attendanceData;
    });
    builder.addCase(viewAttendanceApi.rejected, (state,) => {
      state.viewAttLoading = 'rejected';
    });
    //! InOut Report
    builder.addCase(viewAttendanceInOutReportApi.pending, (state,) => {
      state.inoutLoading = 'pending';
    });
    builder.addCase(viewAttendanceInOutReportApi.fulfilled, (state, action) => {
      state.inoutLoading = 'fulfilled';
      state.inoutReportData = action.payload;
    });
    builder.addCase(viewAttendanceInOutReportApi.rejected, (state,) => {
      state.inoutLoading = 'rejected';
    });
    //! Today Working On Behalf
    builder.addCase(getTodayWorkingOnBehalfApi.pending, (state,) => {
      state.onBehalfLoading = 'pending';
    });
    builder.addCase(getTodayWorkingOnBehalfApi.fulfilled, (state, action) => {
      state.onBehalfLoading = 'fulfilled';
      state.todayWorkingOnBehalfData = action.payload?.data?.map((item: DataType.TodayBehalfOf) => ({
        ...item,
        isDay: item.shiftName.toLowerCase().includes('day'),
        isEvening: item.shiftName.toLowerCase().includes('evening'),
        isNight: item.shiftName.toLowerCase().includes('night'),
      })) ?? [];
    });
    builder.addCase(getTodayWorkingOnBehalfApi.rejected, (state,) => {
      state.onBehalfLoading = 'rejected';
    });
    //! Get Emp Zone Chambers
    builder.addCase(getEmpZoneChambersApi.pending, (state,) => {
      state.zoneChambersLoading = 'pending';
    });
    builder.addCase(getEmpZoneChambersApi.fulfilled, (state, action) => {
      state.zoneChambersLoading = 'fulfilled';
      state.zoneChambersData = action.payload.data ?? [];
      Preferences.setData('EMPLOYEE_ZONE_CHAMBERS', action.payload.data ?? []);
    });
    builder.addCase(getEmpZoneChambersApi.rejected, (state,) => {
      state.zoneChambersLoading = 'rejected';
    });
    builder.addCase(getEmpOfficeBranchesApi.pending, (state,) => {
      state.officeBranchesLoading = 'pending';
    });
    builder.addCase(getEmpOfficeBranchesApi.fulfilled, (state, action) => {
      state.officeBranchesLoading = 'fulfilled';
      state.employeeOfficeBranchesData = action.payload?.data ?? [];
      Preferences.setData('EMPLOYEE_OFFICE_BRANCHES', action.payload?.data ?? []);
    });
    builder.addCase(getEmpOfficeBranchesApi.rejected, (state,) => {
      state.officeBranchesLoading = 'rejected';
    });
    //! Mark Attendance
    builder.addCase(markAttendanceApi.pending, (state,) => {
      state.markAttLoading = 'pending';
    });
    builder.addCase(markAttendanceApi.fulfilled, (state,) => {
      state.markAttLoading = 'fulfilled';

    });
    builder.addCase(markAttendanceApi.rejected, (state,) => {
      state.markAttLoading = 'rejected';
    });
    //! Today Attendance
    builder.addCase(todayAttendanceApi.pending, (state,) => {
      state.todayAttendanceLoading = 'pending';
    });
    builder.addCase(todayAttendanceApi.fulfilled, (state, action) => {
      state.todayAttendanceLoading = 'fulfilled';
      state.allowedShifts = action.payload?.allowedShifts ?? [];
      state.attendancePolicy = action.payload?.policy ?? null;
      if (action.payload.empShift) {
        const es = action.payload?.empShift;
        state.employeeShift = { ...es, startTime: es.shiftTime.split('-')[0], endTime: es.shiftTime.split('-')[1] };

      } else {
        state.employeeShift = null;
      }

      const tdd = action.payload?.todayDoubleDuty ?? null;
      state.todayDoubleDuty = {
        ...tdd,
        inTime: (tdd?.inTime === null || tdd?.inTime === '') ? null : tdd?.inTime,
        outTime: (tdd?.outTime === null || tdd?.outTime === '') ? null : tdd?.outTime,
      };
      state.todayDuty = action.payload?.todayDuty ?? null;
      const tad = action.payload?.todayAttendanceData;
      state.todayAttendanceData = {
        ...action.payload?.todayAttendanceData,
        inTimeStr: tad?.inTimeStr ? Common.timeFormatFromApi(
          tad?.inTimeStr ?? '',
        ) : null,
        outTimeStr: tad.outTimeStr ? Common.timeFormatFromApi(
          tad?.outTimeStr ?? '',
        ) : null,
        isMarkIn: tad?.inTimeStr !== null ? true : false,
        markOutDisable: (tad?.outTimeStr === null && tad?.inTimeStr === null) || (tad?.outTimeStr !== null && tad?.inTimeStr !== null),
        isMarkOut: tad?.outTimeStr !== null && tad?.inTimeStr !== null ? true : false,
        isShiftTimingRestrictions: action.payload.isShiftTimingRestrictions,
      };
    });
    builder.addCase(todayAttendanceApi.rejected, (state,) => {
      state.todayAttendanceLoading = 'rejected';
    });
    // ! Project List (no persistence)
    builder.addCase(projectListApi.pending, (state,) => {
      state.projectListLoading = 'pending';
    });
    builder.addCase(projectListApi.fulfilled, (state, action) => {
      state.projectListLoading = 'fulfilled';
      state.projectList = action.payload ?? [];
    });
    builder.addCase(projectListApi.rejected, (state,) => {
      state.projectListLoading = 'rejected';
    });
    //! ✅ Post Location reducers
    builder.addCase(PostLocationApi.pending, (state) => {
      state.postLocationLoading = 'pending';
    });
    builder.addCase(PostLocationApi.fulfilled, (state, action) => {
      state.postLocationLoading = 'fulfilled';
      state.postLocation = action.payload ?? null;
    });
    builder.addCase(PostLocationApi.rejected, (state) => {
      state.postLocationLoading = 'rejected';
    });

    //! Get Employee List For Contact
    builder.addCase(getEmployeeListForContactApi.pending, (state,) => {
      state.contactListLoading = 'pending';
    });
    builder.addCase(getEmployeeListForContactApi.fulfilled, (state, action) => {
      console.log(action.payload);
      state.contactListLoading = 'fulfilled';
      state.contactList = action.payload ?? [];
    });
    builder.addCase(getEmployeeListForContactApi.rejected, (state,) => {
      state.contactListLoading = 'rejected';
    });
    //! NEW: Insert/Update Project Path reducers
    builder.addCase(insertUpdateProjectPathByVendorApi.pending, (state) => {
      state.insertPathLoading = 'pending';
    });
    builder.addCase(insertUpdateProjectPathByVendorApi.fulfilled, (state, action) => {
      state.insertPathLoading = 'fulfilled';
      state.insertPathResponse = action.payload ?? null;
    });
    builder.addCase(insertUpdateProjectPathByVendorApi.rejected, (state) => {
      state.insertPathLoading = 'rejected';
    });
  },
});

export const { } = attendanceSlice.actions;
export const attendanceReducer = attendanceSlice.reducer;
