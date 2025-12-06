
import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export default function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/${path}`;
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      onChange(filePath);
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    // Ideally we should delete from storage too, but for safety lets just remove reference
    onChange(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const imageUrl = getImageUrl(value);

  return (
    <div className="space-y-4">
      {imageUrl ? (
        <div className="relative h-64 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          <img
            src={imageUrl}
            alt="Product"
            className="h-full w-full object-contain"
          />
          {!disabled && (
               <button
               type="button"
               onClick={handleRemove}
               className="absolute top-2 right-2 rounded-full bg-red-100 p-2 text-red-600 transition-colors hover:bg-red-200"
             >
               <X size={20} />
             </button>
          )}
        </div>
      ) : (
        <div 
            onClick={() => !disabled && fileInputRef.current?.click()}
            className={`flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-brand-light transition-colors ${!disabled && 'hover:border-brand-dark'}`}
        >
             <div className="flex flex-col items-center justify-center pb-6 pt-5">
                <ImageIcon className="mb-4 h-12 w-12 text-gray-400" />
                <p className="mb-2 text-sm text-brand-dark">
                    <span className="font-bold">Click to upload</span>
                </p>
                <p className="text-xs text-gray-500">PNG, JPG or WEBP</p>
             </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
        disabled={disabled || uploading}
      />
      
      {uploading && <div className="text-sm font-bold text-brand-dark">Uploading...</div>}
    </div>
  );
}
