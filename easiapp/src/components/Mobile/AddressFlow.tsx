import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Home, 
  Building, 
  Users, 
  Navigation,
  Check,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  name: string;
  address: string;
  unit?: string;
  postalCode: string;
  isDefault: boolean;
  deliveryInstructions?: string;
  lat?: number;
  lng?: number;
}

interface AddressFlowProps {
  onClose: () => void;
  onAddressSelected: (address: Address) => void;
  currentAddress?: Address;
}

type FlowStep = 'list' | 'add' | 'edit' | 'search' | 'map';

const AddressFlow: React.FC<AddressFlowProps> = ({ onClose, onAddressSelected, currentAddress }) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('list');
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      type: 'home',
      name: 'Home',
      address: '123 Marina Bay Sands',
      unit: '#12-34',
      postalCode: '018956',
      isDefault: true,
      deliveryInstructions: 'Leave at concierge'
    },
    {
      id: '2',
      type: 'work',
      name: 'Office',
      address: '1 Raffles Place',
      unit: '#45-01',
      postalCode: '048616',
      isDefault: false
    }
  ]);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    type: 'home',
    name: '',
    address: '',
    unit: '',
    postalCode: '',
    deliveryInstructions: '',
    isDefault: false
  });

  const getAddressIcon = (type: string) => {
    switch (type) {
      case 'home': return Home;
      case 'work': return Building;
      default: return MapPin;
    }
  };

  const getAddressColor = (type: string) => {
    switch (type) {
      case 'home': return 'from-primary-500 to-primary-600';
      case 'work': return 'from-blue-500 to-blue-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const handleSaveAddress = () => {
    setIsLoading(true);
    setTimeout(() => {
      if (editingAddress) {
        // Update existing
        setAddresses(prev => prev.map(addr => 
          addr.id === editingAddress.id 
            ? { ...newAddress as Address, id: editingAddress.id }
            : addr
        ));
      } else {
        // Add new
        const address: Address = {
          ...newAddress as Address,
          id: Date.now().toString()
        };
        setAddresses(prev => [...prev, address]);
      }
      
      setIsLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setCurrentStep('list');
        setEditingAddress(null);
        setNewAddress({
          type: 'home',
          name: '',
          address: '',
          unit: '',
          postalCode: '',
          deliveryInstructions: '',
          isDefault: false
        });
      }, 1500);
    }, 1000);
  };

  const handleDeleteAddress = (addressId: string) => {
    setAddresses(prev => prev.filter(addr => addr.id !== addressId));
  };

  const handleSelectAddress = (address: Address) => {
    onAddressSelected(address);
    onClose();
  };

  const startEditAddress = (address: Address) => {
    setEditingAddress(address);
    setNewAddress(address);
    setCurrentStep('edit');
  };

  const mockSuggestions = [
    '123 Marina Bay Sands, Singapore 018956',
    '1 Raffles Place, Singapore 048616',
    '50 Collyer Quay, Singapore 049321',
    '8 Marina Boulevard, Singapore 018981'
  ];

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 mx-4 text-center">
          <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {editingAddress ? 'Address Updated!' : 'Address Added!'}
          </h3>
          <p className="text-gray-600">Your delivery address has been saved</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end">
      <div className="bg-white rounded-t-3xl w-full max-w-sm mx-auto max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
          <div className="px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => {
                  if (currentStep === 'list') {
                    onClose();
                  } else {
                    setCurrentStep('list');
                  }
                }}
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center btn-ios-press"
              >
                <ArrowLeft className="w-4 h-4 text-gray-700" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">
                {currentStep === 'list' ? 'Delivery Address' :
                 currentStep === 'add' ? 'Add Address' :
                 currentStep === 'edit' ? 'Edit Address' :
                 currentStep === 'search' ? 'Search Address' : 'Select Location'}
              </h1>
            </div>
            {(currentStep === 'add' || currentStep === 'edit') && (
              <button
                onClick={handleSaveAddress}
                disabled={isLoading || !newAddress.address || !newAddress.postalCode}
                className="text-black font-bold disabled:text-gray-400 btn-ios-press"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] scrollbar-hide">
          {/* Address List */}
          {currentStep === 'list' && (
            <div className="p-4 space-y-4">
              {/* Current Location */}
              <button className="w-full bg-primary-50 border-2 border-primary-200 rounded-2xl p-4 text-left group">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-primary-900 mb-1">Use Current Location</div>
                    <div className="text-sm text-primary-700">Detecting your location...</div>
                  </div>
                  <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
                </div>
              </button>

              {/* Search */}
              <button 
                onClick={() => setCurrentStep('search')}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left group hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                    <Search className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Search for Address</div>
                    <div className="text-sm text-gray-600">Enter street name or postal code</div>
                  </div>
                </div>
              </button>

              {/* Saved Addresses */}
              <div className="space-y-3">
                {addresses.map((address, index) => {
                  const IconComponent = getAddressIcon(address.type);
                  const isSelected = currentAddress?.id === address.id;
                  
                  return (
                    <div 
                      key={address.id} 
                      className={`bg-white border rounded-2xl overflow-hidden animate-fade-in transition-all duration-200 ${
                        isSelected ? 'border-black shadow-lg scale-105' : 'border-gray-200 hover:shadow-md'
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div 
                        onClick={() => handleSelectAddress(address)}
                        className="p-4 cursor-pointer"
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 bg-gradient-to-r ${getAddressColor(address.type)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-bold text-gray-900">{address.name}</span>
                              {address.isDefault && (
                                <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-lg text-xs font-bold">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {address.address}{address.unit && `, ${address.unit}`}
                            </p>
                            <p className="text-sm text-gray-500">Singapore {address.postalCode}</p>
                            {address.deliveryInstructions && (
                              <p className="text-xs text-gray-500 mt-2 italic">
                                "{address.deliveryInstructions}"
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="border-t border-gray-100 p-3 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => startEditAddress(address)}
                            className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors active:scale-95"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          
                          {!address.isDefault && (
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-sm font-bold text-red-600 hover:bg-red-100 transition-colors active:scale-95"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Address */}
              <button
                onClick={() => setCurrentStep('add')}
                className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-gray-400 hover:bg-gray-50 transition-colors group"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-gray-200 transition-colors">
                  <Plus className="w-6 h-6 text-gray-600" />
                </div>
                <div className="font-bold text-gray-900 mb-1">Add New Address</div>
                <div className="text-sm text-gray-600">Home, work, or other location</div>
              </button>
            </div>
          )}

          {/* Search */}
          {currentStep === 'search' && (
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search address or postal code..."
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:bg-white transition-all"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-700">Suggestions</h3>
                {mockSuggestions
                  .filter(suggestion => suggestion.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setNewAddress(prev => ({
                          ...prev,
                          address: suggestion.split(',')[0],
                          postalCode: suggestion.match(/\d{6}/)?.[0] || ''
                        }));
                        setCurrentStep('add');
                      }}
                      className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-900">{suggestion}</span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Add/Edit Address Form */}
          {(currentStep === 'add' || currentStep === 'edit') && (
            <div className="p-4 space-y-6">
              {/* Address Type */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3">Address Type</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'home', label: 'Home', icon: Home },
                    { type: 'work', label: 'Work', icon: Building },
                    { type: 'other', label: 'Other', icon: MapPin }
                  ].map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.type}
                        onClick={() => setNewAddress(prev => ({ ...prev, type: option.type as any }))}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          newAddress.type === option.type
                            ? 'border-black bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <IconComponent className={`w-5 h-5 mx-auto mb-1 ${
                          newAddress.type === option.type ? 'text-black' : 'text-gray-600'
                        }`} />
                        <div className={`text-sm font-bold ${
                          newAddress.type === option.type ? 'text-black' : 'text-gray-600'
                        }`}>
                          {option.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Address Name</label>
                  <input
                    type="text"
                    value={newAddress.name}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Home, Office, Mom's Place"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Street Address</label>
                  <input
                    type="text"
                    value={newAddress.address}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Marina Bay Sands"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">Unit/Floor</label>
                    <input
                      type="text"
                      value={newAddress.unit}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="#12-34"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-2 block">Postal Code</label>
                    <input
                      type="text"
                      value={newAddress.postalCode}
                      onChange={(e) => setNewAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                      placeholder="018956"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 mb-2 block">Delivery Instructions (Optional)</label>
                  <textarea
                    value={newAddress.deliveryInstructions}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, deliveryInstructions: e.target.value }))}
                    placeholder="e.g. Leave at concierge, Ring doorbell twice"
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black resize-none"
                  />
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    id="setDefault"
                    checked={newAddress.isDefault}
                    onChange={(e) => setNewAddress(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="w-4 h-4 text-black bg-gray-100 border-gray-300 rounded focus:ring-black focus:ring-2"
                  />
                  <label htmlFor="setDefault" className="text-sm font-bold text-gray-900">
                    Set as default address
                  </label>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-primary-900 mb-1">Delivery Information</h4>
                    <p className="text-sm text-primary-700">
                      Same-day delivery available for orders placed before 11:30 AM. 
                      Free delivery for orders over $250.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressFlow;