import React, { useState } from 'react';
import { Bell, Mail, Phone, Smartphone } from 'lucide-react';
import ProfileHeader from './ProfileHeader';
import ToggleSwitch from '../UI/ToggleSwitch';

interface NotificationsViewProps {
  onBack: () => void;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ onBack }) => {
  const [settings, setSettings] = useState({
    orderUpdates: true,
    promotions: true,
    newArrivals: false,
    priceAlerts: true,
    email: true,
    sms: false,
    push: true
  });

  const updateSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="page-container bg-gray-50">
      <ProfileHeader title="Notifications" onBack={onBack} />

      <div className="page-content pb-24">
        <div className="px-4 py-6 space-y-8">
          {/* Notification Types */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 px-1">Types</h3>
            
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {[
                { key: 'orderUpdates', label: 'Order Updates', desc: 'Shipping and delivery' },
                { key: 'promotions', label: 'Promotions', desc: 'Special deals' },
                { key: 'newArrivals', label: 'New Arrivals', desc: 'Latest products' },
                { key: 'priceAlerts', label: 'Price Alerts', desc: 'When items go on sale' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="font-bold text-gray-900">{item.label}</div>
                    <div className="text-sm text-gray-600">{item.desc}</div>
                  </div>
                  <ToggleSwitch 
                    isEnabled={settings[item.key as keyof typeof settings]} 
                    onToggle={() => updateSetting(item.key as keyof typeof settings)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Methods */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 px-1">Delivery Methods</h3>
            
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {[
                { key: 'push', label: 'Push Notifications', icon: <Smartphone className="w-5 h-5 text-gray-500" /> },
                { key: 'email', label: 'Email', icon: <Mail className="w-5 h-5 text-gray-500" /> },
                { key: 'sms', label: 'SMS', icon: <Phone className="w-5 h-5 text-gray-500" /> }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span className="font-bold text-gray-900">{item.label}</span>
                  </div>
                  <ToggleSwitch 
                    isEnabled={settings[item.key as keyof typeof settings]} 
                    onToggle={() => updateSetting(item.key as keyof typeof settings)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Help text */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-start space-x-3">
              <Bell className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                You'll always receive important notifications about your orders and account activity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsView;