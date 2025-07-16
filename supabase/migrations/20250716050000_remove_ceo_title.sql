-- Remove CEO title from Mikael's profile
-- Update position to something more appropriate

UPDATE public.users 
SET 
    position = 'Manager',
    updated_at = NOW()
WHERE id = '2a163380-6934-4f19-b2ff-f6a15081cfe2';

-- Verify the change
SELECT 
    name,
    email,
    position,
    role
FROM users 
WHERE id = '2a163380-6934-4f19-b2ff-f6a15081cfe2';