import React from 'react';
import { Heart, Plus, Check } from 'lucide-react';
import { Product } from '../../types';
import { useProduct } from '../../hooks/useProduct';
import { formatPrice, getStockColor } from '../../utils/product';

interface ProductListItemProps {
  product: Product;
  onClick: () => void;
}

const ProductListItem: React.FC<ProductListItemProps> = ({ product, onClick }) => {
  const {
    isFavorite,
    isAdding,
    justAdded,
    isLoggedIn,
    getPrice,
    handleAddToCart,
    toggleFavorite
  } = useProduct();
  
  const price = getPrice(product);

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleAddToCart(product, 1);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite();
  };

  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 transition-all duration-300 cursor-pointer active:scale-98"
      onClick={onClick}
    >
      <div className="flex p-4 space-x-4">
        {/* Product Image */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover rounded-xl"
            loading="lazy"
          />

          {/* Stock indicator */}
          <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${getStockColor(product.stock)}`} />
        </div>
        
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight pr-2">
              {product.name}
            </h3>
            <button 
              onClick={handleFavoriteClick}
              className="ml-2 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform"
            >
              <Heart className={`w-4 h-4 transition-all ${
                isFavorite ? 'text-red-500 fill-current scale-110' : 'text-gray-600'
              }`} />
            </button>
          </div>
          
          <div className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-lg inline-block mb-3">
            {product.category}
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-900">
                {formatPrice(price)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </div>
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
        </div>
      </div>
    </div>
  );
};

export default ProductListItem