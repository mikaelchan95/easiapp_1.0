-- Fix Vincent Hong's data
-- Update role to superadmin and set department to office

UPDATE public.users 
SET 
    role = 'superadmin',
    department = 'office',
    updated_at = NOW()
WHERE email = 'vincent@thewinery.com.sg';

-- Verify the changes
SELECT 
    name,
    email,
    role,
    position,
    department,
    profile_image
FROM users 
WHERE email = 'vincent@thewinery.com.sg';