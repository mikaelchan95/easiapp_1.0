// Quick fix for Château Margaux filename
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

async function fixChateauMargaux() {
  try {
    console.log('🔧 Fixing Château Margaux image URL...');

    const correctImageUrl =
      `${supabaseUrl}/storage/v1/object/public/product-images/products/chateau-margaux-2015-1.png`;

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
