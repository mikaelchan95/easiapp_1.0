import React, { useState } from 'react';
import { Plus, Flame, Star, Clock, Shield } from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { getCategoryIcon, Icon } from '../../utils/icons';

interface EnhancedProductCardProps {
  product: Product;
  onClick?: () => void;
  index?: number;
}

const EnhancedProductCard: React.FC<EnhancedProductCardProps> = ({ 
  product, 
  onClick,
  index = 0 
}) => {
  const { state, addToCart } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const price = state.user?.role === 'trade' ? product.tradePrice : product.retailPrice;
  const savings = state.user?.role === 'trade' ? product.retailPrice - product.tradePrice : 0;
  const CategoryIcon = getCategoryIcon(product.category);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!state.user || isAdding || product.stock === 0) return;
    
    setIsAdding(true);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
    
    setTimeout(() => {
      addToCart(product, 1);
      setIsAdding(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
      }, 1500);
    }, 600);
  };

  const getStockStatus = () => {
    if (product.stock === 0) return { color: 'bg-red-500', text: 'Out of Stock' };
    if (product.stock <= 5) return { color: 'bg-amber-500', text: 'Low Stock' };
    return { color: 'bg-green-500', text: 'In Stock' };
  };

  const stockStatus = getStockStatus();

  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer group animate-fade-in"
      onClick={onClick}
      style={{ animationDelay: `${index * 50}ms` }}
      role="article"
      aria-label={`${product.name} - $${price}`}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md rounded-lg px-2.5 py-1.5 flex items-center space-x-1.5 shadow-sm">
          <Icon 
            icon={CategoryIcon} 
            size="xs" 
            className="text-gray-600"
          />
          <span className="text-xs font-medium text-gray-700 capitalize">
            {product.category}
          </span>
        </div>

        {/* Feature Badges */}
        <div className="absolute top-3 right-3 flex flex-col space-y-2">
          {product.featured && (
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-sm" 
                 aria-label="Featured product">
              <Star className="w-4 h-4 text-white fill-current" />
            </div>
          )}
          {product.sameDayEligible && (
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm"
                 aria-label="Same day delivery eligible">
              <Clock className="w-4 h-4 text-white" />
            </div>
          )}
          {savings > 0 && (
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-sm"
                 aria-label={`Save $${savings.toFixed(0)}`}>
              <Flame className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Stock Indicator */}
        <div className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium text-white ${stockStatus.color}`}>
          {stockStatus.text}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Product Name */}
        <h3 className="font-bold text-gray-900 line-clamp-2 min-h-[3rem] group-hover:text-black transition-colors">
          {product.name}
        </h3>

        {/* Trust Badge */}
        <div className="flex items-center space-x-1.5 text-xs text-gray-500">
          <Shield className="w-3 h-3" />
          <span>100% Authentic</span>
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-gray-900">
                ${price.toFixed(0)}
              </span>
              {savings > 0 && (
                <span className="text-sm text-gray-400 line-through">
                  ${product.retailPrice.toFixed(0)}
                </span>
              )}
            </div>
            {state.user?.role === 'trade' && savings > 0 && (
              <span className="text-xs font-medium text-green-600">
                Trade price - Save ${savings.toFixed(0)}
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          {state.user && (
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isAdding}
              className={`
                w-12 h-12 rounded-xl flex items-center justify-center transition-all
                ${product.stock === 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : showSuccess
                    ? 'bg-green-500 text-white scale-110'
                    : 'bg-black text-white hover:bg-gray-800 active:scale-95'
                }
              `}
              aria-label={product.stock === 0 ? 'Out of stock' : 'Add to cart'}
            >
              {isAdding ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : showSuccess ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <Plus className="w-5 h-5" strokeWidth={2.5} />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedProductCard;