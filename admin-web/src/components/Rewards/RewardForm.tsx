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
      alert('Failed to save reward');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-brand-white w-full max-w-2xl rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-brand-dark">
            {reward ? 'Edit Reward' : 'New Reward'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto flex-1 space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-full">
              <label className="block text-sm font-medium text-brand-dark mb-1">
                Title
              </label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
              />
            </div>

            <div className="col-span-full">
              <label className="block text-sm font-medium text-brand-dark mb-1">
                Description
              </label>
              <textarea
                name="description"
                rows={2}
                required
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">
                Type
              </label>
              <select
                name="reward_type"
                value={formData.reward_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
              >
                <option value="voucher">Voucher ($ Value)</option>
                <option value="bundle">Bundle (Product)</option>
                <option value="swag">Swag / Physical Item</option>
                <option value="experience">Experience</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">
                Points Cost
              </label>
              <input
                type="number"
                name="points_required"
                required
                min="0"
                value={formData.points_required}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
              />
            </div>

            {formData.reward_type === 'voucher' && (
              <div>
                <label className="block text-sm font-medium text-brand-dark mb-1">
                  Value ($)
                </label>
                <input
                  type="number"
                  name="reward_value"
                  min="0"
                  step="0.01"
                  value={formData.reward_value}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">
                Stock
              </label>
              <input
                type="number"
                name="stock_quantity"
                min="0"
                value={formData.stock_quantity ?? ''}
                onChange={handleChange}
                placeholder="Leave empty for unlimited"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">
                Validity (Days)
              </label>
              <input
                type="number"
                name="validity_days"
                min="1"
                value={formData.validity_days ?? 30}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-dark"
              />
            </div>

            <div className="col-span-full">
              <label className="block text-sm font-medium text-brand-dark mb-1">
                Image
              </label>
              <ImageUpload
                value={formData.image_url || null}
                onChange={url =>
                  setFormData(prev => ({ ...prev, image_url: url || '' }))
                }
              />
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
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
