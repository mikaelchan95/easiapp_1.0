-- Fix infinite recursion in RLS policies
-- Use a simpler approach that doesn't cause recursion

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view their own data and team members" ON public.users;

-- Create a simpler policy that avoids recursion
CREATE POLICY "Users can view their own data and team members"
    ON public.users
    FOR SELECT
    USING (
        -- User can see their own data
        auth.uid() = id
        OR
        -- Company users can see other users in the same company
        (
            account_type = 'company' 
            AND company_id IS NOT NULL
            AND EXISTS (
                SELECT 1 
                FROM public.users u2
                WHERE u2.id = auth.uid()
                AND u2.account_type = 'company'
                AND u2.company_id = public.users.company_id
            )
        )
    );

-- Fix user_permissions policy to avoid recursion
DROP POLICY IF EXISTS "Users can view their own permissions and team permissions" ON public.user_permissions;

CREATE POLICY "Users can view their own permissions and team permissions"
    ON public.user_permissions
    FOR SELECT
    USING (
        -- User can see their own permissions
        auth.uid() = user_id
        OR
        -- Company users can see their team members' permissions
        EXISTS (
            SELECT 1 
            FROM public.users u1, public.users u2
            WHERE u1.id = auth.uid()
            AND u2.id = public.user_permissions.user_id
            AND u1.account_type = 'company'
            AND u2.account_type = 'company'
            AND u1.company_id = u2.company_id
            AND u1.company_id IS NOT NULL
        )
    );

-- Test the fix
SELECT 
    u.name,
    u.email,
    u.role,
    u.position
FROM users u
WHERE u.company_id = 'f1234567-8901-2345-6789-012345678901'
AND u.account_type = 'company'
ORDER BY u.created_at;