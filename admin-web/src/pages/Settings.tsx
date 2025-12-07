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
    <div className="animate-fade-in">
      <div className="flex flex-col gap-2 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          Settings
        </h1>
        <p className="text-[var(--text-secondary)] text-sm sm:text-base">
          Manage application configuration and preferences.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap min-h-[44px] touch-manipulation ${
                    activeTab === tab.id
                      ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-xl p-4 sm:p-6">
            {activeTab === 'general' && <GeneralSettings />}
            {activeTab === 'admins' && <AdminManagement />}
            {activeTab === 'notifications' && <NotificationSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}
