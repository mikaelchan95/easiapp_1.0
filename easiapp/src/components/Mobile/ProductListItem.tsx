import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';

interface ProductListItemProps {
  product: Product;
  onClick: () => void;
}

const ProductListItem: React.FC<ProductListItemProps> = ({ product, onClick }) => {
  const { state, addToCart } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  
  const price = state.user?.role === 'trade' ? product.tradePrice : product.retailPrice;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (state.user && !isAdding && product.stock > 0) {
      setIsAdding(true);
      
      setTimeout(() => {
        addToCart(product, 1);
        setIsAdding(false);
      }, 300);
    }
  };

  return (
    <div 
      className="bg-white rounded-2xl overflow-hidden border border-gray-200 active:scale-98"
      onClick={onClick}
    >
      <div className="flex p-4 space-x-4">
        {/* Product Image */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover rounded-xl"
          />

          {/* Stock indicator */}
          <div className={`absolute bottom-1 right-1 w-2 h-2 rounded-full ${
            product.stock > 10 ? 'bg-green-400' : 
            product.stock > 0 ? 'bg-yellow-400' : 'bg-red-400'
          }`} />
        </div>
        
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 capitalize mb-1">
            {product.category}
          </div>
          
          <h3 className="text-gray-900 font-bold mb-2 line-clamp-2 leading-tight">
            {product.name}
          </h3>
          
          <div className="flex items-center justify-between">
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
    </div>
  );
};

export default ProductListItem;