-- Create table for application-wide settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to authenticated users
CREATE POLICY "Allow read access for authenticated users" ON public.app_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Allow insert/update access for authenticated users (or restrict to admins if you have an admin check)
-- For now, allowing all authenticated users to edit settings
CREATE POLICY "Allow insert/update for authenticated users" ON public.app_settings
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Create table for user-specific settings (notifications, etc.)
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own settings
CREATE POLICY "Users can view own settings" ON public.user_settings
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY "Users can update own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Insert default settings if they don't exist
INSERT INTO public.app_settings (key, value)
VALUES 
    ('loyalty_config', '{"earn_rate": 1.0, "redemption_rate": 0.01}'::jsonb),
    ('delivery_config', '{"default_fee": 5.0, "express_fee": 15.0, "free_delivery_threshold": 100.0}'::jsonb)
ON CONFLICT (key) DO NOTHING;
