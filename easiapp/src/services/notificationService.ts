import { AppNotification } from '../types';

export interface NotificationSubscription {
  orderId: string;
  userId: string;
  endpoint?: string;
  keys?: {
    p256dh: string;
    auth: string;
  };
}

class NotificationService {
  private subscriptions: NotificationSubscription[] = [];
  private notificationCallbacks: ((notification: AppNotification) => void)[] = [];

  // Subscribe to order notifications
  subscribeToOrder(orderId: string, userId: string) {
    const existing = this.subscriptions.find(sub => sub.orderId === orderId);
    if (!existing) {
      this.subscriptions.push({ orderId, userId });
    }
  }

  // Add notification listener
  onNotification(callback: (notification: AppNotification) => void) {
    this.notificationCallbacks.push(callback);
  }

  // Send notification
  sendNotification(notification: AppNotification) {
    // Trigger all callbacks
    this.notificationCallbacks.forEach(callback => callback(notification));

    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.orderId || notification.id
      });
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Send order status update notification
  notifyOrderStatus(orderId: string, status: string, orderNumber: string) {
    const notifications: { [key: string]: { title: string; message: string } } = {
      'outForDelivery': {
        title: 'Order Out for Delivery',
        message: `Order ${orderNumber} is on its way! Delivery by 6 PM today.`
      },
      'delivered': {
        title: 'Order Delivered',
        message: `Order ${orderNumber} has been delivered successfully.`
      }
    };

    const notificationData = notifications[status];
    if (notificationData) {
      this.sendNotification({
        id: `${orderId}-${status}`,
        title: notificationData.title,
        message: notificationData.message,
        type: 'delivery',
        read: false,
        createdAt: new Date().toISOString(),
        orderId
      });
    }
  }

  // Mock order status simulation for demo
  simulateOrderProgress(orderId: string, orderNumber: string) {
    // Simulate "out for delivery" after 2 seconds
    setTimeout(() => {
      this.notifyOrderStatus(orderId, 'outForDelivery', orderNumber);
    }, 2000);

    // Simulate delivery after 30 seconds (for demo)
    setTimeout(() => {
      this.notifyOrderStatus(orderId, 'delivered', orderNumber);
    }, 30000);
  }
}

export const notificationService = new NotificationService();