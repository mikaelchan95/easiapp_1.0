import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import type { RewardCatalogItem } from '../../types/reward';
import { Button } from '../ui/Button';
import ImageUpload from '../ImageUpload';

interface RewardFormProps {
  reward?: RewardCatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<RewardCatalogItem>) => Promise<void>;
}

const INITIAL_FORM: Partial<RewardCatalogItem> = {
  title: '',
  description: '',
  points_required: 100,
  reward_type: 'voucher',
  reward_value: 0,
  validity_days: 30,
  stock_quantity: 100,
  is_active: true,
  image_url: '',
  logo_url: '',
  terms_conditions: '',
};

export const RewardForm = ({
  reward,
  isOpen,
  onClose,
  onSave,
}: RewardFormProps) => {
  const [formData, setFormData] =
    useState<Partial<RewardCatalogItem>>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reward) {
      setFormData(reward);
    } else {
      setFormData(INITIAL_FORM);
    }
  }, [reward, isOpen]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save reward', error);
      // Parent handles error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] w-full max-w-2xl rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-primary)]">
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
            {reward ? 'Edit Reward' : 'New Reward'}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors min-w-[36px] min-h-[36px] touch-manipulation"
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 sm:space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <div className="col-span-full">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
              />
            </div>

            <div className="col-span-full">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Description
              </label>
              <textarea
                name="description"
                rows={3}
                required
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Type
              </label>
              <select
                name="reward_type"
                value={formData.reward_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px] touch-manipulation"
              >
                <option value="voucher">Voucher ($ Value)</option>
                <option value="bundle">Bundle (Product)</option>
                <option value="swag">Swag / Physical Item</option>
                <option value="experience">Experience</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Points Cost
              </label>
              <input
                type="number"
                name="points_required"
                required
                min="0"
                value={formData.points_required}
                onChange={handleChange}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
              />
            </div>

            {formData.reward_type === 'voucher' && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Value ($)
                </label>
                <input
                  type="number"
                  name="reward_value"
                  min="0"
                  step="0.01"
                  value={formData.reward_value}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Stock
              </label>
              <input
                type="number"
                name="stock_quantity"
                min="0"
                value={formData.stock_quantity ?? ''}
                onChange={handleChange}
                placeholder="Leave empty for unlimited"
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Validity (Days)
              </label>
              <input
                type="number"
                name="validity_days"
                min="1"
                value={formData.validity_days ?? 30}
                onChange={handleChange}
                className="w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-3 focus:border-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all min-h-[44px]"
              />
            </div>

            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Banner Image
                </label>
                <ImageUpload
                  value={formData.image_url || null}
                  onChange={url =>
                    setFormData(prev => ({ ...prev, image_url: url || '' }))
                  }
                  helperText="Recommended: 800x450px (16:9)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Logo / Icon
                </label>
                <ImageUpload
                  value={formData.logo_url || null}
                  onChange={url =>
                    setFormData(prev => ({ ...prev, logo_url: url || '' }))
                  }
                  helperText="Recommended: 200x200px (1:1 Square)"
                />
              </div>
            </div>
          </div>
        </form>

        <div className="p-4 sm:p-6 border-t border-[var(--border-primary)] flex justify-end gap-3 bg-[var(--bg-tertiary)]">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={loading}
            leftIcon={<Save size={16} />}
          >
            Save Reward
          </Button>
        </div>
      </div>
    </div>
  );
};
