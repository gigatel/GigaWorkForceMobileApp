import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';

/*
 @ 𝔸𝕦𝕥𝕙𝕠𝕣: ℙ𝕒𝕟𝕜𝕒𝕛 𝔾𝕦𝕡𝕒𝔽𝕠𝕣𝕔𝕖
 @ 𝔸𝕡𝕡 𝕻𝕺𝔻: ℙ𝕦𝕤𝕳 ℕ𝕺𝔱𝕮𝔽𝕴𝔠𝕒𝔱𝕰𝕻𝕿 𝕾𝔱𝕺𝕱𝕰
 */

const NOTIFICATIONS = 'notifications';
const notificationsAdapter = createEntityAdapter();

export interface Notification {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  timestamp: number;
  read: boolean;
}

export interface NotificationsSliceState {
  items: Notification[];
  unreadCount: number;
}

const initialState = notificationsAdapter.getInitialState({
  items: [],
  unreadCount: 0,
});

const notificationsSlice = createSlice({
  name: NOTIFICATIONS,
  initialState: initialState,
  reducers: {
    addNotification: (state, action) => {
      const notification: Notification = {
        id: Date.now().toString(),
        title: action.payload.title || '',
        body: action.payload.body || '',
        data: action.payload.data || {},
        timestamp: Date.now(),
        read: false,
      };
      state.items.unshift(notification);
      state.unreadCount += 1;
    },
    markAsRead: (state, action) => {
      const notification = state.items.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach(notification => {
        notification.read = true;
      });
      state.unreadCount = 0;
    },
    deleteNotification: (state, action) => {
      const index = state.items.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        const notification = state.items[index];
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.items.splice(index, 1);
      }
    },
    clearAllNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
    },
  },
});

export const notificationsReducer = notificationsSlice.reducer;
export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} = notificationsSlice.actions;
