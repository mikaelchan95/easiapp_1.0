# Fix: Order Detail "Not Found" Issue

## Problem

The order detail page shows "Order not found" because Row Level Security (RLS) policies are blocking access for admin users.

## Root Cause

The current RLS policies on the `orders` table only allow:

1. Users to view their own orders
2. Company users with specific permissions to view company orders
3. Company superadmins/managers to view their company's orders

**Missing:** Policy for admin panel users to view ALL orders.

## Solution

### Option 1: Apply Migration (Recommended)

Run the new migration that adds admin access policies:

```bash
# Using Supabase CLI
cd /Users/mikaelchan/The\ Winery\ Dropbox/Mikael\ Chan/Projects/easiapp_1.0
supabase db push
```

Or manually apply via Supabase Dashboard:

1. Go to SQL Editor in your Supabase dashboard
2. Run the contents of `supabase/migrations/20251207000000_add_admin_orders_access.sql`

This will:

- Add `is_admin` column to users table
- Set existing admin users (mikael@thewinery.com.sg, vincent@thewinery.com.sg) as admin
- Create RLS policies allowing admin users to view/update ALL orders

### Option 2: Quick Fix - Disable RLS for Testing

**Temporary solution for development only:**

In Supabase Dashboard > Database > Tables:

1. Find `orders` table
2. Click the RLS badge
3. Temporarily disable RLS

**⚠️ Warning:** This removes all access control. Re-enable after testing!

### Option 3: Use Service Role Key

Update `admin-web/src/lib/supabase.ts` to use service role key instead of anon key:

```typescript
// Use service role key for admin panel (bypasses RLS)
const supabaseKey =
  import.meta.env.VITE_SUPABASE_SERVICE_KEY ||
  import.meta.env.VITE_SUPABASE_KEY;
```

Then add to `admin-web/.env`:

```
VITE_SUPABASE_SERVICE_KEY=your_service_role_key
```

**⚠️ Warning:** Service role key has full access. Keep it secure!

## Verification Steps

### 1. Check Current User

Open browser console on admin-web and run:

```javascript
const {
  data: { user },
} = await supabase.auth.getUser();
console.log('Current user:', user);
```

### 2. Check User's Admin Status

```javascript
const { data: userData } = await supabase
  .from('users')
  .select('*')
  .eq('id', user.id)
  .single();
console.log('User data:', userData);
console.log('Is admin:', userData?.is_admin);
console.log('Role:', userData?.role);
```

### 3. Test Order Access

```javascript
const { data: orders, error } = await supabase
  .from('orders')
  .select('*')
  .limit(5);
console.log('Orders:', orders);
console.log('Error:', error);
```

### 4. Check if Order Exists

```javascript
const orderId = '38c98708-531b-4470-a971-efa042a3dece';
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('id', orderId)
  .single();
console.log('Specific order:', data);
console.log('Error:', error);
```

## Alternative: Seed Data

If the order truly doesn't exist, seed the database:

```bash
cd admin-web
node seed_data.js
```

This will create sample orders, including test data.

## Testing

After applying the fix:

1. **Login to admin-web** with your admin account
2. **Navigate to Orders** page
3. **Click any order** - should load successfully
4. **Check browser console** - should see logs showing order loaded
5. **Try the specific order**: `38c98708-531b-4470-a971-efa042a3dece`

## Debug Tool

Use the included debug tool to verify:

1. Open `admin-web/debug_db.html` in browser
2. Enter your Supabase URL and anon key when prompted
3. Click "Test Connection"
4. Enter the order ID `38c98708-531b-4470-a971-efa042a3dece`
5. Click "Check Order"
6. Click "List Recent Orders" to see all orders

## Next Steps

1. ✅ Apply migration (Option 1)
2. ✅ Verify admin users have `is_admin = true`
3. ✅ Test order access in admin panel
4. ✅ If still not found, check if order exists in database
5. ✅ If order doesn't exist, run seed data

## Support

If issues persist:

1. Check Supabase logs for RLS policy errors
2. Verify user is authenticated in admin-web
3. Confirm user exists in users table with is_admin flag
4. Check browser console for detailed error messages
