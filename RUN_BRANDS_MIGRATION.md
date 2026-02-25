# Quick Start: Brands Feature Migration

## Run This Migration Now

### Option 1: Supabase Dashboard (Recommended)

1. Open your Supabase dashboard: https://supabase.com/dashboard/project/vqxnkxaeriizizfmqvua
2. Navigate to **SQL Editor**
3. Copy the entire contents of this file:
   ```
   supabase/migrations/20251210000001_add_brand_to_products.sql
   ```
4. Paste into the SQL Editor
5. Click **Run** or press Cmd/Ctrl + Enter

### Option 2: Supabase CLI

```bash
cd "/Users/mikaelchan/The Winery Dropbox/Mikael Chan/Projects/easiapp_1.0"
npx supabase db push
```

## What This Migration Does

1. ✅ Adds `brand` column to products table
2. ✅ Creates `brands` table with 11 featured brands
3. ✅ Creates database indexes for fast queries
4. ✅ Sets up Row Level Security (RLS) policies
5. ✅ Auto-assigns brands to existing products (Macallan, Hennessy, etc.)

## After Migration

### Verify It Worked

Run this SQL query in Supabase SQL Editor:

```sql
-- Check brands table
SELECT * FROM brands ORDER BY sort_order;

-- Check products with brands
SELECT id, name, brand FROM products WHERE brand IS NOT NULL;

-- Count products per brand
SELECT brand, COUNT(*) as product_count
FROM products
WHERE brand IS NOT NULL
GROUP BY brand
ORDER BY product_count DESC;
```

### Expected Results

- **11 brands** in brands table
- **Several products** with brands assigned (based on product names)
- Ready for admin panel to assign brands to new products

## Test the Feature

### In Admin Panel

1. Navigate to Products → Add Product
2. You should see a **Brand dropdown** next to Category
3. Dropdown should show all 11 brands
4. Select a brand and save

### In Mobile App

1. Open the app
2. Scroll to **"Shop by Brands"** section on home
3. Tap any brand logo (e.g., Macallan)
4. Should open a screen showing all products for that brand

## Troubleshooting

### Migration Fails

- **Error:** "column already exists"
  - Solution: Brand column was already added, skip this part
- **Error:** "table already exists"
  - Solution: Brands table already created, skip this part

### No Brands in Dropdown

- Check brands table exists: `SELECT * FROM brands;`
- Check RLS policies allow reading brands
- Check console for errors in admin panel

### Products Not Showing in Brand Screen

- Verify products have brand assigned
- Check query: `SELECT * FROM products WHERE brand = 'Macallan';`
- Ensure products are `is_active = true`

## Quick Test

After running migration, test with this SQL:

```sql
-- Should return Macallan brand
SELECT * FROM brands WHERE name = 'Macallan';

-- Should return products with Macallan brand
SELECT id, name, brand FROM products WHERE brand = 'Macallan';
```

## Ready to Use! 🎉

Once the migration runs successfully, the brands feature is fully operational!

- Customers can browse by brand ✅
- Admins can assign brands to products ✅
- Brand filtering works automatically ✅








