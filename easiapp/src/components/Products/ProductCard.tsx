import React, { useState } from 'react';
import { Heart, Plus, Check } from 'lucide-react';
import { Product } from '../../types';
import { useProduct } from '../../hooks/useProduct';
import { formatPrice } from '../../utils/product';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
  onCardClick?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  compact = false,
  onCardClick
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const {
    isFavorite,
    isAdding,
    justAdded,
    isLoggedIn,
    getPrice,
    getSavings,
    handleAddToCart,
    toggleFavorite
  } = useProduct();
  
  const price = getPrice(product);
  const savings = getSavings(product);
  
  const handleClick = () => {
    if (onCardClick) onCardClick(product);
  };
  
  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleAddToCart(product, 1);
  };
  
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite();
  };

  return (
    <div 
      className={`bg-white rounded-2xl overflow-hidden border border-gray-100 transition-all duration-300 ${
        isPressed ? 'scale-95' : compact ? 'hover:scale-102 active:scale-95' : 'hover:shadow-lg active:scale-98'
      }`}
      onClick={handleClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      {/* Image */}
      <div className="relative">
        <div className={compact ? "aspect-square" : "aspect-[4/3]"}>
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        
        {/* Favorite button */}
        <button 
          onClick={handleFavoriteClick}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-95 transition-transform border border-white/20"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={`w-4 h-4 transition-all duration-300 ${
            isFavorite ? 'text-red-500 fill-current scale-110 animate-heartbeat' : 'text-gray-600'
          }`} />
        </button>
        
        {/* Stock indicator */}
        <div className={`absolute bottom-3 right-3 w-2 h-2 rounded-full ${
          product.stock > 10 ? 'bg-green-400' : 
          product.stock > 0 ? 'bg-yellow-400' : 'bg-red-400'
        }`} />
      </div>
      
      <div className="p-4 space-y-2">
        {/* Category & Rating */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-lg">
            {product.category}
          </div>
        </div>
        
        {/* Product Name */}
        <h3 className={`font-bold text-gray-900 ${compact ? 'text-sm line-clamp-2 min-h-[2.5rem]' : 'text-base line-clamp-2'}`}>
          {product.name}
        </h3>
        
        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <div className="flex items-baseline space-x-2">
              <span className={`font-bold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
                {formatPrice(price)}
              </span>
              {savings > 0 && (
                <span className="text-xs text-gray-500 line-through">
                  {formatPrice(product.retailPrice)}
                </span>
              )}
            </div>
            {!compact && (
              <div className="text-xs text-gray-500 mt-1">
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </div>
            )}
          </div>
          
          {isLoggedIn && (
            <button 
              onClick={handleAddToCartClick}
              disabled={product.stock === 0 || isAdding}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-95 ${
                justAdded 
                  ? 'bg-green-500 text-white' 
                  : isAdding 
                  ? 'bg-gray-300' 
                  : 'bg-black text-white hover:bg-gray-800 disabled:bg-gray-300'
              }`}
              aria-label="Add to cart"
            >
              {justAdded ? (
                <Check className="w-4 h-4 animate-bounce-in" />
              ) : isAdding ? (
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Success Message */}
        {justAdded && (
          <div className="text-xs text-green-600 font-bold text-center animate-fade-in">
            Added to cart
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductCard;