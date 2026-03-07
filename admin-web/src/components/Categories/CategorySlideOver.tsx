import { useState, useEffect, useRef } from 'react';
import {
  X,
  Tag,
  Upload,
  Trash2,
  Edit,
  Lock,
  Info,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { getImageUrl } from '../../lib/imageUtils';
import { categoryService } from '../../services/categoryService';
import type { CategoryFormData } from '../../services/categoryService';
import type { Category } from '../../types/category';

interface CategorySlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSaved: () => void;
  nextSortOrder: number;
}

const INITIAL_FORM: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  sort_order: 0,
  is_active: true,
  image_url: null,
};

export default function CategorySlideOver({
  isOpen,
  onClose,
  category,
  onSaved,
  nextSortOrder,
}: CategorySlideOverProps) {
  const [form, setForm] = useState<CategoryFormData>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setForm({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        sort_order: category.sort_order,
        is_active: category.is_active,
        image_url: category.image_url || null,
      });
    } else {
      setForm({ ...INITIAL_FORM, sort_order: nextSortOrder });
    }
    setError(null);
  }, [category, nextSortOrder, isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleNameChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      name: value,
      slug: isEditing ? prev.slug : categoryService.generateSlug(value),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const path = await categoryService.uploadCategoryImage(file);
      setForm(prev => ({ ...prev, image_url: path }));
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageRemove = () => {
    setForm(prev => ({ ...prev, image_url: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Category name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEditing) {
        await categoryService.updateCategory(category!.id, form);
      } else {
        await categoryService.createCategory(form);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Save failed:', err);
      setError(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const imageUrl = getImageUrl(form.image_url);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-[var(--bg-primary)] h-full shadow-2xl flex flex-col overflow-hidden animate-slide-in-right">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-[var(--border-primary)] px-6 py-4">
          <div className="flex items-center gap-3">
            <Tag size={20} className="text-[var(--color-primary)]" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {isEditing ? 'Edit Category' : 'Add Category'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full w-9 h-9 hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)]"
          >
            <X size={20} />
          </button>
        </header>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Image Upload */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
              Category Image
            </h3>

            {imageUrl ? (
              <div className="relative group rounded-xl border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-2">
                <div className="aspect-video w-full rounded-lg overflow-hidden relative">
                  <img
                    src={imageUrl}
                    alt={form.name || 'Category'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white text-[var(--text-primary)] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg"
                    >
                      <Edit size={12} /> Change
                    </button>
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
                {form.image_url && (
                  <div className="mt-3 px-2 flex justify-between items-center">
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {form.image_url.split('/').pop()}
                    </p>
                    <CheckCircle
                      size={16}
                      className="text-emerald-500 shrink-0"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center cursor-pointer rounded-xl border-2 border-dashed border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-8 transition-all hover:border-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              >
                {uploading ? (
                  <Loader2
                    size={32}
                    className="text-[var(--text-tertiary)] animate-spin mb-2"
                  />
                ) : (
                  <Upload
                    size={32}
                    className="text-[var(--text-tertiary)] mb-2"
                  />
                )}
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {uploading ? 'Uploading...' : 'Click to upload'}
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  PNG, JPG, or WEBP
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </section>

          {/* General Information */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              General Information
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Category Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Enter category name"
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-2.5 focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                Slug
                <Info size={14} className="text-[var(--text-tertiary)]" />
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.slug}
                  readOnly
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-4 py-2.5 font-mono text-sm"
                />
                <Lock
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of the category..."
                rows={4}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-2.5 focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all resize-none"
              />
            </div>
          </section>

          {/* Visibility */}
          <section className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
              Visibility Settings
            </h3>
            <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)]">
              <div>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Active Status
                </span>
                <span className="text-xs text-[var(--text-tertiary)] block">
                  Visible to customers in the app
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={form.is_active}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                />
                <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]" />
              </label>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="p-6 border-t border-[var(--border-primary)] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg text-[var(--text-primary)] font-bold text-sm hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="px-8 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-bold text-sm shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving
              ? 'Saving...'
              : isEditing
                ? 'Update Category'
                : 'Create Category'}
          </button>
        </footer>
      </div>
    </div>
  );
}
