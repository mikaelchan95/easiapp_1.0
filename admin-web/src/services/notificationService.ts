import { supabase } from '../lib/supabase';
import type { 
  NotificationData, 
  NotificationTemplate, 
  SendNotificationParams 
} from '../types/notification';

export const notificationService = {
  // Get all notifications with pagination and filtering
  async getNotifications(
    page = 1, 
    limit = 20, 
    filters?: any
  ): Promise<{ data: NotificationData[]; count: number }> {
    let query = supabase
      .from('notifications')
      .select('*, user:users(name, email)', { count: 'exact' });

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return { data: data || [], count: count || 0 };
  },

  // Send notifications
  async sendNotification(params: SendNotificationParams): Promise<void> {
    let targetUserIds: string[] = [];

    // Determine target users
    if (params.audience === 'specific' && params.userIds) {
      targetUserIds = params.userIds;
    } else if (params.audience === 'all') {
      const { data } = await supabase.from('users').select('id');
      targetUserIds = data?.map(u => u.id) || [];
    } else if (params.audience === 'customers') {
      const { data } = await supabase.from('users').select('id').eq('account_type', 'individual');
      targetUserIds = data?.map(u => u.id) || [];
    } else if (params.audience === 'companies') {
      const { data } = await supabase.from('users').select('id').eq('account_type', 'company');
      targetUserIds = data?.map(u => u.id) || [];
    }

    if (targetUserIds.length === 0) return;

    // Create notification records
    const notifications = targetUserIds.map(userId => ({
      user_id: userId,
      type: params.type,
      priority: params.priority,
      title: params.title,
      message: params.message,
      metadata: params.metadata || {},
      action_url: params.actionUrl,
      expires_at: params.expiresAt?.toISOString(),
    }));

    // Batch insert (chunk if necessary, for now assuming safe size)
    const { error } = await supabase.from('notifications').insert(notifications);
    
    if (error) throw error;

    // Trigger Edge Function for Push (optional if using database triggers)
    // For now, relying on Supabase Realtime or Database Webhooks to trigger the edge function
  },

  // Get templates
  async getTemplates(): Promise<NotificationTemplate[]> {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  // Create template
  async createTemplate(template: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<NotificationTemplate> {
    const { data, error } = await supabase
      .from('notification_templates')
      .insert([template])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update template
  async updateTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const { data, error } = await supabase
      .from('notification_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete template
  async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('notification_templates')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
