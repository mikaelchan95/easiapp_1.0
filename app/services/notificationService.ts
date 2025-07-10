import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

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

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Request permissions
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

  async scheduleOrderNotification(notification: OrderNotification, delaySeconds = 0): Promise<string | null> {
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
        trigger: delaySeconds > 0 
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

  async scheduleOrderStatusUpdate(orderId: string, status: OrderNotification['status'], delaySeconds = 0): Promise<string | null> {
    const notifications: Record<OrderNotification['status'], Omit<OrderNotification, 'orderId' | 'status'>> = {
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

    return this.scheduleOrderNotification({
      orderId,
      status,
      ...notificationData,
    }, delaySeconds);
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
      
      console.log('🔔 Simulated order progress notifications scheduled for order:', orderId);
    } catch (error) {
      console.error('Error simulating order progress:', error);
    }
  }

  // Add notification listeners
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
}

export const notificationService = new NotificationService();
export default notificationService;