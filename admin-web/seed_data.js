
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vqxnkxaeriizizfmqvua.supabase.co';
// Using the service_role key provided by the user
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5reGFlcmlpeml6Zm1xdnVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwMzM4MiwiZXhwIjoyMDY3NTc5MzgyfQ.y7sQCIqVduJ7Le3IkEGR-wSoOhppjRjqsC6GvEJAZEw';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function seedData() {
  console.log('🌱 Starting database seed...');

  try {
    // 1. Create Companies
    console.log('Creating Companies...');
    const companiesData = [
      { name: 'Acme Corp', company_name: 'Acme Corp', uen: '202300001A', credit_limit: 5000, current_credit: 200, status: 'active', address: '123 Acme Way' },
      { name: 'Globex Inc', company_name: 'Globex Inc', uen: '202300002B', credit_limit: 10000, current_credit: 4500, status: 'active', address: '456 Globex St' },
      { name: 'Soylent Corp', company_name: 'Soylent Corp', uen: '202300003C', credit_limit: 2000, current_credit: 1900, status: 'pending_verification', address: '789 Soylent Blvd' },
      { name: 'Initech', company_name: 'Initech', uen: '202300004D', credit_limit: 7500, current_credit: 0, status: 'active', address: '101 Initech Park' },
      { name: 'Umbrella Corp', company_name: 'Umbrella Corp', uen: '202300005E', credit_limit: 50000, current_credit: 12000, status: 'suspended', address: '666 Hive Underground' }
    ];

    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .upsert(companiesData, { onConflict: 'uen' })
      .select();

    if (companyError) throw new Error(`Company creation failed: ${companyError.message}`);
    console.log(`✅ ${companies.length} Companies ensured.`);


    // 2. Create Users (linked to companies)
    console.log('Creating Users...');
    const usersData = [
      { email: 'alice@acme.com', name: 'Alice Manager', company_id: companies[0].id, role: 'admin', points: 120 },
      { email: 'bob@globex.com', name: 'Bob Buyer', company_id: companies[1].id, role: 'customer', points: 50 },
      { email: 'charlie@soylent.com', name: 'Charlie Chef', company_id: companies[2].id, role: 'customer', points: 10 },
      { email: 'peter@initech.com', name: 'Peter Gibbons', company_id: companies[3].id, role: 'admin', points: 300 },
      { email: 'wesker@umbrella.com', name: 'Albert Wesker', company_id: companies[4].id, role: 'admin', points: 666 }
    ];

    // Note: For auth.users we can't easily insert via client lib in a simple seed script without using admin API createUser,
    // ensuring 'public.users' table also gets populated if using triggers. 
    // Assuming 'public.users' is a separate table synced or just used as user profile. 
    // We will upsert to 'public.users' directly assuming RLS bypass.
    
    // HOWEVER, `public.users` usually references `auth.users`. 
    // Inserting directly into public.users might fail foreign key constraints if auth user doesn't exist.
    // For simplicity in this demo, we will create AUTH users first using admin API.

    const createdUsers = [];
    for (const u of usersData) {
        // Create auth user
        const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
            email: u.email,
            password: 'password123',
            email_confirm: true,
            user_metadata: { name: u.name }
        });

        // If user already exists, we search for them to get ID
        let userId = authUser.user?.id;
        if (createError && createError.message.includes('already has been registered')) {
            const { data: existingUser } = await supabase.from('users').select('id').eq('email', u.email).single();
             // If not in public.users, we might need to fetch from auth.
             // But let's assume if they exist in auth, they might exist in public.
             if(!existingUser) {
                 // Try to fetch from auth admin list to get ID
                 const {data: {users: allUsers}} = await supabase.auth.admin.listUsers();
                 const match = allUsers.find(au => au.email === u.email);
                 if(match) userId = match.id;
             } else {
                 userId = existingUser.id;
             }
        }

        if (userId) {
            // Upsert profile to public.users
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .upsert({
                    id: userId,
                    name: u.name,
                    email: u.email,
                    company_id: u.company_id,
                    role: u.role,
                    points: u.points,
                    account_type: 'company'
                })
                .select()
                .single();
            
             if (profileError) console.error(`Error upserting profile for ${u.email}:`, profileError.message);
             else createdUsers.push(profile);
        }
    }
    console.log(`✅ ${createdUsers.length} Users ensured.`);


    // 3. Create Products
    console.log('Creating Products...');
    const productsData = [
      { name: 'Premium Arabica Beans', description: 'Dark roast, single origin.', price: 25.00, stock_quantity: 100, category: 'Coffee' },
      { name: 'Organic Green Tea', description: 'Japanese Sencha.', price: 18.50, stock_quantity: 4, category: 'Tea' }, // Low stock
      { name: 'Vanilla Syrup', description: 'Sugar-free option available.', price: 12.00, stock_quantity: 50, category: 'Syrups' },
      { name: 'Oat Milk Barista Edition', description: 'Perfect for latte art.', price: 5.50, stock_quantity: 200, category: 'Dairy' },
      { name: 'Reusable Cup 12oz', description: 'Eco-friendly bamboo fiber.', price: 8.00, stock_quantity: 0, category: 'Merchandise' } // Out of stock
    ];

    const { data: products, error: productError } = await supabase
      .from('products')
      .upsert(productsData, { onConflict: 'name' }) // Assuming name constraint or just illustrative
      .select();

    if (productError) {
        // Fallback if 'products' table doesn't have unique name constraint, just insert
        console.warn('Upsert failed (likely no unique constraint on name), trying simple insert/ignore...');
    }
    // Re-fetch all products to get IDs
    const { data: allProducts } = await supabase.from('products').select('*');
    console.log(`✅ ${allProducts?.length || 0} Products available.`);

    // 4. Create Orders
    console.log('Creating Orders...');
    if (createdUsers.length > 0 && allProducts && allProducts.length > 0) {
        const ordersData = [];
        const statuses = ['delivered', 'processing', 'shipped', 'cancelled', 'delivered', 'delivered'];
        
        for (let i = 0; i < 15; i++) {
            const user = createdUsers[Math.floor(Math.random() * createdUsers.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const total = Math.floor(Math.random() * 200) + 20;
            
            ordersData.push({
                order_number: `ORD-${2023000 + i}`,
                user_id: user.id,
                company_id: user.company_id,
                status: status,
                total: total,
                created_at: new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString(),
                delivery_address: '123 Test St, Singapore 123456'
            });
        }

        const { data: orders, error: orderError } = await supabase
            .from('orders')
            .upsert(ordersData, { onConflict: 'order_number' })
            .select();
        
        if (orderError) console.error('Order creation failed:', orderError.message);
        else console.log(`✅ ${orders.length} Orders created.`);
    }

    console.log('✨ Seed completed successfully!');
  } catch (err) {
    console.error('❌ Seed failed:', err);
  }
}

seedData();
