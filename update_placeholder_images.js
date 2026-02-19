// Script to update product image URLs with working placeholder images
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

const productImageUpdates = [
  {
    sku: 'DP2013-750',
    imageUrl: 'https://picsum.photos/400/400?random=1',
  },
  {
    sku: 'MAC12-DC-700',
    imageUrl: 'https://picsum.photos/400/400?random=2',
  },
  {
    sku: 'MAC18-SC-700',
    imageUrl: 'https://picsum.photos/400/400?random=3',
  },
  {
    sku: 'MAC25-SO-700',
    imageUrl: 'https://picsum.photos/400/400?random=4',
  },
  {
    sku: 'MAC30-SC-700',
    imageUrl: 'https://picsum.photos/400/400?random=5',
  },
  {
    sku: 'CM2015-750',
    imageUrl: 'https://picsum.photos/400/400?random=6',
  },
  {
    sku: 'HEN-PAR-700',
    imageUrl: 'https://picsum.photos/400/400?random=7',
  },
  {
    sku: 'JW-BLUE-700',
    imageUrl: 'https://picsum.photos/400/400?random=8',
  },
];

async function updateProductImages() {
  try {
    console.log('🔄 Updating product image URLs with placeholder images...');

    for (const update of productImageUpdates) {
      const { data, error } = await supabase
        .from('products')
        .update({ image_url: update.imageUrl })
        .eq('sku', update.sku);

      if (error) {
        console.error(`❌ Error updating ${update.sku}:`, error);
      } else {
        console.log(`✅ Updated ${update.sku} with placeholder image`);
      }
    }

    console.log(
      '\n🎉 All product image URLs updated with working placeholders!'
    );

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
