import { supabase } from '../../utils/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const storageService = {
  // Upload image to Supabase Storage
  async uploadProductImage(
    imageFile: string | Blob, 
    fileName: string,
    contentType: string = 'image/webp'
  ): Promise<UploadResult> {
    try {
      console.log(`📤 Uploading image: ${fileName}`);
      
      let fileData: ArrayBuffer;
      
      if (typeof imageFile === 'string') {
        // Handle file path or base64 string
        if (imageFile.startsWith('data:')) {
          // Base64 data URL
          const base64Data = imageFile.split(',')[1];
          fileData = decode(base64Data);
        } else if (imageFile.startsWith('file://')) {
          // File system path
          const base64 = await FileSystem.readAsStringAsync(imageFile, {
            encoding: FileSystem.EncodingType.Base64,
          });
          fileData = decode(base64);
        } else {
          throw new Error('Unsupported file format');
        }
      } else {
        // Handle Blob
        fileData = await imageFile.arrayBuffer();
      }

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(`products/${fileName}`, fileData, {
          contentType,
          upsert: true, // Replace if exists
        });

      if (error) {
        console.error('❌ Upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(`products/${fileName}`);

      console.log('✅ Upload successful:', publicUrl);
      return { success: true, url: publicUrl };
    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Upload from local asset
  async uploadAssetImage(
    assetPath: string,
    fileName: string
  ): Promise<UploadResult> {
    try {
      console.log(`📤 Uploading asset: ${assetPath} as ${fileName}`);
      
      // For React Native assets, we need to copy to document directory first
      const documentDirectory = FileSystem.documentDirectory;
      const localPath = `${documentDirectory}${fileName}`;
      
      // Copy asset to local file system
      await FileSystem.copyAsync({
        from: assetPath,
        to: localPath,
      });

      // Read as base64
      const base64 = await FileSystem.readAsStringAsync(localPath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert to ArrayBuffer
      const fileData = decode(base64);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(`products/${fileName}`, fileData, {
          contentType: 'image/webp',
          upsert: true,
        });

      if (error) {
        console.error('❌ Asset upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(`products/${fileName}`);

      // Clean up local file
      await FileSystem.deleteAsync(localPath, { idempotent: true });

      console.log('✅ Asset upload successful:', publicUrl);
      return { success: true, url: publicUrl };
    } catch (error: any) {
      console.error('❌ Asset upload failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Create storage bucket if it doesn't exist
  async createProductImagesBucket(): Promise<boolean> {
    try {
      console.log('🪣 Creating product-images bucket...');
      
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('❌ Error listing buckets:', listError);
        return false;
      }

      const bucketExists = buckets?.some(bucket => bucket.name === 'product-images');
      
      if (bucketExists) {
        console.log('✅ Bucket already exists');
        return true;
      }

      // Create bucket
      const { data, error } = await supabase.storage.createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10485760, // 10MB
      });

      if (error) {
        console.error('❌ Error creating bucket:', error);
        return false;
      }

      console.log('✅ Product images bucket created successfully');
      return true;
    } catch (error) {
      console.error('❌ Bucket creation failed:', error);
      return false;
    }
  },

  // Get public URL for existing image
  getPublicUrl(fileName: string): string {
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(`products/${fileName}`);
    
    return publicUrl;
  },

  // Delete image from storage
  async deleteImage(fileName: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('product-images')
        .remove([`products/${fileName}`]);

      if (error) {
        console.error('❌ Error deleting image:', error);
        return false;
      }

      console.log('✅ Image deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Delete failed:', error);
      return false;
    }
  },

  // List all images in storage
  async listImages(): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from('product-images')
        .list('products/', {
          limit: 100,
          offset: 0,
        });

      if (error) {
        console.error('❌ Error listing images:', error);
        return [];
      }

      return data?.map(file => file.name) || [];
    } catch (error) {
      console.error('❌ List failed:', error);
      return [];
    }
  },
};