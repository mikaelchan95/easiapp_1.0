import React from 'react';
import { MapPin, Edit3, Check } from 'lucide-react';
import { CartAddress } from '../../types/cart';

interface AddressStepProps {
  address: CartAddress;
  onUpdateAddress: (address: Partial<CartAddress>) => void;
}

const AddressStep: React.FC<AddressStepProps> = ({ address }) => {
  return (
    <div className="px-4 py-6 space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Delivery Address</h2>
        <p className="text-gray-600">Where should we deliver?</p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Current Address</h3>
          <button className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center active:scale-95 transition-transform">
            <Edit3 className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900 mb-1">{address.name}</div>
            <div className="text-gray-600 leading-relaxed">
              {address.street}{address.unit && `, ${address.unit}`}<br />
              {address.city} {address.postalCode}<br />
              {address.phone}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
        <div className="flex items-start space-x-3">
          <Check className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <h4 className="font-bold text-green-900 mb-1">Delivery Available</h4>
            <p className="text-sm text-green-700">Same-day delivery to your area</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressStep;