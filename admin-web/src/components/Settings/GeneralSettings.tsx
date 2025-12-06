import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { LoyaltyConfig, DeliveryConfig } from '../../types/settings';
import { Save, Loader2 } from 'lucide-react';

export const GeneralSettings = () => {
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>({ earn_rate: 0, redemption_rate: 0 });
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>({ default_fee: 0, express_fee: 0, free_delivery_threshold: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('app_settings').select('key, value');
      if (error) throw error;

      const loyaltyMap = data.find(item => item.key === 'loyalty_config');
      if (loyaltyMap) setLoyaltyConfig(loyaltyMap.value);

      const deliveryMap = data.find(item => item.key === 'delivery_config');
      if (deliveryMap) setDeliveryConfig(deliveryMap.value);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setMessage({ type: 'error', text: 'Failed to load settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updates = [
        { key: 'loyalty_config', value: loyaltyConfig, updated_at: new Date().toISOString() },
        { key: 'delivery_config', value: deliveryConfig, updated_at: new Date().toISOString() }
      ];

      const { error } = await supabase.from('app_settings').upsert(updates, { onConflict: 'key' });
      if (error) throw error;

      setMessage({ type: 'success', text: 'Settings saved successfully.' });
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setMessage({ type: 'error', text: `Failed to save settings: ${err.message || 'Unknown error'}` });
      alert(`Error saving settings: ${err.message || JSON.stringify(err)}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-accent" /></div>;

  return (
    <div className="space-y-8">
      {/* Loyalty Configuration */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-brand-dark mb-4">Loyalty Points Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Earn Rate (Points per $1)</label>
            <input
              type="number"
              value={loyaltyConfig.earn_rate}
              onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, earn_rate: parseFloat(e.target.value) })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent"
              step="0.1"
            />
            <p className="text-xs text-gray-500 mt-1">How many points a user earns for every dollar spent.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Redemption Rate ($ Value per Point)</label>
            <input
              type="number"
              value={loyaltyConfig.redemption_rate}
              onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, redemption_rate: parseFloat(e.target.value) })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent"
              step="0.001"
            />
             <p className="text-xs text-gray-500 mt-1">The value of 1 point in currency (e.g., 0.01 = 1 cent).</p>
          </div>
        </div>
      </div>

      {/* Delivery Configuration */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-brand-dark mb-4">Delivery Fees Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Fee ($)</label>
            <input
              type="number"
              value={deliveryConfig.default_fee}
              onChange={(e) => setDeliveryConfig({ ...deliveryConfig, default_fee: parseFloat(e.target.value) })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent"
              step="0.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Express Fee ($)</label>
            <input
              type="number"
              value={deliveryConfig.express_fee}
              onChange={(e) => setDeliveryConfig({ ...deliveryConfig, express_fee: parseFloat(e.target.value) })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent"
              step="0.5"
            />
             <p className="text-xs text-gray-500 mt-1">Fee for express/priority delivery.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Free Delivery Threshold ($)</label>
            <input
              type="number"
              value={deliveryConfig.free_delivery_threshold}
              onChange={(e) => setDeliveryConfig({ ...deliveryConfig, free_delivery_threshold: parseFloat(e.target.value) })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-accent focus:ring-brand-accent"
              step="10"
            />
             <p className="text-xs text-gray-500 mt-1">Order value above which delivery is free.</p>
          </div>
        </div>
      </div>

       {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-brand-accent text-brand-dark font-bold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Save Changes
        </button>
      </div>
    </div>
  );
};
