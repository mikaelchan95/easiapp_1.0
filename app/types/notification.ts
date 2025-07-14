export type NotificationType =
  | 'order_status'
  | 'payment'
  | 'approval'
  | 'credit_alert'
  | 'billing'
  | 'system'
  | 'marketing';

export type NotificationPriority =
  | 'low'
  | 'medium'
  | 'normal'
  | 'high'
  | 'urgent';

export interface NotificationData {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
  actionUrl?: string;
  userId?: string;
  companyId?: string;
  status?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface NotificationSettings {
  enabled: boolean;
  orderUpdates: boolean;
  paymentAlerts: boolean;
  approvalRequests: boolean;
  creditAlerts: boolean;
  billingNotifications: boolean;
  marketingEmails: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export interface NotificationFilters {
  types?: NotificationType[];
  priority?: NotificationPriority;
  unreadOnly?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface NotificationBatch {
  notifications: NotificationData[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

export interface OrderStatusNotificationData {
  orderId: string;
  orderNumber: string;
  status: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
}

export interface PaymentNotificationData {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
}

export interface ApprovalNotificationData {
  approvalId: string;
  orderId: string;
  orderNumber: string;
  requestedBy: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CreditAlertNotificationData {
  companyId: string;
  companyName: string;
  currentCredit: number;
  creditLimit: number;
  utilizationPercentage: number;
  alertType: 'warning' | 'critical' | 'exceeded';
}

export interface BillingNotificationData {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'pending' | 'overdue' | 'paid';
}
