// Script to fix filename mismatches between bucket and database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vqxnkxaeriizizfmqvua.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5reGFlcmlpeml6Zm1xdnVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwMzM4MiwiZXhwIjoyMDY3NTc5MzgyfQ.y7sQCIqVduJ7Le3IkEGR-wSoOhppjRjqsC6GvEJAZEw';

const supabase = createClient(supabaseUrl, supabaseKey);

const correctImageMappings = [
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
      'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/macallan-18-sherry-oak.webp',
  },
  {
    sku: 'MAC25-SO-700',
    imageUrl:
      'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/macallan-25-sherry-oak.webp',
  },
  {
    sku: 'MAC30-SC-700',
    imageUrl:
      'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/macallan-30-sherry-oak.webp',
  },
  // For missing images, use placeholder
  {
    sku: 'CM2015-750',
    imageUrl:
      'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/placeholder-product.webp',
  },
  {
    sku: 'HEN-PAR-700',
    imageUrl:
      'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/placeholder-product.webp',
  },
  {
    sku: 'JW-BLUE-700',
    imageUrl:
      'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/placeholder-product.webp',
  },
];

async function fixImageMappings() {
  try {
    console.log('🔧 Fixing filename mismatches...');

    for (const mapping of correctImageMappings) {
      const { data, error } = await supabase
        .from('products')
        .update({ image_url: mapping.imageUrl })
        .eq('sku', mapping.sku);

      if (error) {
        console.error(`❌ Error updating ${mapping.sku}:`, error);
      } else {
        const filename = mapping.imageUrl.split('/').pop();
        console.log(`✅ Updated ${mapping.sku} -> ${filename}`);
      }
    }

    console.log('\n🎉 All filename mismatches fixed!');

    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const { data: products, error } = await supabase
      .from('products')
      .select('name, sku, image_url')
      .order('name');

    if (error) {
      console.error('❌ Error verifying updates:', error);
    } else {
      products?.forEach(product => {
        const filename = product.image_url.split('/').pop();
        console.log(`📦 ${product.name} (${product.sku}): ${filename}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixImageMappings();
