// Script to fix Johnnie Walker Blue Label image filename
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vqxnkxaeriizizfmqvua.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5reGFlcmlpeml6Zm1xdnVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwMzM4MiwiZXhwIjoyMDY3NTc5MzgyfQ.y7sQCIqVduJ7Le3IkEGR-wSoOhppjRjqsC6GvEJAZEw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixImageUrls() {
  try {
    console.log('🔧 Fixing product image URLs...');

    const imageUpdates = [
      {
        sku: 'JW-BLUE-700',
        name: 'Johnnie Walker Blue Label',
        imageUrl:
          'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/Johnnie-Walker-Blue-Label-750ml-600x600.webp',
      },
      {
        sku: 'HEN-PAR-700',
        name: 'Hennessy Paradis',
        imageUrl:
          'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/HENNESSY-PARADIS-70CL-CARAFE-2000x2000px.webp',
      },
      {
        sku: 'CM2015-750',
        name: 'Château Margaux 2015',
        imageUrl:
          'https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/chateau-margaux-2015.jpg',
      },
    ];

    for (const update of imageUpdates) {
      const { data, error } = await supabase
        .from('products')
        .update({ image_url: update.imageUrl })
        .eq('sku', update.sku);

      if (error) {
        console.error(`❌ Error updating ${update.name}:`, error);
        continue;
      }

      console.log(`✅ Updated ${update.name} image URL`);

      // Verify the update
      const { data: product, error: verifyError } = await supabase
        .from('products')
        .select('name, sku, image_url')
        .eq('sku', update.sku)
        .single();

      if (verifyError) {
        console.error(`❌ Error verifying ${update.name}:`, verifyError);
      } else {
        console.log(`✅ Verified: ${product.name} (${product.sku})`);
        const filename = product.image_url.split('/').pop();
        console.log(`   Image: ${filename}`);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Also check and fix any other filename mismatches
async function checkAllImageUrls() {
  try {
    console.log('\n🔍 Checking all product image URLs...');

    const { data: products, error } = await supabase
      .from('products')
      .select('name, sku, image_url')
      .order('name');

    if (error) {
      console.error('❌ Error fetching products:', error);
      return;
    }

    console.log('\n📦 All product images:');
    products?.forEach(product => {
      const filename = product.image_url.split('/').pop();
      console.log(`${product.name} (${product.sku}): ${filename}`);
    });

    // Test accessibility of image URLs
    console.log('\n🔗 Testing image URL accessibility...');
    const https = require('https');

    for (const product of products) {
      try {
        await new Promise((resolve, reject) => {
          const req = https.request(
            product.image_url,
            { method: 'HEAD' },
            res => {
              if (res.statusCode === 200) {
                console.log(`✅ ${product.name}: Image accessible`);
              } else {
                console.log(
                  `❌ ${product.name}: Image returns ${res.statusCode}`
                );
              }
              resolve();
            }
          );

          req.on('error', error => {
            console.log(`❌ ${product.name}: ${error.message}`);
            resolve();
          });

          req.setTimeout(5000, () => {
            req.abort();
            console.log(`⏰ ${product.name}: Request timeout`);
            resolve();
          });

          req.end();
        });
      } catch (error) {
        console.log(`❌ ${product.name}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the fixes
async function runFixes() {
  await fixImageUrls();
  await checkAllImageUrls();
  console.log('\n🎉 All fixes completed!');
  console.log('🔄 Refresh your app to see the updated images.');
}

if (require.main === module) {
  runFixes().catch(console.error);
}

module.exports = {
  fixImageUrls,
  checkAllImageUrls,
};
