-- Fix Row Level Security policies for team management
-- Allow company users to see their team members

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can only view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can only update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can only insert their own data" ON public.users;

-- Create new policies that allow team visibility
CREATE POLICY "Users can view their own data and team members"
    ON public.users
    FOR SELECT
    USING (
        -- User can see their own data
        auth.uid() = id
        OR
        -- Company users can see their team members
        (
            account_type = 'company' 
            AND company_id IN (
                SELECT company_id 
                FROM public.users 
                WHERE id = auth.uid() 
                AND account_type = 'company'
            )
        )
    );

CREATE POLICY "Users can update their own data"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own data"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Also fix user_permissions policies to allow team visibility
DROP POLICY IF EXISTS "Users can view their own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Users can insert their own permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Users can update their own permissions" ON public.user_permissions;

CREATE POLICY "Users can view their own permissions and team permissions"
    ON public.user_permissions
    FOR SELECT
    USING (
        -- User can see their own permissions
        auth.uid() = user_id
        OR
        -- Company users can see their team members' permissions
        user_id IN (
            SELECT id 
            FROM public.users 
            WHERE account_type = 'company' 
            AND company_id IN (
                SELECT company_id 
                FROM public.users 
                WHERE id = auth.uid() 
                AND account_type = 'company'
            )
        )
    );

CREATE POLICY "Users can insert their own permissions"
    ON public.user_permissions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own permissions"
    ON public.user_permissions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Verify the policies are working by testing the team query
SELECT 
    u.name,
    u.email,
    u.role,
    u.position,
    c.name as company_name
FROM users u
JOIN companies c ON u.company_id = c.id
WHERE u.company_id = 'f1234567-8901-2345-6789-012345678901'
AND u.account_type = 'company'
ORDER BY u.created_at;