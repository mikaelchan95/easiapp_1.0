// Simple script to download product images from free sources
// This script uses free, high-quality product images that don't require API keys

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY in environment.'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

// High-quality product images from free sources
const productImages = [
  {
    sku: 'CM2015-750',
    name: 'Château Margaux 2015',
    imageUrl:
      'https://images.unsplash.com/photo-1586370434639-0fe43b2d32d6?w=800&h=800&fit=crop&crop=center&q=80',
    filename: 'cm2015-750.jpg',
  },
  {
    sku: 'HEN-PAR-700',
    name: 'Hennessy Paradis',
    imageUrl:
      'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800&h=800&fit=crop&crop=center&q=80',
    filename: 'hen-par-700.jpg',
  },
  {
    sku: 'JW-BLUE-700',
    name: 'Johnnie Walker Blue Label',
    imageUrl:
      'https://images.unsplash.com/photo-1582476572141-0a4c2d5b7d8a?w=800&h=800&fit=crop&crop=center&q=80',
    filename: 'jw-blue-700.jpg',
  },
];

// Create downloads directory
const downloadsDir = path.join(__dirname, 'downloaded_images');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

// Function to download image from URL
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(downloadsDir, filename));

    https
      .get(url, response => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve(filename);
          });
        } else if (response.statusCode === 301 || response.statusCode === 302) {
          // Handle redirects
          const redirectUrl = response.headers.location;
          file.close();
          fs.unlinkSync(path.join(downloadsDir, filename));
          downloadImage(redirectUrl, filename).then(resolve).catch(reject);
        } else {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
        }
      })
      .on('error', error => {
        reject(error);
      });
  });
}

// Function to upload to Supabase storage
async function uploadToSupabase(localFilePath, bucketPath) {
  try {
    const fileBuffer = fs.readFileSync(localFilePath);

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(bucketPath, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// Function to update product image URL in database
async function updateProductImageUrl(sku, imageUrl) {
  const { data, error } = await supabase
    .from('products')
    .update({ image_url: imageUrl })
    .eq('sku', sku);

  if (error) {
    throw error;
  }

  return data;
}

// Main function
async function downloadProductImages() {
  console.log('🚀 Starting simple product image download...');
  console.log('📸 Using high-quality free images from Unsplash');

  for (const product of productImages) {
    try {
      console.log(`\n📦 Processing ${product.name}...`);

      // Download image
      console.log(`📥 Downloading image...`);
      await downloadImage(product.imageUrl, product.filename);
      console.log(`✅ Downloaded: ${product.filename}`);

      // Upload to Supabase
      const bucketPath = `products/${product.filename}`;
      console.log(`📤 Uploading to Supabase storage...`);
      await uploadToSupabase(
        path.join(downloadsDir, product.filename),
        bucketPath
      );
      console.log(`✅ Uploaded to: ${bucketPath}`);

      // Update database
      const supabaseImageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${bucketPath}`;
      console.log(`📝 Updating database URL...`);
      await updateProductImageUrl(product.sku, supabaseImageUrl);
      console.log(`✅ Updated database for ${product.sku}`);

      // Clean up local file
      fs.unlinkSync(path.join(downloadsDir, product.filename));
      console.log(`🧹 Cleaned up local file`);

      // Add a small delay to be respectful to the image service
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Error processing ${product.name}:`, error.message);
    }
  }

  console.log('\n🎉 Image download and upload completed!');

  // Final verification
  console.log('\n🔍 Final verification...');
  const { data: products, error } = await supabase
    .from('products')
    .select('name, sku, image_url')
    .in(
      'sku',
      productImages.map(p => p.sku)
    );

  if (error) {
    console.error('❌ Error verifying final state:', error);
  } else {
    products?.forEach(product => {
      const filename = product.image_url.split('/').pop();
      console.log(`📦 ${product.name} (${product.sku}): ${filename}`);
    });
  }

  console.log('\n💡 All missing product images have been updated!');
  console.log('🔄 Refresh your app to see the new images.');
}

// Run the script
if (require.main === module) {
  downloadProductImages().catch(console.error);
}

module.exports = {
  downloadProductImages,
};
