// Debug script to check product data from Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in environment.'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProducts() {
  try {
    console.log('🔍 Fetching products from Supabase...');

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .limit(3);

    if (error) {
      console.error('❌ Error fetching products:', error);
      return;
    }

    console.log('✅ Products fetched successfully!');
    console.log('📊 Product count:', products?.length || 0);

    products?.forEach((product, index) => {
      console.log(`\n📦 Product ${index + 1}:`);
      console.log(`  Name: ${product.name}`);
      console.log(`  SKU: ${product.sku}`);
      console.log(`  Image URL: ${product.image_url}`);
      console.log(`  Retail Price: ${product.retail_price}`);
      console.log(`  Category: ${product.category}`);
    });
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugProducts();
