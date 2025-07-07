import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { getCategoryEmoji, formatPrice, getStockLabel, getStockColor } from '../../utils/product';

interface ProductItemProps {
  product: Product;
  index?: number;
  compact?: boolean;
}

const ProductItem: React.FC<ProductItemProps> = ({ product, index = 0, compact = false }) => {
  const { state, addToCart } = useApp();
  
  const price = state.user?.role === 'trade' ? product.tradePrice : product.retailPrice;
  const savings = state.user?.role === 'trade' ? product.retailPrice - product.tradePrice : 0;
  const categoryEmoji = getCategoryEmoji(product.category);
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (state.user && product.stock > 0) {
      // Haptic feedback for touch devices
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
      
      addToCart(product, 1);
    }
  };

  return (
    <Link 
      to={`/products/${product.id}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-lg animate-fade-in active:scale-95"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative">
        <div className={compact ? "aspect-square" : "h-48 md:h-56"}>
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
          />
        </div>
        
        {/* Floating Badges */}
        <div className="absolute top-2 left-2">
          {product.featured && (
            <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-lg font-bold shadow-sm">
              Premium
            </span>
          )}
          {savings > 0 && state.user?.role === 'trade' && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-lg font-bold shadow-sm ml-1">
              Save ${savings.toFixed(0)}
            </span>
          )}
        </div>
        
        <button 
          className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors active:scale-90"
        >
          <Heart className="w-4 h-4 text-gray-500 hover:text-red-500" />
        </button>
        
        <div className="absolute bottom-2 right-2">
          <div className={`w-2 h-2 rounded-full ${
            product.stock > 10 ? 'bg-green-500' : 
            product.stock > 0 ? 'bg-amber-500' : 'bg-red-500'
          }`} />
        </div>
      </div>
      
      <div className={compact ? "p-4" : "p-4 md:p-5"}>
        {/* Category & Rating */}
        <div className="flex justify-between mb-2">
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-lg flex items-center">
            <span className="mr-1">{categoryEmoji}</span>
            <span className="capitalize">{product.category}</span>
          </span>
          
          <div className="flex items-center">
            <Star className="w-3 h-3 text-amber-400 fill-current" />
            <span className="text-xs text-gray-600 ml-1">4.8</span>
          </div>
        </div>
        
        {/* Title */}
        <h3 className={`font-bold text-gray-900 line-clamp-2 mb-2 ${compact ? 'text-sm' : 'text-base'}`}>
          {product.name}
        </h3>
        
        {/* Price & Actions */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <div className="flex items-baseline space-x-1">
              <span className="font-bold text-gray-900">{formatPrice(price)}</span>
              {savings > 0 && (
                <span className="text-xs text-gray-500 line-through">{formatPrice(product.retailPrice)}</span>
              )}
            </div>
            {!compact && (
              <span className={`text-xs ${getStockColor(product.stock)}`}>
                {getStockLabel(product.stock)}
              </span>
            )}
          </div>
          
          {state.user && (
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="w-9 h-9 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-90"
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductItem;