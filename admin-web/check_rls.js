
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const REAL_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !REAL_ANON_KEY) {
    throw new Error(
        'Missing EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_KEY, or SUPABASE_SERVICE_KEY in environment.'
    );
}

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
