
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vqxnkxaeriizizfmqvua.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5reGFlcmlpeml6Zm1xdnVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwMzM4MiwiZXhwIjoyMDY3NTc5MzgyfQ.y7sQCIqVduJ7Le3IkEGR-wSoOhppjRjqsC6GvEJAZEw';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkDatabase() {
  console.log('1. Testing Connection with Service Role Key...');
  
  // Test 1: List Users (requires admin/service_role)
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error('❌ Connection Failed:', authError.message);
    return;
  }
  
  console.log(`✅ Connection Successful! Found ${users.length} users.`);

  // Test 2: Check app_settings table
  console.log('2. Checking for "app_settings" table...');
  const { data, error } = await supabase.from('app_settings').select('*').limit(1);

  if (error) {
    console.error('❌ Table Check Failed:', error.message);
    if (error.code === '42P01') { // Postgres code for undefined table
        console.log('   -> CONFIRMED: Table "app_settings" does not exist.');
        console.log('   -> ACTION REQUIRED: Run the SQL script manually.');
    }
  } else {
    console.log('✅ Table "app_settings" exists!');
  }
}

checkDatabase();
