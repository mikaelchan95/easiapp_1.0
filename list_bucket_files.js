// Script to list all files in the product-images bucket
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vqxnkxaeriizizfmqvua.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5reGFlcmlpeml6Zm1xdnVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwMzM4MiwiZXhwIjoyMDY3NTc5MzgyfQ.y7sQCIqVduJ7Le3IkEGR-wSoOhppjRjqsC6GvEJAZEw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listBucketFiles() {
  try {
    console.log('🔍 Listing files in product-images bucket...');
    
    const { data: files, error } = await supabase.storage
      .from('product-images')
      .list('products', {
        limit: 50,
        offset: 0
      });

    if (error) {
      console.error('❌ Error listing files:', error);
      return;
    }

    console.log('📂 Files in product-images/products/:');
    files?.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name}`);
    });

    // Also get current database image URLs
    console.log('\n📦 Current database image URLs:');
    const { data: products, error: dbError } = await supabase
      .from('products')
      .select('name, sku, image_url')
      .order('name');

    if (dbError) {
      console.error('❌ Error fetching products:', dbError);
    } else {
      products?.forEach((product) => {
        const filename = product.image_url.split('/').pop();
        console.log(`${product.sku}: ${filename}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listBucketFiles();