-- Create Notification System Tables

-- 1. Create enum types
CREATE TYPE notification_type AS ENUM (
  'order_status',
  'payment',
  'approval',
  'credit_alert',
  'billing',
  'system',
  'marketing'
);

CREATE TYPE notification_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

CREATE TYPE notification_status AS ENUM (
  'unread',
  'read',
  'dismissed'
);

CREATE TYPE device_type AS ENUM (
  'ios',
  'android',
  'web'
);

-- 2. Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  type notification_type NOT NULL,
  priority notification_priority DEFAULT 'low',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status notification_status DEFAULT 'unread',
  metadata JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT
);

-- 3. Create notification_templates table
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type notification_type NOT NULL,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  priority notification_priority DEFAULT 'low',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create user_notification_settings table
CREATE TABLE user_notification_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  order_updates BOOLEAN DEFAULT true,
  payment_alerts BOOLEAN DEFAULT true,
  approval_requests BOOLEAN DEFAULT true,
  credit_warnings BOOLEAN DEFAULT true,
  billing_reminders BOOLEAN DEFAULT true,
  marketing_notifications BOOLEAN DEFAULT false,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create push_tokens table
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_type device_type NOT NULL,
  device_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies

-- Notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Only system/admin can insert notifications (handled via service role or admin check)
-- Ideally, create a function or use service role for creating notifications

-- Notification Templates
CREATE POLICY "Admins can manage templates" ON notification_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

CREATE POLICY "Users can view active templates" ON notification_templates
  FOR SELECT USING (is_active = true);

-- User Notification Settings
CREATE POLICY "Users can view their own settings" ON user_notification_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_notification_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_notification_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Push Tokens
CREATE POLICY "Users can view their own tokens" ON push_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tokens" ON push_tokens
  FOR ALL USING (auth.uid() = user_id);

-- 8. Create Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_token ON push_tokens(token);

-- 9. Trigger to auto-create settings on user creation (optional but recommended)
CREATE OR REPLACE FUNCTION public.handle_new_user_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_notification_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_notification_settings
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_notification_settings();

-- 10. Insert default templates
INSERT INTO notification_templates (name, type, title_template, message_template, priority)
VALUES
  ('order_confirmed', 'order_status', 'Order Confirmed: {{order_number}}', 'Your order {{order_number}} has been confirmed and is being prepared.', 'low'),
  ('order_delivered', 'order_status', 'Order Delivered', 'Your order {{order_number}} has been delivered. Enjoy!', 'medium'),
  ('payment_received', 'payment', 'Payment Received', 'We have received your payment of {{amount}} for order {{order_number}}.', 'low'),
  ('credit_warning', 'credit_alert', 'Low Credit Balance', 'Your company credit balance is running low: {{remaining_credit}} remaining.', 'high'),
  ('approval_required', 'approval', 'Approval Required', 'Order {{order_number}} requires your approval.', 'high');
