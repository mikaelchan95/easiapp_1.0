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
  OrderStatusNotificationData,
  PaymentNotificationData,
  ApprovalNotificationData,
  CreditAlertNotificationData,
  BillingNotificationData,
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

export interface OrderNotification {
  orderId: string;
  status: 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered';
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private isInitialized = false;
  private storageKey = '@easiapp:notifications';
  private settingsKey = '@easiapp:notification_settings';
  private subscriptions: Map<string, any> = new Map();

  // Default notification settings
  private defaultSettings: NotificationSettings = {
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    orderUpdates: true,
    paymentAlerts: true,
    approvalRequests: true,
    creditWarnings: true,
    billingReminders: true,
    promotionalNotifications: false,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
  };

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Request permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('order-updates', {
          name: 'Order Updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          enableVibrate: true,
        });
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  async scheduleOrderNotification(
    notification: OrderNotification,
    delaySeconds = 0
  ): Promise<string | null> {
    try {
      await this.initialize();

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: {
            orderId: notification.orderId,
            status: notification.status,
            type: 'order_update',
            ...notification.data,
          },
          sound: 'default',
          ...(Platform.OS === 'android' && {
            channelId: 'order-updates',
          }),
        },
        trigger:
          delaySeconds > 0
            ? {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: delaySeconds,
              }
            : null, // null means immediate
      });

      console.log('📱 Scheduled notification:', identifier);
      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  }

  async scheduleOrderStatusUpdate(
    orderId: string,
    status: OrderNotification['status'],
    delaySeconds = 0
  ): Promise<string | null> {
    const notifications: Record<
      OrderNotification['status'],
      Omit<OrderNotification, 'orderId' | 'status'>
    > = {
      confirmed: {
        title: '✅ Order Confirmed',
        body: 'Your order has been confirmed and is being prepared.',
      },
      preparing: {
        title: '👨‍🍳 Order Being Prepared',
        body: 'Your order is being carefully prepared for delivery.',
      },
      out_for_delivery: {
        title: '🚚 Order Out for Delivery',
        body: 'Your order is on its way! Track your delivery in the app.',
      },
      delivered: {
        title: '🎉 Order Delivered',
        body: 'Your order has been delivered. Enjoy!',
      },
    };

    const notificationData = notifications[status];
    if (!notificationData) {
      console.error('Unknown order status:', status);
      return null;
    }

    return this.scheduleOrderNotification(
      {
        orderId,
        status,
        ...notificationData,
      },
      delaySeconds
    );
  }

  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
      console.log('❌ Cancelled notification:', identifier);
    } catch (error) {
      console.error('Error cancelling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('❌ Cancelled all notifications');
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
    }
  }

  // Simulate order progress with notifications
  async simulateOrderProgress(orderId: string): Promise<void> {
    try {
      // Schedule notifications for different order stages
      await this.scheduleOrderStatusUpdate(orderId, 'confirmed', 0); // Immediate
      await this.scheduleOrderStatusUpdate(orderId, 'preparing', 10); // 10 seconds later
      await this.scheduleOrderStatusUpdate(orderId, 'out_for_delivery', 20); // 20 seconds later
      await this.scheduleOrderStatusUpdate(orderId, 'delivered', 30); // 30 seconds later

      console.log(
        '🔔 Simulated order progress notifications scheduled for order:',
        orderId
      );
    } catch (error) {
      console.error('Error simulating order progress:', error);
    }
  }

  // Add notification listeners
  addNotificationListener(
    onNotificationReceived: (notification: Notifications.Notification) => void,
    onNotificationResponse: (
      response: Notifications.NotificationResponse
    ) => void
  ): () => void {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      onNotificationReceived
    );
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(
        onNotificationResponse
      );

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }

  // Enhanced notification management methods

  // Get notifications with filters and pagination
  async getNotifications(
    userId: string,
    filters?: NotificationFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<NotificationBatch> {
    try {
      // Try to get from Supabase first
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters?.types?.length) {
        query = query.in('type', filters.types);
      }
      if (filters?.priorities?.length) {
        query = query.in('priority', filters.priorities);
      }
      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters?.fromDate) {
        query = query.gte('created_at', filters.fromDate.toISOString());
      }
      if (filters?.toDate) {
        query = query.lte('created_at', filters.toDate.toISOString());
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching notifications from Supabase:', error);
        // Fallback to local storage
        return this.getLocalNotifications(userId, filters, limit, offset);
      }

      const notifications: NotificationData[] =
        data?.map(this.mapDatabaseToNotification) || [];
      const unreadCount = await this.getUnreadCount(userId);

      return {
        notifications,
        totalCount: count || 0,
        unreadCount,
        hasMore: (count || 0) > offset + limit,
      };
    } catch (error) {
      console.error('Error in getNotifications:', error);
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
      const storageData = await AsyncStorage.getItem(
        `${this.storageKey}:${userId}`
      );
      let allNotifications: NotificationData[] = storageData
        ? JSON.parse(storageData)
        : [];

      // Apply filters
      if (filters) {
        allNotifications = allNotifications.filter(notification => {
          if (
            filters.types?.length &&
            !filters.types.includes(notification.type)
          )
            return false;
          if (
            filters.priorities?.length &&
            !filters.priorities.includes(notification.priority)
          )
            return false;
          if (
            filters.status?.length &&
            !filters.status.includes(notification.status)
          )
            return false;
          if (
            filters.fromDate &&
            new Date(notification.timestamp) < filters.fromDate
          )
            return false;
          if (
            filters.toDate &&
            new Date(notification.timestamp) > filters.toDate
          )
            return false;
          return true;
        });
      }

      // Sort by timestamp (newest first)
      allNotifications.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      const notifications = allNotifications.slice(offset, offset + limit);
      const unreadCount = allNotifications.filter(
        n => n.status === 'unread'
      ).length;

      return {
        notifications,
        totalCount: allNotifications.length,
        unreadCount,
        hasMore: allNotifications.length > offset + limit,
      };
    } catch (error) {
      console.error('Error getting local notifications:', error);
      return {
        notifications: [],
        totalCount: 0,
        unreadCount: 0,
        hasMore: false,
      };
    }
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'unread');

      if (error) {
        console.error('Error getting unread count from Supabase:', error);
        // Fallback to local storage
        const storageData = await AsyncStorage.getItem(
          `${this.storageKey}:${userId}`
        );
        const notifications: NotificationData[] = storageData
          ? JSON.parse(storageData)
          : [];
        return notifications.filter(n => n.status === 'unread').length;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return 0;
    }
  }

  // Create a new notification
  async createNotification(
    notification: Omit<NotificationData, 'id' | 'timestamp'>
  ): Promise<NotificationData> {
    const newNotification: NotificationData = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from('notifications')
        .insert([this.mapNotificationToDatabase(newNotification)])
        .select()
        .single();

      if (error) {
        console.error('Error saving notification to Supabase:', error);
      }

      // Always save to local storage as backup
      await this.saveNotificationLocally(newNotification);

      return newNotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      // Still save locally
      await this.saveNotificationLocally(newNotification);
      return newNotification;
    }
  }

  // Mark notification as read
  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error marking notification as read in Supabase:', error);
      }

      // Update local storage
      await this.updateNotificationStatusLocally(
        userId,
        notificationId,
        'read'
      );
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark notification as dismissed
  async markAsDismissed(
    userId: string,
    notificationId: string
  ): Promise<boolean> {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'dismissed' })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error(
          'Error marking notification as dismissed in Supabase:',
          error
        );
      }

      // Update local storage
      await this.updateNotificationStatusLocally(
        userId,
        notificationId,
        'dismissed'
      );
      return true;
    } catch (error) {
      console.error('Error marking notification as dismissed:', error);
      return false;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('user_id', userId)
        .eq('status', 'unread');

      if (error) {
        console.error(
          'Error marking all notifications as read in Supabase:',
          error
        );
      }

      // Update local storage
      const storageData = await AsyncStorage.getItem(
        `${this.storageKey}:${userId}`
      );
      if (storageData) {
        const notifications: NotificationData[] = JSON.parse(storageData);
        const updatedNotifications = notifications.map(n =>
          n.status === 'unread' ? { ...n, status: 'read' as const } : n
        );
        await AsyncStorage.setItem(
          `${this.storageKey}:${userId}`,
          JSON.stringify(updatedNotifications)
        );
      }

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Delete notification
  async deleteNotification(
    userId: string,
    notificationId: string
  ): Promise<boolean> {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting notification from Supabase:', error);
      }

      // Delete from local storage
      const storageData = await AsyncStorage.getItem(
        `${this.storageKey}:${userId}`
      );
      if (storageData) {
        const notifications: NotificationData[] = JSON.parse(storageData);
        const filteredNotifications = notifications.filter(
          n => n.id !== notificationId
        );
        await AsyncStorage.setItem(
          `${this.storageKey}:${userId}`,
          JSON.stringify(filteredNotifications)
        );
      }

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Get notification settings
  async getSettings(userId: string): Promise<NotificationSettings> {
    try {
      const storageData = await AsyncStorage.getItem(
        `${this.settingsKey}:${userId}`
      );
      if (storageData) {
        return { ...this.defaultSettings, ...JSON.parse(storageData) };
      }
      return this.defaultSettings;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return this.defaultSettings;
    }
  }

  // Update notification settings
  async updateSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<boolean> {
    try {
      const currentSettings = await this.getSettings(userId);
      const updatedSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(
        `${this.settingsKey}:${userId}`,
        JSON.stringify(updatedSettings)
      );
      return true;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return false;
    }
  }

  // Subscribe to real-time notifications
  subscribeToUserNotifications(
    userId: string,
    callback: (notification: NotificationData) => void
  ): any {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          const notification = this.mapDatabaseToNotification(payload.new);
          callback(notification);
        }
      )
      .subscribe();

    this.subscriptions.set(`user_notifications_${userId}`, subscription);
    return subscription;
  }

  // Subscribe to order status changes
  subscribeToOrderStatusUpdates(
    userId: string,
    callback: (notification: OrderStatusNotificationData) => void
  ): any {
    const subscription = supabase
      .channel(`order_status:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${userId}`,
        },
        async payload => {
          if (payload.old.status !== payload.new.status) {
            const notification = await this.createOrderStatusNotification(
              payload.new,
              payload.old.status
            );
            callback(notification as OrderStatusNotificationData);
          }
        }
      )
      .subscribe();

    this.subscriptions.set(`order_status_${userId}`, subscription);
    return subscription;
  }

  // Subscribe to company credit alerts
  subscribeToCompanyCreditAlerts(
    companyId: string,
    callback: (notification: CreditAlertNotificationData) => void
  ): any {
    const subscription = supabase
      .channel(`company_credit:${companyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'companies',
          filter: `id=eq.${companyId}`,
        },
        async payload => {
          const { credit_limit, credit_used } = payload.new;
          const availableCredit = credit_limit - credit_used;
          const utilizationPercent = (credit_used / credit_limit) * 100;

          // Check for credit alerts
          if (utilizationPercent >= 90) {
            const notification = await this.createCreditAlertNotification(
              payload.new,
              utilizationPercent >= 100 ? 'limit_exceeded' : 'low_balance'
            );
            callback(notification as CreditAlertNotificationData);
          }
        }
      )
      .subscribe();

    this.subscriptions.set(`company_credit_${companyId}`, subscription);
    return subscription;
  }

  // Unsubscribe from notifications
  unsubscribe(subscriptionKey: string): void {
    const subscription = this.subscriptions.get(subscriptionKey);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(subscriptionKey);
    }
  }

  // Unsubscribe from all notifications
  unsubscribeAll(): void {
    this.subscriptions.forEach((subscription, key) => {
      supabase.removeChannel(subscription);
    });
    this.subscriptions.clear();
  }

  // Helper methods
  private async saveNotificationLocally(
    notification: NotificationData
  ): Promise<void> {
    try {
      const storageData = await AsyncStorage.getItem(
        `${this.storageKey}:${notification.userId}`
      );
      const notifications: NotificationData[] = storageData
        ? JSON.parse(storageData)
        : [];
      notifications.unshift(notification); // Add to beginning

      // Keep only last 100 notifications to prevent storage bloat
      const trimmedNotifications = notifications.slice(0, 100);
      await AsyncStorage.setItem(
        `${this.storageKey}:${notification.userId}`,
        JSON.stringify(trimmedNotifications)
      );
    } catch (error) {
      console.error('Error saving notification locally:', error);
    }
  }

  private async updateNotificationStatusLocally(
    userId: string,
    notificationId: string,
    status: 'read' | 'dismissed'
  ): Promise<void> {
    try {
      const storageData = await AsyncStorage.getItem(
        `${this.storageKey}:${userId}`
      );
      if (storageData) {
        const notifications: NotificationData[] = JSON.parse(storageData);
        const updatedNotifications = notifications.map(n =>
          n.id === notificationId ? { ...n, status } : n
        );
        await AsyncStorage.setItem(
          `${this.storageKey}:${userId}`,
          JSON.stringify(updatedNotifications)
        );
      }
    } catch (error) {
      console.error('Error updating notification status locally:', error);
    }
  }

  private mapDatabaseToNotification(dbRecord: any): NotificationData {
    return {
      id: dbRecord.id,
      type: dbRecord.type,
      priority: dbRecord.priority,
      status: dbRecord.status,
      title: dbRecord.title,
      message: dbRecord.message,
      timestamp: new Date(dbRecord.created_at),
      userId: dbRecord.user_id,
      companyId: dbRecord.company_id,
      expiresAt: dbRecord.expires_at
        ? new Date(dbRecord.expires_at)
        : undefined,
      metadata: dbRecord.metadata || {},
    };
  }

  private mapNotificationToDatabase(notification: NotificationData): any {
    return {
      id: notification.id,
      type: notification.type,
      priority: notification.priority,
      status: notification.status,
      title: notification.title,
      message: notification.message,
      user_id: notification.userId,
      company_id: notification.companyId,
      expires_at: notification.expiresAt?.toISOString(),
      metadata: notification.metadata,
      created_at: notification.timestamp.toISOString(),
    };
  }

  private async createOrderStatusNotification(
    orderData: any,
    previousStatus: string
  ): Promise<NotificationData> {
    const statusMessages = {
      confirmed: 'Your order has been confirmed and is being prepared',
      preparing: 'Your order is being prepared',
      ready: 'Your order is ready for pickup/delivery',
      out_for_delivery: 'Your order is out for delivery',
      delivered: 'Your order has been delivered',
      cancelled: 'Your order has been cancelled',
      returned: 'Your order has been returned',
    };

    return this.createNotification({
      type: 'order_status',
      priority: orderData.status === 'delivered' ? 'medium' : 'low',
      status: 'unread',
      title: `Order ${orderData.order_number} Update`,
      message:
        statusMessages[orderData.status] ||
        'Your order status has been updated',
      userId: orderData.user_id,
      companyId: orderData.company_id,
      metadata: {
        orderId: orderData.id,
        orderNumber: orderData.order_number,
        previousStatus,
        newStatus: orderData.status,
        estimatedDelivery: orderData.estimated_delivery,
      },
    });
  }

  private async createCreditAlertNotification(
    companyData: any,
    alertType: 'low_balance' | 'limit_exceeded'
  ): Promise<NotificationData> {
    const availableCredit = companyData.credit_limit - companyData.credit_used;

    return this.createNotification({
      type: 'credit_alert',
      priority: alertType === 'limit_exceeded' ? 'urgent' : 'high',
      status: 'unread',
      title:
        alertType === 'limit_exceeded'
          ? 'Credit Limit Exceeded'
          : 'Low Credit Balance',
      message:
        alertType === 'limit_exceeded'
          ? `Your company has exceeded its credit limit of $${companyData.credit_limit.toLocaleString()}`
          : `Your company credit balance is low: $${availableCredit.toLocaleString()} remaining`,
      userId: companyData.primary_contact_id, // Notify primary contact
      companyId: companyData.id,
      metadata: {
        companyId: companyData.id,
        companyName: companyData.name,
        creditLimit: companyData.credit_limit,
        creditUsed: companyData.credit_used,
        availableCredit,
        alertType,
      },
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;
