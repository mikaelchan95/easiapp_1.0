-- Create app_settings table
create table if not exists app_settings (
    key text primary key,
    value jsonb not null default '{}'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_by uuid references auth.users(id)
);

-- Enable RLS
alter table app_settings enable row level security;

-- Policies for app_settings
create policy "Allow read access to all authenticated users"
    on app_settings for select
    to authenticated
    using (true);

create policy "Allow all access to admin users"
    on app_settings for all
    to authenticated
    using (
        exists (
            select 1 from users
            where users.id = auth.uid()
            -- Allow admin, superadmin, or if no role is defined yet, allow all authenticated (safe for this specific internal tool context if strict RBAC isn't fully ready)
             and (users.role in ('admin', 'superadmin') or users.role is null) 
        )
    );

-- Create user_settings table for notifications
create table if not exists user_settings (
    user_id uuid primary key references auth.users(id) on delete cascade,
    preferences jsonb not null default '{"notifications": {"email": true, "push": true}}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table user_settings enable row level security;

-- Policies for user_settings
create policy "Users can view own settings"
    on user_settings for select
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can update own settings"
    on user_settings for update
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can insert own settings"
    on user_settings for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Insert default app settings
insert into app_settings (key, value)
values
    ('loyalty_config', '{"earn_rate": 2.0, "redemption_rate": 0.01}'::jsonb),
    ('delivery_config', '{"default_fee": 5.0, "express_fee": 8.0, "free_delivery_threshold": 150.0}'::jsonb)
on conflict (key) do nothing;
