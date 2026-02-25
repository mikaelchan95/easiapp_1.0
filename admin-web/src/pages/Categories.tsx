import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Search, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category } from '../types/category';
import Modal from '../components/ui/Modal';

// Helper to generate slug
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

const INITIAL_FORM_DATA = {
  name: '',
  slug: '',
  description: '',
  sort_order: 0,
  is_active: true,
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      // 1. Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // 2. Fetch product counts
      // We can use a separate query or assume we just want counts
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('category');

      if (productsError) throw productsError;

      // Calculate counts
      const counts: Record<string, number> = {};
      productsData?.forEach(p => {
        if (p.category) {
          counts[p.category] = (counts[p.category] || 0) + 1;
        }
      });

      // Merge counts
      const categoriesWithCounts =
        categoriesData?.map(cat => ({
          ...cat,
          count: counts[cat.name] || 0,
        })) || [];

      setCategories(categoriesWithCounts);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category?: Category) => {
    setError(null);
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        sort_order: category.sort_order,
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
      // Determine next sort order
      const maxSortOrder = Math.max(...categories.map(c => c.sort_order), -1);
      setFormData({
        ...INITIAL_FORM_DATA,
        sort_order: maxSortOrder + 1,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormData(INITIAL_FORM_DATA);
    setError(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'name' && !editingCategory) {
      // Auto-generate slug from name if creating new
      setFormData(prev => ({
        ...prev,
        [name]: value,
        slug: generateSlug(value),
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingCategory) {
        // Update
        const { error } = await supabase
          .from('categories')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase.from('categories').insert([formData]);

        if (error) throw error;
      }

      await fetchCategories();
      handleCloseModal();
    } catch (err: any) {
      console.error('Error saving category:', err);
      setError(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);

      if (error) throw error;
      await fetchCategories();
    } catch (err: any) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category: ' + err.message);
    }
  };

  const filteredCategories = categories.filter(
    cat =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Categories
          </h1>
          <p className="mt-1 text-[var(--text-secondary)]">
            Manage product categories and organization
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-2 font-semibold transition-all hover:opacity-90 shadow-sm min-h-[44px] touch-manipulation"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      <div className="mb-6 relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
          size={20}
        />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] pl-10 pr-4 py-2 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-sm">
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text-primary)]"></div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-[var(--text-secondary)]">
            <div className="mb-4 rounded-full bg-[var(--bg-tertiary)] p-4">
              <Tag size={32} />
            </div>
            <h3 className="text-lg font-medium text-[var(--text-primary)]">
              No categories found
            </h3>
            <p className="mt-1">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by creating a new category'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => handleOpenModal()}
                className="mt-4 text-sm font-semibold text-[var(--text-primary)] hover:underline"
              >
                Create Category
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-[var(--bg-tertiary)] text-xs font-bold uppercase text-[var(--text-primary)] tracking-wider">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4">Name</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4">Slug</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4">Products</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4">Sort Order</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4">Status</th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-primary)]">
                {filteredCategories.map(category => (
                  <tr
                    key={category.id}
                    className="hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)] flex-shrink-0">
                          <Tag size={20} />
                        </div>
                        <div>
                          <span className="font-medium text-[var(--text-primary)] block">
                            {category.name}
                          </span>
                          {category.description && (
                            <span className="text-xs text-[var(--text-secondary)] truncate max-w-[200px] block">
                              {category.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)] font-mono text-xs">
                      {category.slug}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-xs font-medium">
                        {category.count || 0} items
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-[var(--text-secondary)]">
                      {category.sort_order}
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          category.is_active
                            ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            category.is_active
                              ? 'bg-[var(--bg-primary)]'
                              : 'bg-[var(--text-tertiary)]'
                          }`}
                        />
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <button
                          onClick={() => handleOpenModal(category)}
                          className="rounded-lg p-2 text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(category.id, category.name)
                          }
                          className="rounded-lg p-2 text-[var(--text-tertiary)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-2 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Slug
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              required
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-2 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all font-mono text-sm"
            />
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              URL-friendly version of the name. Must be unique.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-2 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
                Sort Order
              </label>
              <input
                type="number"
                name="sort_order"
                value={formData.sort_order}
                onChange={handleInputChange}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-2 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all"
              />
            </div>
            <div className="flex items-center pt-8">
              <label className="flex items-center cursor-pointer gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-5 w-5 rounded border-[var(--border-primary)] text-[var(--text-primary)] focus:ring-[var(--text-primary)]"
                />
                <span className="text-[var(--text-primary)] font-medium">
                  Active
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : editingCategory
                  ? 'Save Changes'
                  : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
