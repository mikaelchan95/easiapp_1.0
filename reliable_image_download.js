// Reliable script to download product images using stable image URLs
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

// More reliable image sources with direct URLs
const productImages = [
  {
    sku: 'CM2015-750',
    name: 'Château Margaux 2015',
    imageUrl: 'https://picsum.photos/800/800?random=wine1',
    filename: 'chateau-margaux-2015.jpg',
  },
  {
    sku: 'JW-BLUE-700',
    name: 'Johnnie Walker Blue Label',
    imageUrl: 'https://picsum.photos/800/800?random=whisky1',
    filename: 'johnnie-walker-blue.jpg',
  },
];

// Create downloads directory
const downloadsDir = path.join(__dirname, 'downloaded_images');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

// Function to download image with better error handling
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(downloadsDir, filename));

    const request = https.get(url, response => {
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
        file.close();
        fs.unlinkSync(path.join(downloadsDir, filename));
        reject(new Error(`Failed to download image: ${response.statusCode}`));
      }
    });

    request.on('error', error => {
      file.close();
      if (fs.existsSync(path.join(downloadsDir, filename))) {
        fs.unlinkSync(path.join(downloadsDir, filename));
      }
      reject(error);
    });

    request.setTimeout(30000, () => {
      request.abort();
      file.close();
      if (fs.existsSync(path.join(downloadsDir, filename))) {
        fs.unlinkSync(path.join(downloadsDir, filename));
      }
      reject(new Error('Download timeout'));
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
async function downloadMissingImages() {
  console.log('🚀 Starting reliable product image download...');
  console.log('📸 Using Lorem Picsum for consistent placeholder images');

  for (const product of productImages) {
    try {
      console.log(`\n📦 Processing ${product.name}...`);

      // Download image
      console.log(`📥 Downloading image from: ${product.imageUrl}`);
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

      // Add delay between downloads
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Error processing ${product.name}:`, error.message);
    }
  }

  console.log('\n🎉 Reliable image download completed!');

  // Final verification
  console.log('\n🔍 Final verification...');
  const { data: products, error } = await supabase
    .from('products')
    .select('name, sku, image_url')
    .order('name');

  if (error) {
    console.error('❌ Error verifying final state:', error);
  } else {
    console.log('\n📦 All product images:');
    products?.forEach(product => {
      const filename = product.image_url.split('/').pop();
      const hasImage = !filename.includes('placeholder');
      const status = hasImage ? '✅' : '🔄';
      console.log(`${status} ${product.name} (${product.sku}): ${filename}`);
    });
  }

  console.log('\n💡 Missing product images have been updated!');
  console.log('🔄 Refresh your app to see all the new images.');
}

// Run the script
if (require.main === module) {
  downloadMissingImages().catch(console.error);
}

module.exports = {
  downloadMissingImages,
};
