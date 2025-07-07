import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  isCompact?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, isCompact = false }) => {
  const { state, addToCart } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  
  const price = state.user?.role === 'trade' ? product.tradePrice : product.retailPrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state.user && !isAdding && product.stock > 0) {
      setIsAdding(true);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
      
      setTimeout(() => {
        addToCart(product, 1);
        setIsAdding(false);
      }, 400);
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden border border-gray-200 transition-all duration-300 active:scale-95"
      onClick={onClick}
    >
      <div className="relative">
        <div className="aspect-square overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Stock indicator */}
        <div className={`absolute bottom-2 right-2 w-2 h-2 rounded-full ${
          product.stock > 10 ? 'bg-green-400' : 
          product.stock > 0 ? 'bg-yellow-400' : 'bg-red-400'
        }`} />
      </div>
      
      <div className="p-3 space-y-2">
        {/* Category */}
        <div className="text-xs text-gray-500 capitalize">
          {product.category}
        </div>
        
        {/* Product Name */}
        <h3 className="text-gray-900 font-bold text-sm line-clamp-2 leading-tight min-h-[2.5rem]">
          {product.name}
        </h3>
        
        {/* Price & Action */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-lg font-bold text-gray-900">
            ${price.toFixed(0)}
          </div>
          
          {state.user && (
            <button 
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isAdding}
              className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center active:scale-95 transition-transform text-white"
            >
              {isAdding ? (
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;