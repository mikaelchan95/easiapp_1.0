import React, { useState } from 'react';
import { Star, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Product } from '../../types';
import { useProduct } from '../../hooks/useProduct';
import { formatPrice } from '../../utils/product';

interface FeaturedProductProps {
  product: Product;
}

const FeaturedProduct: React.FC<FeaturedProductProps> = ({ product }) => {
  const { 
    quantity, 
    setQuantity, 
    isAdding, 
    getPrice, 
    isLoggedIn,
    handleAddToCart 
  } = useProduct(product);
  
  const price = getPrice(product);

  return (
    <div className="flex space-x-6">
      <div className="w-32 h-36 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      
      <div className="flex-1 space-y-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg mb-3 line-clamp-2 leading-tight">{product.name}</h3>
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
              <span className="text-sm font-bold text-yellow-700">4.9</span>
            </div>
            <span className="text-xs text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">Premium</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-4">
            {formatPrice(price)}
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-bold text-gray-600">Qty</span>
            <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-gray-500 shadow-sm border border-gray-200 disabled:opacity-50 active:scale-95 transition-transform"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-bold text-gray-900 min-w-[16px] text-center text-sm">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-gray-500 shadow-sm border border-gray-200 active:scale-95 transition-transform"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          {isLoggedIn ? (
            <button 
              onClick={() => handleAddToCart(product, quantity)}
              disabled={isAdding || product.stock <= 0}
              className="w-full bg-black text-white py-3 rounded-xl font-bold active:scale-95 transition-transform flex items-center justify-center space-x-2 disabled:bg-gray-300 disabled:text-gray-500"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{isAdding ? 'Adding...' : `Add • ${formatPrice(price * quantity)}`}</span>
            </button>
          ) : (
            <div className="w-full bg-gray-100 text-gray-500 py-3 rounded-xl font-bold text-center border border-gray-200">
              Sign in to purchase
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturedProduct;