
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in environment.'
  );
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const EMAIL = process.env.ADMIN_USER_EMAIL;
const PASSWORD = process.env.ADMIN_USER_PASSWORD;

if (!EMAIL || !PASSWORD) {
  throw new Error('Missing ADMIN_USER_EMAIL or ADMIN_USER_PASSWORD in environment.');
}

async function createAdminUser() {
  console.log(`Creating Admin User: ${EMAIL}...`);

  try {
    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: { name: 'Mikael Chan (Superadmin)' }
    });

    let userId;

    if (authError) {
      if (authError.message.includes('already has been registered')) {
        console.log('User already exists in Auth, fetching ID...');
        // Find the user ID
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === EMAIL);
        if (!existingUser) throw new Error('Could not find existing user ID');
        userId = existingUser.id;
        
        // Optional: Update password if needed, but createUser usually fails if exists. 
        // We can update the user to ensure password matches if desired.
        await supabase.auth.admin.updateUserById(userId, { password: PASSWORD });
        console.log('Password updated.');
      } else {
        throw authError;
      }
    } else {
      userId = authData.user.id;
      console.log('Auth user created successfully.');
    }

    // 2. Assign 'admin' role in public.users table
    // Fetch existing companies to assign a dummy one or null if allowed
    const { data: company } = await supabase.from('companies').select('id').limit(1).single();
    
    // We'll treat this "backend login" as a user with role='admin'
    // Depending on schema, account_type might be 'individual' or 'company'. 
    // We'll set it to 'company' if we have a company_id, or 'individual' if not.
    
    // Note: The previous seed script showed "role" column usage.
    
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: EMAIL,
        name: 'Mikael Chan (Superadmin)',
        role: 'admin', // This grants the access
        account_type: 'individual', // Or 'admin' if that enum exists, but 'individual' is safe
        company_id: company?.id || null, // Link to a company if needed, or null
        points: 0,
        total_spent: 0,
        total_orders: 0
      }, { onConflict: 'id' });

    if (profileError) throw profileError;

    console.log(`✅ Success! User ${EMAIL} is now an Admin.`);

  } catch (err) {
    console.error('❌ Failed to create admin user:', err.message);
  }
}

createAdminUser();
