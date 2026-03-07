import { supabase } from '../lib/supabase';
import type { Category } from '../types/category';

export interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  image_url: string | null;
}

const generateSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

/** Fetch all categories ordered by sort_order, with product counts. */
async function fetchCategories(): Promise<Category[]> {
  const [catResult, prodResult] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true }),
    supabase.from('products').select('category'),
  ]);

  if (catResult.error) throw catResult.error;
  if (prodResult.error) throw prodResult.error;

  const counts: Record<string, number> = {};
  prodResult.data?.forEach(p => {
    if (p.category) counts[p.category] = (counts[p.category] || 0) + 1;
  });

  return (
    catResult.data?.map(cat => ({
      ...cat,
      count: counts[cat.name] || 0,
    })) ?? []
  );
}

/** Create a new category. Returns the inserted row. */
async function createCategory(data: CategoryFormData): Promise<Category> {
  const { data: row, error } = await supabase
    .from('categories')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return row;
}

/** Update an existing category by id. */
async function updateCategory(
  id: string,
  data: Partial<CategoryFormData>
): Promise<Category> {
  const { data: row, error } = await supabase
    .from('categories')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return row;
}

/** Delete a category by id. */
async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);

  if (error) throw error;
}

/** Toggle active status for a single category. */
async function toggleCategoryActive(
  id: string,
  is_active: boolean
): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Persist new sort_order values after a drag-and-drop reorder.
 * Accepts the full reordered array; assigns sort_order = index.
 */
async function reorderCategories(orderedIds: string[]): Promise<void> {
  const updates = orderedIds.map((id, index) =>
    supabase
      .from('categories')
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq('id', id)
  );

  const results = await Promise.all(updates);
  const failed = results.find(r => r.error);
  if (failed?.error) throw failed.error;
}

/**
 * Upload a category image to the product-images bucket under categories/ folder.
 * Returns the storage path (e.g. "categories/1234abc.jpg").
 */
async function uploadCategoryImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
  const filePath = `categories/${fileName}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file);

  if (error) throw error;
  return filePath;
}

/** Remove a category image from storage. */
async function removeCategoryImage(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('product-images')
    .remove([path]);

  if (error) throw error;
}

export const categoryService = {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryActive,
  reorderCategories,
  uploadCategoryImage,
  removeCategoryImage,
  generateSlug,
};
