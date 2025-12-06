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

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-accent" /></div>;

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-brand-dark mb-4">Notification Preferences</h3>
      <p className="text-sm text-gray-500 mb-6">Manage how you receive alerts and updates.</p>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
               <Mail size={20} />
             </div>
             <div>
                <h4 className="font-medium text-gray-900">Email Notifications</h4>
                <p className="text-xs text-gray-500">Receive system alerts via email.</p>
             </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={preferences.email} 
              onChange={(e) => setPreferences({...preferences, email: e.target.checked})}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
               <Bell size={20} />
             </div>
             <div>
                <h4 className="font-medium text-gray-900">Push Notifications</h4>
                <p className="text-xs text-gray-500">Receive push notifications on mobile.</p>
             </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={preferences.push} 
              onChange={(e) => setPreferences({...preferences, push: e.target.checked})}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
          </label>
        </div>
      </div>

       {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-brand-accent text-brand-dark font-bold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Save Preferences
        </button>
      </div>
    </div>
  );
};
