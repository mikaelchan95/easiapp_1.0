import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { NotificationPreferences } from '../../types/settings';
import { Save, Loader2, Bell, Mail } from 'lucide-react';

export const NotificationSettings = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({ email: false, push: false, marketing_emails: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('preferences')
        .eq('user_id', user.id)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows found

      if (data && data.preferences) {
        setPreferences(data.preferences.notifications || { email: false, push: false, marketing_emails: false });
      }
    } catch (err) {
      console.error('Error fetching notification preferences:', err);
      // Don't show error to user for initial fetch failure, just default values
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          preferences: { notifications: preferences },
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Preferences updated successfully.' });
    } catch (err) {
      console.error('Error saving preferences:', err);
      setMessage({ type: 'error', text: 'Failed to save preferences.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[var(--color-primary-text)]" /></div>;

  return (
    <div className="space-y-6 bg-[var(--bg-card)] p-6 rounded-lg border border-[var(--border-default)] shadow-sm">
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Notification Preferences</h3>
      <p className="text-sm text-[var(--text-secondary)] mb-6">Manage how you receive alerts and updates.</p>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-[var(--border-subtle)] rounded-lg">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-primary)]">
               <Mail size={20} />
             </div>
             <div>
                <h4 className="font-medium text-[var(--text-primary)]">Email Notifications</h4>
                <p className="text-xs text-[var(--text-secondary)]">Receive system alerts via email.</p>
             </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={preferences.email} 
              onChange={(e) => setPreferences({...preferences, email: e.target.checked})}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-[var(--border-default)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--color-primary-bg)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[var(--bg-card)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--bg-card)] after:border-[var(--border-default)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--text-primary)]"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-[var(--border-subtle)] rounded-lg">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-primary)]">
               <Bell size={20} />
             </div>
             <div>
                <h4 className="font-medium text-[var(--text-primary)]">Push Notifications</h4>
                <p className="text-xs text-[var(--text-secondary)]">Receive push notifications on mobile.</p>
             </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={preferences.push} 
              onChange={(e) => setPreferences({...preferences, push: e.target.checked})}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-[var(--border-default)] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[var(--color-primary-bg)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[var(--bg-card)] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--bg-card)] after:border-[var(--border-default)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--text-primary)]"></div>
          </label>
        </div>
      </div>

       {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-[var(--text-primary)] text-[var(--text-primary)] font-bold rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Save Preferences
        </button>
      </div>
    </div>
  );
};
