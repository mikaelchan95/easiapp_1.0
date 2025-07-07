import React from 'react';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

interface EmptyCartProps {
  onContinueShopping: () => void;
}

const EmptyCart: React.FC<EmptyCartProps> = ({ onContinueShopping }) => {
  return (
    <div className="fixed inset-0 bg-gray-50 max-w-sm mx-auto overflow-hidden flex flex-col">
      {/* Back button header */}
      <div className="bg-white border-b border-gray-100">
        <div className="px-4 py-4 flex items-center space-x-3">
          <button 
            onClick={onContinueShopping}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Cart</h1>
        </div>
      </div>

      {/* Empty state content - centered in available space */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-0">
        <div className="w-24 h-24 bg-gray-100 rounded-3xl flex items-center justify-center mb-8 animate-bounce-in">
          <ShoppingBag className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3 animate-fade-in">Empty Cart</h2>
        <p className="text-gray-500 text-center mb-8 animate-fade-in leading-relaxed">
          Add items to get started
        </p>
        <button
          onClick={onContinueShopping}
          className="bg-black text-white px-8 py-4 rounded-2xl font-bold active:scale-95 transition-transform animate-fade-in"
        >
          Shop Now
        </button>
      </div>
    </div>
  );
};

export default EmptyCart;