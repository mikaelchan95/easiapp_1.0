import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../utils/supabase';
import {
  NotificationData,
  NotificationSettings,
  NotificationFilters,
  NotificationBatch,
  NotificationType,
  NotificationPriority,
  OrderStatusPayload,
  CreditAlertPayload,
} from '../types/notification';

// Configure how notifications are handled when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  private isInitialized = false;
  private storageKey = '@easiapp:notifications';
  private subscriptions: Map<string, any> = new Map();

  private defaultSettings: NotificationSettings = {
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    orderUpdates: true,
    paymentAlerts: true,
    approvalRequests: true,
    creditWarnings: true,
    billingReminders: true,
    marketingNotifications: false,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  };

  async initialize(userId?: string): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.warn('Failed to get push token for push notification!');
          return false;
        }

        // Register push token if user is logged in
        if (userId) {
          try {
            // Try to get the push token - requires projectId in app.json or EAS config
            const token = (await Notifications.getExpoPushTokenAsync({
              projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
            })).data;
            await this.registerPushToken(userId, token);
          } catch (tokenError) {
            // Push token registration failed - likely missing projectId or not in a build
            // This is non-fatal, app can still function without push notifications
            console.warn('Could not register push token:', tokenError);
          }
        }
      } else {
        console.log('Must use physical device for Push Notifications');
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  async registerPushToken(userId: string, token: string): Promise<void> {
    try {
      const { error } = await supabase.from('push_tokens').upsert(
        {
          user_id: userId,
          token,
          device_type: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web',
          device_name: Device.modelName || 'Unknown Device',
          is_active: true,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: 'token' }
      );

      if (error) throw error;
    } catch (error) {
      console.error('Error registering push token:', error);
    }
  }

  // Get notifications with filters and pagination
  async getNotifications(
    userId: string,
    filters?: NotificationFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<NotificationBatch> {
    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (filters?.types?.length) {
        query = query.in('type', filters.types);
      }
      if (filters?.priority?.length) {
        query = query.in('priority', filters.priority);
      }
      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.from.toISOString())
          .lte('created_at', filters.dateRange.to.toISOString());
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const notifications: NotificationData[] = data.map(this.mapDatabaseToNotification);
      const unreadCount = await this.getUnreadCount(userId);

      return {
        notifications,
        total: count || 0,
        unreadCount,
        hasMore: (count || 0) > offset + limit,
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fallback to local
      return this.getLocalNotifications(userId, filters, limit, offset);
    }
  }

  // Get notifications from local storage (fallback)
  private async getLocalNotifications(
    userId: string,
    filters?: NotificationFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<NotificationBatch> {
    try {
      const storageData = await AsyncStorage.getItem(`${this.storageKey}:${userId}`);
      let allNotifications: NotificationData[] = storageData ? JSON.parse(storageData) : [];

      if (filters) {
        allNotifications = allNotifications.filter(n => {
          if (filters.types && !filters.types.includes(n.type)) return false;
          if (filters.priority && !filters.priority.includes(n.priority)) return false;
          if (filters.status && !filters.status.includes(n.status)) return false;
          return true;
        });
      }

      const notifications = allNotifications.slice(offset, offset + limit);
      return {
        notifications,
        total: allNotifications.length,
        unreadCount: allNotifications.filter(n => n.status === 'unread').length,
        hasMore: allNotifications.length > offset + limit,
      };
    } catch (error) {
      return { notifications: [], total: 0, unreadCount: 0, hasMore: false };
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'unread');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('status', 'unread');

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all as read:', error);
      return false;
    }
  }

  async getSettings(userId: string): Promise<NotificationSettings> {
    try {
      const { data, error } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows found

      if (!data) {
        // Create default settings if not exists
        await this.updateSettings(userId, this.defaultSettings);
        return this.defaultSettings;
      }

      return this.mapDatabaseToSettings(data);
    } catch (error) {
      console.error('Error getting settings:', error);
      return this.defaultSettings;
    }
  }

  async updateSettings(userId: string, settings: Partial<NotificationSettings>): Promise<boolean> {
    try {
      const dbSettings = this.mapSettingsToDatabase(settings);
      const { error } = await supabase
        .from('user_notification_settings')
        .upsert({ user_id: userId, ...dbSettings });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }

  subscribeToUserNotifications(userId: string, callback: (notification: NotificationData) => void) {
    const subscription = supabase
      .channel(`user_notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          callback(this.mapDatabaseToNotification(payload.new));
        }
      )
      .subscribe();

    this.subscriptions.set(`user_notifications_${userId}`, subscription);
    return () => supabase.removeChannel(subscription);
  }

  unsubscribeAll() {
    this.subscriptions.forEach(sub => supabase.removeChannel(sub));
    this.subscriptions.clear();
  }

  /**
   * Add listeners for incoming notifications and notification responses (taps).
   * Returns an unsubscribe function to clean up both listeners.
   */
  addNotificationListener(
    onNotificationReceived: (notification: Notifications.Notification) => void,
    onNotificationResponse: (response: Notifications.NotificationResponse) => void
  ): () => void {
    const receivedSubscription = Notifications.addNotificationReceivedListener(onNotificationReceived);
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }

  private mapDatabaseToNotification(dbRecord: any): NotificationData {
    return {
      id: dbRecord.id,
      type: dbRecord.type,
      priority: dbRecord.priority,
      title: dbRecord.title,
      message: dbRecord.message,
      status: dbRecord.status,
      metadata: dbRecord.metadata,
      createdAt: dbRecord.created_at,
      readAt: dbRecord.read_at,
      actionUrl: dbRecord.action_url,
      userId: dbRecord.user_id,
      companyId: dbRecord.company_id,
      expiresAt: dbRecord.expires_at,
      timestamp: new Date(dbRecord.created_at),
    };
  }

  private mapDatabaseToSettings(dbRecord: any): NotificationSettings {
    return {
      pushEnabled: dbRecord.push_enabled,
      emailEnabled: dbRecord.email_enabled,
      smsEnabled: dbRecord.sms_enabled,
      orderUpdates: dbRecord.order_updates,
      paymentAlerts: dbRecord.payment_alerts,
      approvalRequests: dbRecord.approval_requests,
      creditWarnings: dbRecord.credit_warnings,
      billingReminders: dbRecord.billing_reminders,
      marketingNotifications: dbRecord.marketing_notifications,
      quietHoursEnabled: dbRecord.quiet_hours_enabled,
      quietHoursStart: dbRecord.quiet_hours_start,
      quietHoursEnd: dbRecord.quiet_hours_end,
    };
  }

  private mapSettingsToDatabase(settings: Partial<NotificationSettings>): any {
    const mapping: Record<string, string> = {
      pushEnabled: 'push_enabled',
      emailEnabled: 'email_enabled',
      smsEnabled: 'sms_enabled',
      orderUpdates: 'order_updates',
      paymentAlerts: 'payment_alerts',
      approvalRequests: 'approval_requests',
      creditWarnings: 'credit_warnings',
      billingReminders: 'billing_reminders',
      marketingNotifications: 'marketing_notifications',
      quietHoursEnabled: 'quiet_hours_enabled',
      quietHoursStart: 'quiet_hours_start',
      quietHoursEnd: 'quiet_hours_end',
    };

    const dbSettings: any = {};
    Object.keys(settings).forEach(key => {
      if (mapping[key]) {
        dbSettings[mapping[key]] = (settings as any)[key];
      }
    });
    return dbSettings;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
