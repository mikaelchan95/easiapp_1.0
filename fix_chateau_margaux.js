// Quick fix for Château Margaux filename
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vqxnkxaeriizizfmqvua.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5reGFlcmlpeml6Zm1xdnVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwMzM4MiwiZXhwIjoyMDY3NTc5MzgyfQ.y7sQCIqVduJ7Le3IkEGR-wSoOhppjRjqsC6GvEJAZEw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixChateauMargaux() {
  try {
    console.log('🔧 Fixing Château Margaux image URL...');

    const correctImageUrl =
      'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/chateau-margaux-2015-1.png';

    const { data, error } = await supabase
      .from('products')
      .update({ image_url: correctImageUrl })
      .eq('sku', 'CM2015-750');

    if (error) {
      console.error('❌ Error updating Château Margaux image:', error);
      return;
    }

    console.log('✅ Updated Château Margaux 2015 image URL');

    // Verify the update
    const { data: product, error: verifyError } = await supabase
      .from('products')
      .select('name, sku, image_url')
      .eq('sku', 'CM2015-750')
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
    } else {
      console.log(`✅ Verified: ${product.name} (${product.sku})`);
      const filename = product.image_url.split('/').pop();
      console.log(`   Image: ${filename}`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixChateauMargaux();
