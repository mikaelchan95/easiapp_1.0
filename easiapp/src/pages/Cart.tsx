import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Cart: React.FC = () => {
  const { state, dispatch, getCartTotal, getCartItemCount } = useApp();
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setRemovingItems(prev => new Set(prev).add(productId));
      setTimeout(() => {
        dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
        setRemovingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(productId);
          return newSet;
        });
      }, 200);
    } else {
      dispatch({ type: 'UPDATE_CART_QUANTITY', payload: { productId, quantity } });
    }
  };

  const removeItem = (productId: string) => {
    setRemovingItems(prev => new Set(prev).add(productId));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    setTimeout(() => {
      dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }, 200);
  };

  const proceedToCheckout = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/checkout');
    }, 600);
  };

  if (state.cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-8 py-16">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-in">
            <ShoppingBag className="w-16 h-16 text-gray-400" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in">Empty Cart</h2>
          <p className="text-xl text-gray-600 mb-12 leading-relaxed animate-fade-in">
            Add some premium spirits to get started on your order
          </p>
          <Link
            to="/products"
            className="inline-block bg-black text-white px-12 py-4 rounded-xl font-bold btn-premium animate-fade-in text-lg"
          >
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 success-toast text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center space-x-2">
          <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3" />
          </div>
          <span>Item removed</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cart</h1>
          <p className="text-gray-600">{getCartItemCount()} items ready for checkout</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {state.cart.map((item, index) => {
                const price = state.user?.role === 'trade' ? item.product.tradePrice : item.product.retailPrice;
                const isRemoving = removingItems.has(item.product.id);
                
                return (
                  <div 
                    key={item.product.id} 
                    className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm card-hover transition-all duration-300 ${
                      isRemoving ? 'opacity-0 transform scale-95' : 'animate-fade-in'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-24 h-24 object-cover rounded-xl"
                        />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold animate-bounce-in">
                          {item.quantity}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {item.product.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{item.product.description}</p>
                        <p className="text-black font-medium text-sm">SKU: {item.product.sku}</p>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 btn-ios-press"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 btn-ios-press"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            ${(price * item.quantity).toFixed(0)}
                          </p>
                          <p className="text-gray-600 text-sm">
                            ${price.toFixed(0)} each
                          </p>
                        </div>

                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 btn-ios-press"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Summary</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items ({getCartItemCount()})</span>
                  <span className="font-bold text-gray-900">${getCartTotal().toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-bold text-green-600">Free</span>
                </div>
                {state.user?.role === 'trade' && (
                  <div className="flex justify-between text-green-600">
                    <span>Trade Discount</span>
                    <span className="font-bold">Applied</span>
                  </div>
                )}
                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-gray-900">${getCartTotal().toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={proceedToCheckout}
                disabled={isLoading}
                className="w-full bg-black text-white py-4 rounded-xl font-bold btn-premium mb-4 disabled:opacity-50 relative overflow-hidden"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <span>Checkout • ${getCartTotal().toFixed(0)}</span>
                )}
                {isLoading && <div className="absolute inset-0 loading-shimmer"></div>}
              </button>
              
              <Link
                to="/products"
                className="block text-center text-black hover:underline font-medium"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;