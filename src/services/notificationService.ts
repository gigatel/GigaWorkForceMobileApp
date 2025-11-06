import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AuthorizationStatus,
  Event,
  EventType,
  Notification,
  NotificationAndroid,
  NotificationIOS,
} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { NavigationService } from './navigationService';

interface TicketNotificationData {
  notification_id: string;
  title: string;
  body: string;
  date: string;
  details: {
    EntityID: string;
    EntityType: string;
    Priority: string; // '1' => high
    AlertType?: string;
    AlertCategory?: string;
    IsSpecialAlert?: boolean;
  };
}

class NotificationService {
  private static instance: NotificationService;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // ---------- Helpers (NEW) ----------
  private toBool(v: any): boolean {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1';
    if (typeof v === 'number') return v === 1;
    return false;
  }

  // Normalize any remoteMessage shape into a safe TicketNotificationData object
  private normalizeTicketData(remoteMessage: any): TicketNotificationData {
    const rm = remoteMessage || {};
    const data = rm.data || {};

    // details might come as a JSON string — parse safely
    let details: any = data.details ?? {};
    if (typeof details === 'string') {
      try { details = JSON.parse(details); } catch { details = {}; }
    }

    const title =
      data.title ??
      rm?.notification?.title ??
      'Alert';

    const body =
      data.body ??
      rm?.notification?.body ??
      '';

    const date = data.date ?? new Date().toISOString();

    const normalized: TicketNotificationData = {
      notification_id: data.notification_id ?? data.id ?? '',
      title,
      body,
      date,
      details: {
        EntityID: details?.EntityID ?? details?.entityId ?? '',
        EntityType: details?.EntityType ?? details?.entityType ?? '',
        Priority: String(details?.Priority ?? details?.priority ?? '0'),
        AlertType: details?.AlertType ?? details?.alertType,
        AlertCategory: details?.AlertCategory ?? details?.alertCategory,
        IsSpecialAlert: this.toBool(details?.IsSpecialAlert ?? details?.isSpecialAlert),
      },
    };

    return normalized;
  }

  // ---------- Init ----------
  private async initialize() {
    await this.setupNotificationChannels();
    await this.setupIOSCategories();
    this.setupForegroundHandler();
    this.setupBackgroundHandler();

    // iOS badge reset
    notifee.setBadgeCount(0).catch(() => {});
  }

  // ---------- Channels ----------
  private async setupNotificationChannels() {
    // Regular ticket channels
    await notifee.createChannel({
      id: 'critical_tickets',
      name: 'Critical Tickets',
      lights: true,
      vibration: true,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
    });

    await notifee.createChannel({
      id: 'normal_tickets',
      name: 'Normal Tickets',
      lights: true,
      vibration: true,
      importance: AndroidImportance.DEFAULT,
      visibility: AndroidVisibility.PUBLIC,
    });

    // Special alert channels
    await notifee.createChannel({
      id: 'emergency_alerts',
      name: 'Emergency Alerts',
      lights: true,
      vibration: true,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      sound: 'emergency_alert',                 // android: res/raw/emergency_alert.wav
      vibrationPattern: [300, 500, 300, 500],
    });

    await notifee.createChannel({
      id: 'system_alerts',
      name: 'System Alerts',
      lights: true,
      vibration: true,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
    });

    await notifee.createChannel({
      id: 'maintenance_alerts',
      name: 'Maintenance Alerts',
      lights: true,
      vibration: true,
      importance: AndroidImportance.DEFAULT,
      visibility: AndroidVisibility.PUBLIC,
    });
  }

  // ---------- Event Handlers ----------
  private setupForegroundHandler() {
    notifee.onForegroundEvent(async ({ type, detail }: Event) => {
      try {
        if (type === EventType.PRESS) {
          this.handleNotificationPress(detail.notification);
        }
      } catch {}
    });
  }

  private setupBackgroundHandler() {
    // Keep Notifee background press handler here
    notifee.onBackgroundEvent(async ({ type, detail }: Event) => {
      try {
        if (type === EventType.PRESS) {
          this.handleNotificationPress(detail.notification);
        }
      } catch {}
    });

    // ❗️DO NOT set messaging().setBackgroundMessageHandler here.
    // Keep it ONLY in index.js (top-level) to avoid duplicate handlers/crashes.
  }

  private async handleNotificationPress(notification: any) {
    try {
      const safe = notification?.data
        ? this.normalizeTicketData({ data: notification.data })
        : null;
      if (!safe) return;

      const det = safe.details || ({} as TicketNotificationData['details']);
      const entityType = (det.EntityType || '').toLowerCase();

      if (entityType === 'complaint') {
        NavigationService.navigate('TicketDetails', {
          id: det.EntityID || '',
          flag: '1',
          taskType: '',
          notificationId: safe.notification_id,
        });
      } else if (entityType === 'pendingtask') {
        NavigationService.navigate('TicketDetails', {
          id: det.EntityID || '',
          flag: '2',
          taskType: '',
          notificationId: safe.notification_id,
        });
      } else if (entityType === 'team') {
        NavigationService.navigate('Dashboard');
      } else {
        // Unknown type -> no-op; avoids crashes
      }
    } catch {}
  }

  // ---------- Styling ----------
  private getNotificationChannel(data: TicketNotificationData): string {
    const det = (data?.details || {}) as TicketNotificationData['details'];
    if (det.IsSpecialAlert) {
      const t = (det.AlertType || '').toLowerCase();
      if (t === 'emergency') return 'emergency_alerts';
      if (t === 'system') return 'system_alerts';
      if (t === 'maintenance') return 'maintenance_alerts';
      return 'critical_tickets';
    }
    return String(det.Priority) === '1' ? 'critical_tickets' : 'normal_tickets';
  }

  private getNotificationStyle(data: TicketNotificationData): Notification {
    const det = (data?.details || {}) as TicketNotificationData['details'];

    const isSpecialAlert = !!det.IsSpecialAlert;
    const alertType = (det.AlertType || '').toLowerCase();
    const isPriority = String(det.Priority || '0') === '1';

    // Android
    const androidStyle: NotificationAndroid = {
      channelId: this.getNotificationChannel(data),
      pressAction: { id: 'default' },
      importance: isPriority ? AndroidImportance.HIGH : AndroidImportance.DEFAULT,
      visibility: AndroidVisibility.PUBLIC,
      timestamp: new Date(data?.date || Date.now()).getTime(),
    };

    // iOS
    const iosStyle: NotificationIOS = {
      foregroundPresentationOptions: { alert: true, badge: true, sound: true },
      categoryId: isSpecialAlert ? (alertType || 'critical') : (isPriority ? 'critical' : 'default'),
    };

    if (isSpecialAlert) {
      // elevate
      androidStyle.importance = AndroidImportance.HIGH;

      if (alertType === 'emergency') {
        (androidStyle as any).sound = 'emergency_alert';
        (androidStyle as any).vibrationPattern = [300, 500, 300, 500];
        (androidStyle as any).smallIcon = 'ic_emergency_notification';
        (androidStyle as any).color = '#FF0000';
        (iosStyle as any).sound = 'emergency_alert.wav'; // iOS bundle
        (iosStyle as any).interruptionLevel = 'critical';
      } else if (alertType === 'system') {
        (androidStyle as any).smallIcon = 'ic_system_notification';
        (androidStyle as any).color = '#FFA500';
        (iosStyle as any).interruptionLevel = 'timeSensitive';
      }

      if (det.AlertCategory) {
        (androidStyle as any).tag = det.AlertCategory;
        (iosStyle as any).threadId = det.AlertCategory;
      }
    }

    return { android: androidStyle, ios: iosStyle };
  }

  // ---------- Public API ----------
  public async displayNotification(remoteMessage: any) {
    try {
      const data = this.normalizeTicketData(remoteMessage);
      const style = this.getNotificationStyle(data);

      await notifee.displayNotification({
        title: data.title || 'Alert',
        body: data.body || '',
        android: style.android,
        ios: style.ios,
        // keep original data for navigation on press
        data: (remoteMessage && remoteMessage.data) || {},
      });
    } catch (e) {
      // swallow to avoid crashing bg handler
    }
  }

  public async requestPermissions() {
    try {
      // iOS permission
      const settings = await notifee.requestPermission({
        sound: true,
        alert: true,
        badge: true,
        criticalAlert: true,
        provisional: true,
        announcement: true,
      });

      // Register for remote notifications (iOS) / no-op Android
      await messaging().registerDeviceForRemoteMessages();

      // Get FCM token cross-platform
      const fcmToken = await messaging().getToken();
      return fcmToken;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      throw error;
    }
  }

  private async setupIOSCategories() {
    await notifee.setNotificationCategories([
      {
        id: 'emergency',
        actions: [
          { id: 'mark_as_read', title: 'Mark as Read', foreground: true },
          { id: 'acknowledge', title: 'Acknowledge', destructive: true, foreground: true },
        ],
      },
      {
        id: 'system',
        actions: [
          { id: 'view_details', title: 'View Details', foreground: true },
        ],
      },
      {
        id: 'critical',
        actions: [
          { id: 'respond', title: 'Respond', foreground: true },
        ],
      },
    ]);
  }

  public async onTokenRefresh(callback: (token: string) => void) {
    return messaging().onTokenRefresh(callback);
  }
}

export default NotificationService.getInstance();
