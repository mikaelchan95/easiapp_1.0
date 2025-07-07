import React, { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import AddressFlow from './AddressFlow';
import SmartSearchBar from './SmartSearchBar';
import ProductDetail from './ProductDetail';
import { Product } from '../../types';

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

const MobileHeader: React.FC = () => {
  const [showAddressFlow, setShowAddressFlow] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<Address>({
    id: '1',
    type: 'home',
    name: 'Marina Bay',
    address: '123 Marina Bay Sands',
    unit: '#12-34',
    postalCode: '018956',
    isDefault: true
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleAddressSelected = (address: Address) => {
    setCurrentAddress(address);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  return (
    <>
      <div className="bg-white/95 backdrop-blur-lg border-b border-gray-100 mobile-header">
        {/* Delivery */}
        <div className="px-4 pt-3 pb-2">
          <button 
            onClick={() => setShowAddressFlow(true)}
            className="w-full bg-black rounded-2xl shadow-sm p-5 text-left hover:shadow-md transition-all duration-200 active:scale-98"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-11 h-11 bg-black/80 rounded-xl flex items-center justify-center border border-black/20">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white/80 uppercase tracking-wide">Deliver to</div>
                  <div className="text-lg font-bold text-white mt-1">{currentAddress.name}</div>
                </div>
              </div>
              <ChevronDown className="w-6 h-6 text-white/70" />
            </div>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <SmartSearchBar 
            onProductSelect={handleProductSelect}
            placeholder="Search wines, spirits & more..."
          />
        </div>
      </div>

      {/* Address Flow Modal */}
      {showAddressFlow && (
        <AddressFlow
          onClose={() => setShowAddressFlow(false)}
          onAddressSelected={handleAddressSelected}
          currentAddress={currentAddress}
        />
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
};

export default MobileHeader;