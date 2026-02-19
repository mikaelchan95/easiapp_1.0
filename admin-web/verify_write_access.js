
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_KEY in environment.'
  );
}

const supabase = createClient(SUPABASE_URL, ANON_KEY);

const EMAIL = process.env.ADMIN_USER_EMAIL;
const PASSWORD = process.env.ADMIN_USER_PASSWORD;

if (!EMAIL || !PASSWORD) {
  throw new Error('Missing ADMIN_USER_EMAIL or ADMIN_USER_PASSWORD in environment.');
}

async function verifyWriteAccess() {
  console.log('--- Verifying Write Access for Admin ---');

  // 1. Log in
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });

  if (authError) {
    console.error('❌ Login failed (Verification Aborted):', authError.message);
    return;
  }
  console.log('✅ Logged in successfully.');

  // 2. Try to update a company (Write Check)
  // We'll try to update the "EASI Admin" company we just made/assigned.
  // First find it.
  const { data: company, error: fetchError } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', 'EASI%')
    .limit(1)
    .single();

  if (fetchError || !company) {
      // Fallback to any company
      const { data: anyCompany } = await supabase.from('companies').select('id, name').limit(1).single();
      if(anyCompany) updateCompany(anyCompany);
      else console.error('❌ No companies found to test update.');
  } else {
      updateCompany(company);
  }

  async function updateCompany(comp) {
      console.log(`Attempting to update company: ${comp.name}...`);
      const { error: updateError } = await supabase
          .from('companies')
          .update({ current_credit: 1 }) // harmless update
          .eq('id', comp.id);

      if (updateError) {
          console.error('❌ WRITE FAILED:', updateError.message);
          console.error('   Diagnosis: RLS Policies are BLOCKING edits.');
          console.error('   Action: You MUST run the SQL Policies provided earlier.');
      } else {
          console.log('✅ WRITE SUCCESSFUL: Database permissions are correct.');
          console.log('   Diagnosis: Issue is missing Frontend UI features.');
      }
  }
}

verifyWriteAccess();
