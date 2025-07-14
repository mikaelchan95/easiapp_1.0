// Script to update product image URLs with correct products/ subfolder path
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vqxnkxaeriizizfmqvua.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5reGFlcmlpeml6Zm1xdnVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwMzM4MiwiZXhwIjoyMDY3NTc5MzgyfQ.y7sQCIqVduJ7Le3IkEGR-wSoOhppjRjqsC6GvEJAZEw';

const supabase = createClient(supabaseUrl, supabaseKey);

const productImageUpdates = [
  {
    sku: 'DP2013-750',
    imageUrl:
      'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/dom-perignon-2013.webp',
  },
  {
    sku: 'MAC12-DC-700',
    imageUrl:
      'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/macallan-12-double-cask.webp',
  },
  {
    sku: 'MAC18-SC-700',
    imageUrl:
      'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/macallan-18-sherry-cask.webp',
  },
  {
    sku: 'MAC25-SO-700',
    imageUrl:
      'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/macallan-25-sherry-oak.webp',
  },
  {
    sku: 'MAC30-SC-700',
    imageUrl:
      'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/macallan-30-sherry-cask.webp',
  },
  {
    sku: 'CM2015-750',
    imageUrl:
      'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/chateau-margaux-2015.webp',
  },
  {
    sku: 'HEN-PAR-700',
    imageUrl:
      'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/hennessy-paradis.webp',
  },
  {
    sku: 'JW-BLUE-700',
    imageUrl:
      'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/johnnie-walker-blue.webp',
  },
];

async function updateProductImages() {
  try {
    console.log(
      '🔄 Updating product image URLs with correct products/ subfolder path...'
    );

    for (const update of productImageUpdates) {
      const { data, error } = await supabase
        .from('products')
        .update({ image_url: update.imageUrl })
        .eq('sku', update.sku);

      if (error) {
        console.error(`❌ Error updating ${update.sku}:`, error);
      } else {
        console.log(`✅ Updated ${update.sku} with correct path`);
      }
    }

    console.log('\n🎉 All product image URLs updated with correct paths!');

    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const { data: products, error } = await supabase
      .from('products')
      .select('name, sku, image_url')
      .limit(5);

    if (error) {
      console.error('❌ Error verifying updates:', error);
    } else {
      products?.forEach((product, index) => {
        console.log(`📦 ${product.name} (${product.sku})`);
        console.log(`   Image: ${product.image_url}`);
      });
    }
  } catch (error) {
    console.error('❌ Update error:', error);
  }
}

updateProductImages();
