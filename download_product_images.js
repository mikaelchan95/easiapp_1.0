// Script to search and download product images from online sources
// WARNING: This script is for demonstration purposes only.
// Please ensure you have proper rights to use any images you download.
// Consider using royalty-free image sources or official product images.

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://vqxnkxaeriizizfmqvua.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5reGFlcmlpeml6Zm1xdnVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwMzM4MiwiZXhwIjoyMDY3NTc5MzgyfQ.y7sQCIqVduJ7Le3IkEGR-wSoOhppjRjqsC6GvEJAZEw';

const supabase = createClient(supabaseUrl, supabaseKey);

// High-quality product images from reputable sources
const productImageSources = [
  {
    sku: 'CM2015-750',
    name: 'Château Margaux 2015',
    imageUrl: 'https://images.unsplash.com/photo-1586370434639-0fe43b2d32d6?w=800&h=800&fit=crop&crop=center'
  },
  {
    sku: 'HEN-PAR-700',
    name: 'Hennessy Paradis',
    imageUrl: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800&h=800&fit=crop&crop=center'
  },
  {
    sku: 'JW-BLUE-700',
    name: 'Johnnie Walker Blue Label',
    imageUrl: 'https://images.unsplash.com/photo-1582476572141-0a4c2d5b7d8a?w=800&h=800&fit=crop&crop=center'
  }
];

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloaded_images');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

// Function to download image from URL
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(downloadsDir, filename));
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(filename);
        });
      } else {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
      }
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Function to upload image to Supabase storage
async function uploadToSupabase(localFilePath, bucketPath) {
  try {
    const fileBuffer = fs.readFileSync(localFilePath);
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(bucketPath, fileBuffer, {
        contentType: 'image/webp',
        upsert: true
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

// Main function to download and upload images
async function downloadAndUploadImages() {
  console.log('🔍 Starting image download and upload process...');
  console.log('⚠️  Note: Using placeholder images from Unsplash for demonstration.');
  console.log('⚠️  In production, use official product images or royalty-free sources.');
  
  for (const product of productImageSources) {
    try {
      console.log(`\n📦 Processing ${product.name}...`);
      
      // Download image
      const filename = `${product.sku.toLowerCase()}.webp`;
      console.log(`📥 Downloading image...`);
      await downloadImage(product.imageUrl, filename);
      console.log(`✅ Downloaded: ${filename}`);
      
      // Upload to Supabase
      const bucketPath = `products/${filename}`;
      console.log(`📤 Uploading to Supabase storage...`);
      await uploadToSupabase(path.join(downloadsDir, filename), bucketPath);
      console.log(`✅ Uploaded to: ${bucketPath}`);
      
      // Update database
      const supabaseImageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${bucketPath}`;
      console.log(`📝 Updating database URL...`);
      await updateProductImageUrl(product.sku, supabaseImageUrl);
      console.log(`✅ Updated database for ${product.sku}`);
      
      // Clean up local file
      fs.unlinkSync(path.join(downloadsDir, filename));
      console.log(`🧹 Cleaned up local file`);
      
    } catch (error) {
      console.error(`❌ Error processing ${product.name}:`, error.message);
    }
  }
  
  console.log('\n🎉 Image download and upload process completed!');
  
  // Verify final state
  console.log('\n🔍 Final verification...');
  const { data: products, error } = await supabase
    .from('products')
    .select('name, sku, image_url')
    .in('sku', productImageSources.map(p => p.sku));

  if (error) {
    console.error('❌ Error verifying final state:', error);
  } else {
    products?.forEach((product) => {
      const filename = product.image_url.split('/').pop();
      console.log(`📦 ${product.name} (${product.sku}): ${filename}`);
    });
  }
}

// Alternative function using a more comprehensive image search
async function searchAndDownloadImages() {
  console.log('🔍 Alternative: Using better image sources...');
  
  // You can integrate with image search APIs like:
  // - Unsplash API (free, high quality)
  // - Pexels API (free, high quality)
  // - Google Custom Search API (requires API key)
  // - Bing Image Search API (requires API key)
  
  console.log('💡 To implement comprehensive image search, consider:');
  console.log('   1. Unsplash API: https://unsplash.com/developers');
  console.log('   2. Pexels API: https://www.pexels.com/api/');
  console.log('   3. Official product websites');
  console.log('   4. Wine/spirits databases like Wine-Searcher');
}

// Run the main function
if (require.main === module) {
  downloadAndUploadImages().catch(console.error);
}

module.exports = {
  downloadAndUploadImages,
  searchAndDownloadImages
};