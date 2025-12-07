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
  created_at: string;
  read_at?: string | null;
  action_url?: string | null;
  user_id: string;
  company_id?: string | null;
  expires_at?: string | null;
  user?: {
    email: string;
    name: string;
  };
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  title_template: string;
  message_template: string;
  priority: NotificationPriority;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SendNotificationParams {
  userIds?: string[];
  companyIds?: string[];
  audience: 'all' | 'customers' | 'companies' | 'specific';
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
  expiresAt?: Date;
}
