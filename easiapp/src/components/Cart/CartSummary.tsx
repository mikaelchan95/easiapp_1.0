import React from 'react';
import { Lock, Truck } from 'lucide-react';
import { CartSummary as CartSummaryType } from '../../types/cart';
import { formatPrice } from '../../utils/cart';

interface CartSummaryProps {
  summary: CartSummaryType;
  isLoading?: boolean;
  onCheckout: () => void;
}

const CartSummary: React.FC<CartSummaryProps> = ({ summary, isLoading, onCheckout }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 max-w-sm mx-auto">
      <div className="px-4 py-6 pb-[calc(var(--sab,0px)+20px)]">
        <div className="space-y-6">
          {/* Free delivery badge */}
          <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-100 rounded-xl flex items-center justify-center">
                <Truck className="w-4 h-4 text-primary-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-primary-900">Free Delivery</div>
                <div className="text-xs text-primary-700">Same-day available</div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Items ({summary.itemCount})</span>
              <span className="font-bold text-gray-900">{formatPrice(summary.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery</span>
              <span className="font-bold text-primary-600">Free</span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between">
                <span className="font-bold text-gray-900 text-xl">Total</span>
                <span className="font-bold text-2xl text-gray-900">{formatPrice(summary.total)}</span>
              </div>
            </div>
          </div>
          
          {/* Checkout Button */}
          <button
            onClick={onCheckout}
            disabled={isLoading}
            className="w-full h-14 bg-black text-white rounded-2xl font-bold disabled:opacity-50 relative overflow-hidden active:scale-95 transition-transform"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>Loading...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Checkout • {formatPrice(summary.total)}</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;