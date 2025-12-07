import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrder() {
  const orderId = '38c98708-531b-4470-a971-efa042a3dece';

  console.log('\n=== Checking Order ===');
  console.log('Order ID:', orderId);

  // Try to fetch the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError) {
    console.error('\n❌ Error fetching order:', orderError);
  } else if (!order) {
    console.log('\n❌ Order not found in database');
  } else {
    console.log('\n✅ Order found:');
    console.log('Order Number:', order.order_number);
    console.log('Status:', order.status);
    console.log('User ID:', order.user_id);
    console.log('Company ID:', order.company_id);
    console.log('Total:', order.total);
    console.log('Created:', order.created_at);
  }

  // Check if order exists with order_number
  const { data: orderByNumber, error: numberError } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', 'ORD-2025-321889')
    .single();

  console.log('\n=== Checking by Order Number ===');
  if (numberError) {
    console.error('❌ Error:', numberError);
  } else if (!orderByNumber) {
    console.log('❌ Order not found by order_number');
  } else {
    console.log('✅ Found by order_number:');
    console.log('ID:', orderByNumber.id);
    console.log('Order Number:', orderByNumber.order_number);
  }

  // List all orders
  console.log('\n=== All Orders in Database ===');
  const { data: allOrders, error: allError } = await supabase
    .from('orders')
    .select('id, order_number, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (allError) {
    console.error('❌ Error fetching orders:', allError);
  } else {
    console.log(`Found ${allOrders?.length || 0} orders (showing last 10):`);
    allOrders?.forEach(o => {
      console.log(
        `- ${o.order_number} (${o.id.substring(0, 8)}...) - ${o.status}`
      );
    });
  }

  // Check RLS policies
  console.log('\n=== Checking RLS Policies ===');
  const { data: policies, error: policyError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
        FROM pg_policies 
        WHERE tablename = 'orders';
      `,
    })
    .catch(() => {
      // If RPC doesn't exist, try direct query
      return supabase.from('pg_policies').select('*').eq('tablename', 'orders');
    });

  if (policies) {
    console.log('RLS Policies on orders table:', policies);
  }
}

checkOrder().catch(console.error);
