// src/slices/ticket.slice.ts
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { APIs } from '@apis';
import { Common, Preferences } from '@utils';
import { URLs } from '@apis';
/** ---- Types ---- */
export type TicketItem = Record<string, any>;

export interface ApiError {
  status?: number;
  success?: false;
  message?: string;
  data?: any;
}
export interface RFOEmployee {
  id: number;
  name: string;
  isActive: boolean;
  organizationId: number;
}
export interface ApiListResponse<T> {
  status: number;
  success: boolean;
  message?: string;
  data: T[];
}


export type GetComplaintsBody = {
  empId: number;
  date: string;
  organizationId: number;
};
export type FollowupImage = {
  imageData: string;
  imageExtention: string;
};
export type CreateFollowupBody = {
  assignTaskId: number;     // (required) the ticket/work id (from your backend)
  address: string;          // (required) text address / nearest location
  remark: string;           // (required) note text
  empId: number;            // (required) employee id (we default from Preferences)
  lat: string;              // (required) store as string to keep exact format
  lng: string;              // (required) store as string to keep exact format
  image1?: FollowupImage;   // (optional) base64 + ext
  image2?: FollowupImage;   // (optional)
};
export type CloseFollowupBody = {
  assignTaskId: number;     // (required) the ticket/work id (from your backend)
  address: string;          // (required) text address / nearest location
  remark: string;           // (required) note text
  empId: number;            // (required) employee id (we default from Preferences)
  lat: string;              // (required) store as string to keep exact format
  lng: string;              // (required) store as string to keep exact format
  image1?: FollowupImage;   // (optional) base64 + ext
  image2?: FollowupImage;   // (optional)
  rfoId: string;
  rfO_materialName: string;
};

// Minimal followup item shape (adjust fields as your API returns)
export type FollowupItem = {
  id?: string | number;
  assignTaskId: number;
  remark: string;
  address: string;
  lat?: string;
  lng?: string;
  createdAt?: string;
  createdBy?: string | number;
  // include any other fields your API returns
};
// ==
type TicketState = {
  loading: 'idle' | 'pending';
  error: string | null;
  items: TicketItem[];
  lastPayload: GetComplaintsBody | null;
  lastFetchedAt: number | null;

  detailById: Record<string, TicketItem | undefined>;
  followupsByAssignTaskId: Record<string, FollowupItem[] | undefined>;
  followupsLoadingByAssignTaskId: Record<string, boolean | undefined>;
  followupsErrorByAssignTaskId: Record<string, string | null | undefined>;
  creatingFollowup: 'idle' | 'pending';
  createFollowupError: string | null;

  // ADD THESE 3 FIELDS
  rfoList: { id: number; name: string; isActive: boolean; organizationId: number }[];
  rfoLoading: boolean;
  rfoError: any;
};


const initialState: TicketState = {
  loading: 'idle',
  error: null,
  items: [],
  lastPayload: null,
  lastFetchedAt: null,

  detailById: {},
  followupsByAssignTaskId: {},
  followupsLoadingByAssignTaskId: {},
  followupsErrorByAssignTaskId: {},
  creatingFollowup: 'idle',
  createFollowupError: null,

  rfoList: [],
  rfoLoading: false,
  rfoError: null,
};


/** ---- Helpers ---- */
const toIsoString = (d: string | Date): string => (typeof d === 'string' ? d : d.toISOString());

/** ---- Thunk: getEmpComplaintsByDate (POST) ---- */
export const getEmpComplaintsByDate = createAsyncThunk(
  'tickets/getEmpComplaintsByDate',
  async (
    params: { empId?: number; date: string | Date; organizationId?: number },
    thunkAPI
  ) => {
    try {
      const empId =
        typeof params.empId === 'number'
          ? params.empId
          : Number(Preferences.getData('EMPLOYEE_ID'));
      const organizationId =
        typeof params.organizationId === 'number'
          ? params.organizationId
          : Number(Preferences.getData('ORGANIZATION_ID'));
      const dateIso = toIsoString(params.date);

      if (!empId || Number.isNaN(empId)) return thunkAPI.rejectWithValue({ message: 'Missing empId' });
      if (!organizationId || Number.isNaN(organizationId)) return thunkAPI.rejectWithValue({ message: 'Missing organizationId' });
      if (!dateIso) return thunkAPI.rejectWithValue({ message: 'Invalid date' });

      const body: GetComplaintsBody = { empId, date: dateIso, organizationId };

      const res: { status?: number; success?: boolean; message?: string; data?: any } =
        await APIs.postRequestWithJson({
          path:`${URLs.getComplaintsDate}`,
          params: body,
          isAuth: true,
        });
      if (!res) return thunkAPI.rejectWithValue({ message: 'Server not responding' });

      if (Number(res.status) !== 200 || res.success === false) {
        return thunkAPI.rejectWithValue({
          message: res?.message || `Ticket API failed (status ${res?.status ?? 'N/A'})`,
          status: res?.status,
        });
      }

      let items: TicketItem[] = [];
      if (Array.isArray(res.data)) items = res.data;
      else if (res?.data?.items && Array.isArray(res.data.items)) items = res.data.items;

      return { items, body };
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Unexpected error while fetching complaints';
      return thunkAPI.rejectWithValue({ message: msg });
    }
  }
);


/** ---- NEW Thunk: getEmpComplaintDetails (GET by id via query) ----
 * Mirrors your attendance slice pattern.
 * - Uses GET with query param
 * - Uses offline cache if available
 */
export const getEmpComplaintDetails = createAsyncThunk<
  { id: string; item: TicketItem },
  { id: string | number; refresh?: boolean },
  { state: any; rejectValue: ApiError }
>(
  'tickets/GetEmpComplaintDetails',
  async ({ id, refresh }, thunkApi) => {
    try {
      const idStr = String(id);
      const isNetOn = await Common.getNetConnection();

      const state = thunkApi.getState();
      const cached = state?.tickets?.detailById?.[idStr];

      // If offline and we have cached, use it
      if (!isNetOn && cached) {
        return { id: idStr, item: cached };
      }
      // If offline and no cache, error
      if (!isNetOn && !cached) {
        return thunkApi.rejectWithValue({
          status: 0,
          success: false,
          message: 'Offline and no cached ticket available',
          data: { id: idStr },
        });
      }

      // Online OR forced refresh -> fetch
      if (isNetOn || refresh) {
        const res = await APIs.getRequestWithQuery({
          path: `${URLs.getComplaintsDetail}?id=${idStr}`,
          params: '',
          isAuth: true,
        });

        const status = Number(res?.status ?? 0);
        const success = !!res?.success;
        const data = res?.data;

        if (status === 200 && success) {
          // API may return an object or array; normalize to one item
          const item: TicketItem =
            Array.isArray(data) ? data[0] ?? {} : (data ?? {});
          return { id: idStr, item };
        }

        return thunkApi.rejectWithValue({
          status,
          success: false,
          message: res?.message ?? 'Failed to fetch ticket details',
          data: res?.data,
        });
      }

      // Should not reach here
      return thunkApi.rejectWithValue({
        status: 0,
        success: false,
        message: 'Unknown state while fetching ticket details',
      });
    } catch (error: any) {
      return thunkApi.rejectWithValue({
        status: error?.status ?? error?.response?.status,
        success: false,
        message: error?.message ?? 'Network/unknown error',
        data: error?.data ?? error?.response?.data,
      });
    }
  }
);

// export closeCOmplaintDEtails = createAsyncThunk<>(

// )
// ==== FOLLOWUP POST — API path ====
// const FOLLOWUP_CREATE_PATH =
//   'http://mob.gigatel.me:60203/api/Complaint/ComplaintFollowUps';

// ==== FOLLOWUP POST — Thunk ====
export const createTicketFollowup = createAsyncThunk<
  // Return type (keep generic; your API seems to return {status,success,message,data?})
  { status?: number; success?: boolean; message?: string; data?: any } | undefined,
  // Args coming from StartTicketScreen (empId auto-fills if omitted)
  Partial<CreateFollowupBody> & {
    assignTaskId: number;
    address: string;
    remark: string;
    lat: string;
    lng: string;
  },
  { rejectValue: ApiError }
>(
  'tickets/createTicketFollowup',
  async (args, { rejectWithValue }) => {
    try {
      const empId =
        typeof args.empId === 'number' && !Number.isNaN(args.empId)
          ? args.empId
          : Number(Preferences.getData('EMPLOYEE_ID'));

      if (!empId || Number.isNaN(empId)) {
        return rejectWithValue({ message: 'Missing empId (Preferences or arg)' });
      }
       const body: CreateFollowupBody = {
        assignTaskId: args.assignTaskId,
        address: args.address,
        remark: args.remark,
        empId,
        lat: args.lat,
        lng: args.lng,
        ...(args.image1 ? { image1: args.image1 } : {}),
        ...(args.image2 ? { image2: args.image2 } : {}),
      };
      console.log('CreateFollowupBodyData:',{body});
      return;
      const res: { status?: number; success?: boolean; message?: string; data?: any } =
        await APIs.postRequestWithJson({
          path:  `${URLs.followUpComplaint}`,
          params: body,
          isAuth: true,
        });
      if (!res) return rejectWithValue({ message: 'Server not responding' });
      if (Number(res.status) !== 200 || res.success === false) {
        return rejectWithValue({
          status: res?.status,
          message: res?.message || 'Failed to create follow-up',
          data: res?.data,
          success: false,
        });
      }
      return res;
    } catch (error: any) {
      return rejectWithValue({
        status: error?.status ?? error?.response?.status,
        success: false,
        message: error?.message ?? 'Network/unknown error',
        data: error?.data ?? error?.response?.data,
      });
    }
  }
);
export const closeTicketFollowup = createAsyncThunk<
  { status?: number; success?: boolean; message?: string; data?: any } | undefined,
  Partial<CloseFollowupBody> & {
    assignTaskId: number;
    address: string;
    remark: string;
    lat: string;
    lng: string;
    rfoId?: number;               // ⭐ ADDED
    rfO_materialName?: string;    // ⭐ ADDED
  },
  { rejectValue: ApiError }
>(
  'tickets/closeTicketFollowup',
  async (args, { rejectWithValue }) => {
    try {
      const empId =
        typeof args.empId === 'number' && !Number.isNaN(args.empId)
          ? args.empId
          : Number(Preferences.getData('EMPLOYEE_ID'));

      if (!empId || Number.isNaN(empId)) {
        return rejectWithValue({ message: 'Missing empId (Preferences or arg)' });
      }

      // ⭐ FINAL BODY (RFO added)
      const body: CloseFollowupBody = {
        assignTaskId: args.assignTaskId,
        address: args.address,
        remark: args.remark,
        empId,
        lat: args.lat,
        lng: args.lng,
        rfoId: args.rfoId ?? 0, // ⭐ ADD
        rfO_materialName: args.rfO_materialName ?? '', // ⭐ ADD
        ...(args.image1 ? { image1: args.image1 } : {}),
        ...(args.image2 ? { image2: args.image2 } : {}),
      };

      console.log('CloseFollowupBodyData:', body);

      const res = await APIs.postRequestWithJson({
        path: `${URLs.removefollowUpComplaint}`,
        params: body,
        isAuth: true,
      });

      if (!res)
        return rejectWithValue({ message: 'Server not responding' });

      if (Number(res.status) !== 200 || res.success === false) {
        return rejectWithValue({
          status: res?.status,
          message: res?.message || 'Failed to Close Ticket',
          data: res?.data,
          success: false,
        });
      }
      return res;
    } catch (error: any) {
      return rejectWithValue({
        status: error?.status ?? error?.response?.status,
        success: false,
        message: error?.message ?? 'Network/unknown error',
        data: error?.data ?? error?.response?.data,
      });
    }
  }
);
export const getRFOListApi = createAsyncThunk<
  RFOEmployee[],    
  void,             
  { rejectValue: ApiError }
>(
  `tickets/RFO/GetRFOList`,
  async (_, thunkApi) => {
    try {
      const res: ApiListResponse<RFOEmployee> =
        await APIs.getRequestWithQuery({
          path: URLs.getRFOList,
          params: '',
          isAuth: true,
        });

      // SUCCESS
      if (res.status === 200 && res.success && Array.isArray(res.data)) {
        // Return EXACT same API data (no sorting, no modifying)
        return res.data.map(item => ({
          id: item.id,
          name: item.name,
          isActive: item.isActive,
          organizationId: item.organizationId,
        }));
      }

      return thunkApi.rejectWithValue({
        status: res.status,
        message: res.message ?? 'Failed to fetch RFO list',
        data: res.data ?? null,
      });

    } catch (error: any) {
      return thunkApi.rejectWithValue({
        status: error?.status ?? error?.response?.status,
        message: error?.message ?? 'Unexpected error',
        data: error?.data ?? null,
      });
    }
  }
);






/** ---- Slice ---- */
const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    clearTickets(state) {
      state.items = [];
      state.error = null;
      state.lastPayload = null;
      state.lastFetchedAt = null;
      state.detailById = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // List
      .addCase(getEmpComplaintsByDate.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(
        getEmpComplaintsByDate.fulfilled,
        (state, action: PayloadAction<{ items: TicketItem[]; body: GetComplaintsBody }>) => {
          state.loading = 'idle';
          state.error = null;
          state.items = action.payload.items ?? [];
          state.lastPayload = action.payload.body;
          state.lastFetchedAt = Date.now();
        }
      )
      .addCase(getEmpComplaintsByDate.rejected, (state, action: any) => {
        state.loading = 'idle';
        state.error = action.payload?.message || 'Failed to fetch complaints';
      })

      // Details
      .addCase(getEmpComplaintDetails.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(
        getEmpComplaintDetails.fulfilled,
        (state, action: PayloadAction<{ id: string; item: TicketItem }>) => {
          state.loading = 'idle';
          state.error = null;
          state.detailById[action.payload.id] = action.payload.item;
        }
      )
      .addCase(getEmpComplaintDetails.rejected, (state, action: any) => {
        state.loading = 'idle';
        state.error = action.payload?.message || 'Failed to fetch ticket';
      })
      .addCase(getRFOListApi.pending, (state) => {
        state.rfoLoading = true;
        state.rfoError = null;
      })
      .addCase(getRFOListApi.fulfilled, (state, action) => {
        state.rfoLoading = false;
        state.rfoList = action.payload;        // id, name, isActive, organizationId
      })
      .addCase(getRFOListApi.rejected, (state, action) => {
        state.rfoLoading = false;
        state.rfoError = action.payload;
      });
      
  },
});

export const { clearTickets } = ticketSlice.actions;
export const ticketReducer = ticketSlice.reducer;

/** ---- Selectors ---- */
export const selectTicketState = (s: any) => s?.tickets as TicketState;
export const selectTickets = (s: any) => selectTicketState(s)?.items ?? [];
export const selectTicketsLoading = (s: any) =>
  selectTicketState(s)?.loading === 'pending';
export const selectTicketsError = (s: any) =>
  selectTicketState(s)?.error ?? null;

// NEW: select a detail by id
export const selectTicketDetailById = (s: any, id?: string | number) => {
  const k = id == null ? undefined : String(id);
  return k ? selectTicketState(s)?.detailById?.[k] : undefined;
};
export const selectTicketDetailLoading = (s: any) =>
  selectTicketState(s)?.loading === 'pending';
export const selectTicketDetailError = (s: any) =>
  selectTicketState(s)?.error;

