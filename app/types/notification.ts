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
  | 'high'
  | 'urgent';

export type NotificationStatus = 
  | 'unread' 
  | 'read' 
  | 'dismissed';

export interface NotificationData {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  status: NotificationStatus;
  metadata?: Record<string, any>;
  data?: Record<string, any>; // Deprecated, mapped to metadata
  createdAt: string; // ISO string
  readAt?: string | null;
  actionUrl?: string | null;
  userId: string;
  companyId?: string | null;
  expiresAt?: string | null;
  
  // Frontend helpers
  timestamp?: Date; // Derived from createdAt
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  
  // Categories
  orderUpdates: boolean;
  paymentAlerts: boolean;
  approvalRequests: boolean;
  creditWarnings: boolean;
  billingReminders: boolean;
  marketingNotifications: boolean;
  
  // Quiet Hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
}

export interface NotificationFilters {
  types?: NotificationType[];
  priority?: NotificationPriority[];
  status?: NotificationStatus[];
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

// Specific payload types for type safety in metadata
export interface OrderStatusPayload {
  orderId: string;
  orderNumber: string;
  status: string;
  previousStatus?: string;
  estimatedDelivery?: string;
}

export interface PaymentPayload {
  orderId: string;
  amount: number;
  currency: string;
  status: string;
}

export interface ApprovalPayload {
  orderId: string;
  amount: number;
  requesterName: string;
}

export interface CreditAlertPayload {
  companyId: string;
  currentCredit: number;
  limit: number;
  utilization: number;
}
