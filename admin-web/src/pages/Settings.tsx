import { useState } from 'react';
import { GeneralSettings } from '../components/Settings/GeneralSettings';
import { AdminManagement } from '../components/Settings/AdminManagement';
import { NotificationSettings } from '../components/Settings/NotificationSettings';
import { Settings as SettingsIcon, Users, Bell } from 'lucide-react';

type Tab = 'general' | 'admins' | 'notifications';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'admins', label: 'Admin Users', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold text-brand-dark tracking-tight">Settings</h1>
        <p className="text-gray-500">Manage application configuration and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-brand-dark text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-brand-light/30 rounded-xl p-1">
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'admins' && <AdminManagement />}
            {activeTab === 'notifications' && <NotificationSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
