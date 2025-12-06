
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vqxnkxaeriizizfmqvua.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5reGFlcmlpeml6Zm1xdnVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwMzM4MiwiZXhwIjoyMDY3NTc5MzgyfQ.y7sQCIqVduJ7Le3IkEGR-wSoOhppjRjqsC6GvEJAZEw';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5reGFlcmlpeml6Zm1xdnVhIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTIwMDMzODIsImV4cCI6MjA2NzU3OTM4Mn0.NOT_REAL_JUST_PLACEHOLDER'; 
// Actually I need to read the anon key from the .env file or just use the one I saw earlier.
// Let's use the one from the .env I read in step 58.
// VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5reGFlcmlpeml6Zm1xdnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDMzODIsImV4cCI6MjA2NzU3OTM4Mn0.vIIvNn31sz1JLW_OMYqqqCF6RHn32jmir4U_AVbHIWU

const REAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5reGFlcmlpeml6Zm1xdnVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIwMDMzODIsImV4cCI6MjA2NzU3OTM4Mn0.vIIvNn31sz1JLW_OMYqqqCF6RHn32jmir4U_AVbHIWU';

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY);
const anonClient = createClient(SUPABASE_URL, REAL_ANON_KEY);

async function checkVisibility() {
    console.log('--- Checking Data Visibility ---');

    // 1. Check total rows using Admin (Bypasses RLS)
    const { count: totalOrders, error: adminError } = await adminClient
        .from('orders')
        .select('*', { count: 'exact', head: true });
    
    if (adminError) console.error('Admin Check Failed:', adminError.message);
    else console.log(`✅ Admin (Service Role) sees: ${totalOrders} orders. (These exist in DB)`);

    // 2. Check total rows using Anon/Frontend Client
    const { count: visibleOrders, error: anonError } = await anonClient
        .from('orders')
        .select('*', { count: 'exact', head: true });

    if (anonError) {
        console.error('Anon Check Failed:', anonError.message);
    } else {
        console.log(`👁️  Frontend (Anon Key) sees:   ${visibleOrders} orders.`);
    }

    if (totalOrders > 0 && visibleOrders === 0) {
        console.log('\n🚨 DIAGNOSIS: RLS is blocking access. The frontend allows 0 orders despite data existing.');
        console.log('   The "orders" table likely has a policy like "Users can only see their own orders".');
        console.log('   We need to add a policy for Admin users.');
    } else {
        console.log('\n✅ Diagnosis: RLS seems fine if counts match. Investigating other issues...');
    }
}

checkVisibility();
