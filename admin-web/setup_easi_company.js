
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vqxnkxaeriizizfmqvua.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5reGFlcmlpeml6Zm1xdnVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwMzM4MiwiZXhwIjoyMDY3NTc5MzgyfQ.y7sQCIqVduJ7Le3IkEGR-wSoOhppjRjqsC6GvEJAZEw';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const ADMIN_EMAIL = 'mikaelchan95@gmail.com';

async function assignEasiCompany() {
  console.log('--- Setting up EASI Company ---');

  try {
    // 1. Check or Create "EASI" Company
    let { data: easiCompany, error: fetchError } = await supabase
      .from('companies')
      .select('id')
      .ilike('name', 'EASI%') // Match EASI, Easi, etc.
      .limit(1)
      .maybeSingle();

    if (!easiCompany) {
      console.log('Creating "EASI" company record...');
      const { data: newCompany, error: createError } = await supabase
        .from('companies')
        .insert({
          name: 'EASI Admin',
          company_name: 'EASI Admin', // Schema requirement
          uen: 'EASI-INTERNAL',
          address: 'EASI HQ',
          status: 'active',
          credit_limit: 0,
          current_credit: 0
        })
        .select()
        .single();
      
      if (createError) throw createError;
      easiCompany = newCompany;
      console.log('✅ Created EASI company.');
    } else {
      console.log('✅ Found existing EASI company.');
    }

    // 2. Find the Admin User
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', ADMIN_EMAIL)
      .single();

    if (userError) throw new Error(`Could not find user ${ADMIN_EMAIL}: ${userError.message}`);

    // 3. Update User to link to EASI
    const { error: updateError } = await supabase
      .from('users')
      .update({
        company_id: easiCompany.id,
        // Ensure they are marked distinctively if needed, but company_id is the main link
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    console.log(`✅ Successfully linked ${ADMIN_EMAIL} to company "EASI Admin".`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

assignEasiCompany();
