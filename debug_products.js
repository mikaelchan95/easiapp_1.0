// Debug script to check product data from Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vqxnkxaeriizizfmqvua.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5reGFlcmlpeml6Zm1xdnVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwMzM4MiwiZXhwIjoyMDY3NTc5MzgyfQ.y7sQCIqVduJ7Le3IkEGR-wSoOhppjRjqsC6GvEJAZEw';

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