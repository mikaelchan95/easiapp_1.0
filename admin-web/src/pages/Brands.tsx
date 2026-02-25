import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { brandsService, type Brand } from '../services/brandsService';
import { useToast } from '../components/ui/Toast';
import Modal from '../components/ui/Modal';

const INITIAL_FORM_DATA = {
  name: '',
  logo_url: '',
  description: '',
  sort_order: 0,
  is_active: true,
};

export default function Brands() {
  const { toast } = useToast();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const data = await brandsService.getAllBrands();

      // Get product counts
      const { data: productsData } = await supabase
        .from('products')
        .select('brand');

      const counts: Record<string, number> = {};
      productsData?.forEach(p => {
        if (p.brand) {
          counts[p.brand] = (counts[p.brand] || 0) + 1;
        }
      });

      const brandsWithCounts = data.map(brand => ({
        ...brand,
        product_count: counts[brand.name] || 0,
      }));

      setBrands(brandsWithCounts);
    } catch (err) {
      console.error('Error fetching brands:', err);
      toast('Failed to load brands', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (brand?: Brand) => {
    if (brand) {
      setEditingBrand(brand);
      setFormData({
        name: brand.name,
        logo_url: brand.logo_url || '',
        description: brand.description || '',
        sort_order: brand.sort_order,
        is_active: brand.is_active,
      });
    } else {
      setEditingBrand(null);
      const maxSortOrder = Math.max(...brands.map(b => b.sort_order), -1);
      setFormData({
        ...INITIAL_FORM_DATA,
        sort_order: maxSortOrder + 1,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBrand(null);
    setFormData(INITIAL_FORM_DATA);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast('Brand name is required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingBrand) {
        // Update
        const { error } = await supabase
          .from('brands')
          .update({
            name: formData.name,
            logo_url: formData.logo_url || null,
            description: formData.description || null,
            sort_order: formData.sort_order,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingBrand.id);

        if (error) throw error;
        toast('Brand updated successfully', 'success');
      } else {
        // Create
        const brand = await brandsService.createBrand(formData.name);
        if (brand && (formData.logo_url || formData.description)) {
          await supabase
            .from('brands')
            .update({
              logo_url: formData.logo_url || null,
              description: formData.description || null,
              sort_order: formData.sort_order,
            })
            .eq('id', brand.id);
        }
        toast('Brand created successfully', 'success');
      }

      handleCloseModal();
      fetchBrands();
    } catch (err) {
      console.error('Error saving brand:', err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? (err as any).message
            : 'Failed to save brand';
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brand: Brand) => {
    if (
      !confirm(
        `Delete "${brand.name}"? This cannot be undone. Products using this brand will have their brand field cleared.`
      )
    )
      return;

    try {
      // Clear brand from products
      await supabase
        .from('products')
        .update({ brand: null })
        .eq('brand', brand.name);

      // Delete brand
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', brand.id);

      if (error) throw error;
      toast('Brand deleted successfully', 'success');
      fetchBrands();
    } catch (err) {
      console.error('Error deleting brand:', err);
      toast('Failed to delete brand', 'error');
    }
  };

  const handleToggleStatus = async (brand: Brand) => {
    try {
      const { error } = await supabase
        .from('brands')
        .update({ is_active: !brand.is_active })
        .eq('id', brand.id);

      if (error) throw error;
      fetchBrands();
    } catch (err) {
      console.error('Error toggling brand status:', err);
      toast('Failed to update brand status', 'error');
    }
  };

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
          Brands
        </h1>
        <div className="flex gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
              size={18}
            />
            <input
              type="text"
              placeholder="Search brands..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] py-2.5 pl-10 pr-4 focus:border-[var(--text-primary)] focus:outline-none transition-all"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-2.5 font-semibold transition-all hover:opacity-90"
          >
            <Plus size={18} />
            Add Brand
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--text-primary)]"></div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBrands.map(brand => (
            <div
              key={brand.id}
              className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] flex-shrink-0">
                    <Tag size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[var(--text-primary)] truncate">
                      {brand.name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {/* @ts-ignore */}
                      {brand.product_count || 0} products
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleStatus(brand)}
                  className={`flex-shrink-0 text-xs px-2 py-1 rounded ${
                    brand.is_active
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] dark:bg-[var(--bg-tertiary)] dark:text-[var(--text-tertiary)]'
                  }`}
                >
                  {brand.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>

              {brand.description && (
                <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                  {brand.description}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(brand)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(brand)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-[var(--bg-primary)] px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredBrands.length === 0 && (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          <Tag size={48} className="mx-auto mb-4 text-[var(--text-tertiary)]" />
          <p className="text-lg font-medium text-[var(--text-primary)]">
            No brands found
          </p>
          <p className="text-sm">
            {searchTerm
              ? 'Try a different search term'
              : 'Create your first brand to get started'}
          </p>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingBrand ? 'Edit Brand' : 'Create Brand'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Brand Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2.5 focus:border-[var(--text-primary)] focus:outline-none transition-all"
              placeholder="e.g., Macallan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={e =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2.5 focus:border-[var(--text-primary)] focus:outline-none transition-all resize-none"
              placeholder="Optional brand description"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={e =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
              className="h-4 w-4 rounded border-[var(--border-primary)] text-[var(--text-primary)]"
            />
            <label
              htmlFor="is_active"
              className="text-sm font-medium text-[var(--text-primary)]"
            >
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={handleCloseModal}
              disabled={saving}
              className="rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {saving ? 'Saving...' : 'Save Brand'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
