import React, { useState } from 'react';
import { User, Camera, Mail, Phone, Building, MapPin, Hash } from 'lucide-react';
import { User as UserType } from '../../types';
import ProfileHeader from './ProfileHeader';

interface EditProfileViewProps {
  user: UserType | null;
  onBack: () => void;
}

const EditProfileView: React.FC<EditProfileViewProps> = ({ user, onBack }) => {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '+65 9123 4567',
    company: user?.role === 'trade' ? 'Premium Liquor Store' : '',
    address: '123 Marina Bay Sands',
    unit: '#12-34',
    postalCode: '018956'
  });

  const handleInputChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    // In a real app, this would save the form data
    onBack();
  };

  return (
    <div className="page-container bg-gray-50">
      <ProfileHeader 
        title="Edit Profile" 
        onBack={onBack} 
        showSave={true}
        onSave={handleSave}
      />

      <div className="page-content pb-24">
        <div className="px-4 py-6 space-y-8">
          {/* Profile Photo */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center border-4 border-white shadow-md">
                <User className="w-12 h-12 text-gray-500" />
              </div>
              <button 
                className="absolute bottom-0 right-0 w-8 h-8 bg-black rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                aria-label="Change photo"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">Tap to change photo</p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Name Field */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center space-x-3 mb-2">
                <User className="w-5 h-5 text-gray-500" />
                <label className="text-sm font-bold text-gray-700">Full Name</label>
              </div>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Your name"
              />
            </div>

            {/* Email Field */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center space-x-3 mb-2">
                <Mail className="w-5 h-5 text-gray-500" />
                <label className="text-sm font-bold text-gray-700">Email</label>
              </div>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>

            {/* Phone Field */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center space-x-3 mb-2">
                <Phone className="w-5 h-5 text-gray-500" />
                <label className="text-sm font-bold text-gray-700">Phone</label>
              </div>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="+65 XXXX XXXX"
              />
            </div>

            {/* Company Field - Only for trade accounts */}
            {user?.role === 'trade' && (
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center space-x-3 mb-2">
                  <Building className="w-5 h-5 text-gray-500" />
                  <label className="text-sm font-bold text-gray-700">Company</label>
                </div>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Company name"
                />
              </div>
            )}

            {/* Address Fields */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center space-x-3 mb-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <label className="text-sm font-bold text-gray-700">Delivery Address</label>
              </div>
              
              <div className="space-y-4">
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Street address"
                />

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Unit/Floor"
                  />
                  
                  <div className="relative">
                    <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={form.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Postal code"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileView;