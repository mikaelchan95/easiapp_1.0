// Advanced script to search and download product images using APIs
// This script uses Unsplash API for high-quality product images
// You'll need to sign up for a free Unsplash API key at: https://unsplash.com/developers

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://vqxnkxaeriizizfmqvua.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeG5reGFlcmlpeml6Zm1xdnVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwMzM4MiwiZXhwIjoyMDY3NTc5MzgyfQ.y7sQCIqVduJ7Le3IkEGR-wSoOhppjRjqsC6GvEJAZEw';

// Get your free API key from https://unsplash.com/developers
const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY'; // Replace with your actual key

const supabase = createClient(supabaseUrl, supabaseKey);

// Product search terms for better image matching
const productSearchTerms = [
  {
    sku: 'CM2015-750',
    name: 'Château Margaux 2015',
    searchTerm: 'red wine bottle bordeaux',
    fallbackUrl:
      'https://images.unsplash.com/photo-1586370434639-0fe43b2d32d6?w=800&h=800&fit=crop',
  },
  {
    sku: 'HEN-PAR-700',
    name: 'Hennessy Paradis',
    searchTerm: 'cognac bottle hennessy',
    fallbackUrl:
      'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=800&h=800&fit=crop',
  },
  {
    sku: 'JW-BLUE-700',
    name: 'Johnnie Walker Blue Label',
    searchTerm: 'whisky bottle blue label',
    fallbackUrl:
      'https://images.unsplash.com/photo-1582476572141-0a4c2d5b7d8a?w=800&h=800&fit=crop',
  },
];

// Create downloads directory
const downloadsDir = path.join(__dirname, 'downloaded_images');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

// Function to search images using Unsplash API
function searchUnsplashImages(searchTerm) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.unsplash.com',
      path: `/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=5&orientation=portrait`,
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    };

    const req = https.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.results && result.results.length > 0) {
            // Return the first high-quality image
            const image = result.results[0];
            resolve({
              url: image.urls.regular,
              alt: image.alt_description,
              photographer: image.user.name,
            });
          } else {
            reject(new Error('No images found'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', error => {
      reject(error);
    });

    req.end();
  });
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

// Main function with API integration
async function searchAndDownloadImages() {
  console.log('🔍 Starting advanced image search and download...');

  if (UNSPLASH_ACCESS_KEY === 'YOUR_UNSPLASH_ACCESS_KEY') {
    console.log('⚠️  Please set your Unsplash API key in the script');
    console.log('📝 Get your free API key at: https://unsplash.com/developers');
    console.log('🔄 Falling back to predefined images...');
    return await fallbackDownload();
  }

  for (const product of productSearchTerms) {
    try {
      console.log(`\n📦 Processing ${product.name}...`);

      let imageUrl = product.fallbackUrl;

      // Try to search for better images
      try {
        console.log(`🔍 Searching for: ${product.searchTerm}`);
        const searchResult = await searchUnsplashImages(product.searchTerm);
        imageUrl = searchResult.url;
        console.log(`✅ Found image by ${searchResult.photographer}`);
      } catch (searchError) {
        console.log(`⚠️  Search failed, using fallback image`);
      }

      // Download image
      const filename = `${product.sku.toLowerCase()}.jpg`;
      console.log(`📥 Downloading image...`);
      await downloadImage(imageUrl, filename);
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

  console.log('\n🎉 Advanced image search and upload completed!');
}

// Fallback function without API
async function fallbackDownload() {
  console.log('🔄 Using fallback image download...');

  for (const product of productSearchTerms) {
    try {
      console.log(`\n📦 Processing ${product.name}...`);

      const filename = `${product.sku.toLowerCase()}.jpg`;
      console.log(`📥 Downloading fallback image...`);
      await downloadImage(product.fallbackUrl, filename);
      console.log(`✅ Downloaded: ${filename}`);

      const bucketPath = `products/${filename}`;
      console.log(`📤 Uploading to Supabase storage...`);
      await uploadToSupabase(path.join(downloadsDir, filename), bucketPath);
      console.log(`✅ Uploaded to: ${bucketPath}`);

      const supabaseImageUrl = `${supabaseUrl}/storage/v1/object/public/product-images/${bucketPath}`;
      console.log(`📝 Updating database URL...`);
      await updateProductImageUrl(product.sku, supabaseImageUrl);
      console.log(`✅ Updated database for ${product.sku}`);

      fs.unlinkSync(path.join(downloadsDir, filename));
      console.log(`🧹 Cleaned up local file`);
    } catch (error) {
      console.error(`❌ Error processing ${product.name}:`, error.message);
    }
  }
}

// Instructions for getting better images
function showImageSourceInstructions() {
  console.log('\n💡 For better product images, consider these sources:');
  console.log('');
  console.log('🆓 Free APIs:');
  console.log('   • Unsplash API: https://unsplash.com/developers');
  console.log('   • Pexels API: https://www.pexels.com/api/');
  console.log('   • Pixabay API: https://pixabay.com/api/docs/');
  console.log('');
  console.log('🏪 Official Sources:');
  console.log('   • Visit brand websites directly');
  console.log('   • Wine/spirits databases');
  console.log('   • Product catalogs from distributors');
  console.log('');
  console.log('⚖️  Legal Considerations:');
  console.log('   • Always check image licenses');
  console.log('   • Use images with proper attribution');
  console.log('   • Consider purchasing stock images for commercial use');
}

// Run the script
if (require.main === module) {
  searchAndDownloadImages()
    .then(() => {
      showImageSourceInstructions();
    })
    .catch(console.error);
}

module.exports = {
  searchAndDownloadImages,
  fallbackDownload,
};
