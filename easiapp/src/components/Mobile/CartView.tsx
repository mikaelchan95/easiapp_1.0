import React, { useState, useEffect } from 'react';
import { Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useNavigationControl } from '../../hooks/useNavigationControl';
import CartHeader from '../Cart/CartHeader';
import CartItem from '../Cart/CartItem';
import EmptyCart from '../Cart/EmptyCart';

interface CartViewProps {
  onBack: () => void;
  onCheckout: () => void;
}

const CartView: React.FC<CartViewProps> = ({ onBack, onCheckout }) => {
  const { cart, cartSummary, animationState, updateQuantity, removeItem, user } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  
  // Hide navigation when cart is open
  useNavigationControl();

  const handleCheckout = () => {
    setIsLoading(true);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    setTimeout(() => {
      setIsLoading(false);
      onCheckout();
    }, 600);
  };

  if (cart.length === 0) {
    return <EmptyCart onContinueShopping={onBack} />;
  }

  return (
    <div className="bg-gray-50 min-h-screen max-w-sm mx-auto relative">
      {/* Success Toast */}
      {animationState.showSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-70 bg-green-500 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center space-x-2">
          <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3" />
          </div>
          <span>Removed</span>
        </div>
      )}

      <CartHeader onBack={onBack} itemCount={cartSummary.itemCount} />

      {/* Items */}
      <div className="overflow-y-auto scrollbar-hide pb-56">
        <div className="px-4 py-6 space-y-4">
          {cart.map((item, index) => (
            <CartItem
              key={item.product.id}
              item={item}
              userRole={user?.role}
              isRemoving={animationState.removingItems.has(item.product.id)}
              onUpdateQuantity={updateQuantity}
              onRemove={removeItem}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Cart Summary and Checkout */}
      <div className="cart-checkout-container pb-[calc(var(--sab,0px)+24px)]">
        <div className="px-4 py-6">
          {/* Summary */}
          <div className="space-y-3 mb-5">
            <div className="flex justify-between">
              <span className="text-gray-600">Items ({cartSummary.itemCount})</span>
              <span className="font-bold text-gray-900">${cartSummary.subtotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery</span>
              <span className="font-bold text-green-600">Free</span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between">
                <span className="font-bold text-gray-900 text-xl">Total</span>
                <span className="font-bold text-2xl text-gray-900">${cartSummary.total.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full h-14 bg-black text-white rounded-2xl font-bold disabled:opacity-50 relative overflow-hidden active:scale-95 transition-transform"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <ShoppingBag className="w-5 h-5" />
                <span>Checkout • ${cartSummary.total.toFixed(0)}</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </div>
            )}
            {isLoading && <div className="absolute inset-0 loading-shimmer"></div>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartView;