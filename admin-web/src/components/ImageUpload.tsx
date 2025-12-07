import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getImageUrl } from '../lib/imageUtils';
import { X, Image as ImageIcon } from 'lucide-react';
import { useToast } from './ui/Toast';

interface ImageUploadProps {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  helperText?: React.ReactNode;
}

export default function ImageUpload({
  value,
  onChange,
  disabled,
  helperText,
}: ImageUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      onChange(filePath);
      toast('Image uploaded successfully', 'success');
    } catch (error) {
      console.error('Upload error:', error);
      toast((error as Error).message, 'error');
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
        <div className="relative h-48 sm:h-64 w-full overflow-hidden rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
          <img
            src={imageUrl}
            alt="Product"
            className="h-full w-full object-contain"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 rounded-full bg-red-100 dark:bg-red-900/50 p-2 text-red-600 dark:text-red-400 transition-colors hover:bg-red-200 dark:hover:bg-red-900/70 shadow-lg min-w-[36px] min-h-[36px] touch-manipulation"
            >
              <X size={20} />
            </button>
          )}
        </div>
      ) : (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`flex h-48 sm:h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-tertiary)] transition-all ${
            !disabled &&
            'hover:border-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
          } touch-manipulation`}
        >
          <div className="flex flex-col items-center justify-center pb-6 pt-5 px-4">
            <ImageIcon className="mb-4 h-10 w-10 sm:h-12 sm:w-12 text-[var(--text-tertiary)]" />
            <p className="mb-2 text-sm text-[var(--text-primary)] text-center">
              <span className="font-bold">Click to upload</span>
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              {helperText || 'PNG, JPG or WEBP'}
            </p>
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

      {uploading && (
        <div className="text-sm font-semibold text-[var(--text-primary)]">
          Uploading...
        </div>
      )}
    </div>
  );
}
