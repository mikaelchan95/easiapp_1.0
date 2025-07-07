import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigationControl } from '../hooks/useNavigationControl';
import ProfileHeader from '../components/Profile/ProfileHeader';
import ProfileCard from '../components/Profile/ProfileCard';
import QuickActionGrid from '../components/Profile/QuickActionGrid';
import ProfileMenuSection from '../components/Profile/ProfileMenuSection';
import LogoutButton from '../components/Profile/LogoutButton';
import EditProfileView from '../components/Profile/EditProfileView';
import NotificationsView from '../components/Profile/NotificationsView';
import PreferencesView from '../components/Profile/PreferencesView';
import OrderHistoryView from '../components/Profile/OrderHistoryView';
import SupportView from '../components/Profile/SupportView';

interface ProfileProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

type ProfileSection = 'main' | 'edit' | 'account' | 'notifications' | 'preferences' | 'orders' | 'favorites' | 'support' | 'credit';

const Profile: React.FC<ProfileProps> = ({ onBack, onNavigate }) => {
  const { state, logout } = useApp();
  const [currentSection, setCurrentSection] = useState<ProfileSection>('main');
  
  // Use our custom hook to control navigation visibility
  useNavigationControl({ hide: false });

  const handleLogout = () => {
    logout();
    onBack();
  };

  // Handle section changes
  const navigateTo = (section: ProfileSection) => {
    setCurrentSection(section);
  };

  // Render credit management by navigating to the credit page
  if (currentSection === 'credit') {
    return onNavigate('credit');
  }

  // Render different sections based on current view
  if (currentSection !== 'main') {
    switch (currentSection) {
      case 'edit': 
        return <EditProfileView user={state.user} onBack={() => navigateTo('main')} />;
      case 'notifications': 
        return <NotificationsView onBack={() => navigateTo('main')} />;
      case 'preferences': 
        return <PreferencesView onBack={() => navigateTo('main')} />;
      case 'orders': 
        return <OrderHistoryView orders={state.orders} onBack={() => navigateTo('main')} onShopNow={() => onNavigate('products')} />;
      case 'support': 
        return <SupportView onBack={() => navigateTo('main')} />;
      default: 
        return null;
    }
  }

  // Main Profile View
  return (
    <div className="page-container bg-gray-50">
      <ProfileHeader onBack={onBack} title="Profile" />

      <div className="page-content pb-24">
        {/* User Profile Card */}
        <div className="px-4 py-6">
          <ProfileCard user={state.user} onEditProfile={() => navigateTo('edit')} />
        </div>

        {/* Quick Actions Grid */}
        <div className="px-4 mb-6">
          <QuickActionGrid 
            onOrdersClick={() => navigateTo('orders')} 
            onRewardsClick={() => onNavigate('rewards')}
            onSupportClick={() => navigateTo('support')}
          />
        </div>

        {/* Menu Sections */}
        <div className="px-4 space-y-6">
          {/* Account Section */}
          <ProfileMenuSection 
            title="Account"
            items={[
              { title: 'Personal Info', description: 'Name, email, phone', icon: 'user', action: () => navigateTo('edit') },
              { title: 'Addresses', description: 'Delivery locations', icon: 'mapPin', action: () => {} },
              { title: 'Payment Methods', description: 'Cards and billing', icon: 'creditCard', action: () => {} },
              { title: 'Security', description: 'Password and privacy', icon: 'shield', action: () => {} }
            ]}
          />

          {/* Trade Account Section - Only for trade users */}
          {state.user?.role === 'trade' && (
            <ProfileMenuSection 
              title="Trade Account"
              items={[
                { 
                  title: 'Credit Account', 
                  description: 'Invoices and payment terms', 
                  icon: 'receipt',
                  action: () => onNavigate('credit'),
                  highlight: true,
                  trailingText: 'View'
                }
              ]}
            />
          )}

          {/* Preferences Section */}
          <ProfileMenuSection 
            title="Preferences"
            items={[
              { title: 'Notifications', description: 'Push, email, SMS settings', icon: 'bell', action: () => navigateTo('notifications') },
              { title: 'App Preferences', description: 'Language, region, display', icon: 'settings', action: () => navigateTo('preferences') }
            ]}
          />

          {/* Support Section */}
          <ProfileMenuSection 
            title="Support"
            items={[
              { title: 'Help Center', description: 'FAQs and guides', icon: 'helpCircle', action: () => navigateTo('support') },
              { title: 'Contact Support', description: 'Get help from our team', icon: 'mail', action: () => navigateTo('support') }
            ]}
          />

          {/* Logout */}
          <div className="pt-4">
            <LogoutButton onLogout={handleLogout} />
          </div>

          {/* App Version */}
          <div className="text-center pt-4 pb-8">
            <p className="text-sm text-gray-500">EASI by Epico v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;