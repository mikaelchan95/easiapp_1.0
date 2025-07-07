import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface CartHeaderProps {
  onBack: () => void;
  itemCount: number;
}

const CartHeader: React.FC<CartHeaderProps> = ({ onBack, itemCount }) => {
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={onBack}
              className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Cart</h1>
          </div>
          <div className="bg-gray-100 px-3 py-2 rounded-xl border border-gray-200">
            <span className="text-sm font-bold text-gray-900">{itemCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartHeader;