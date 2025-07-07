import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import ProductCard from '../Products/ProductCard';

interface ProductSectionProps {
  title: string;
  emoji?: string;
  products: Product[];
  onViewAll?: () => void;
  onProductClick?: (product: Product) => void;
}

const ProductSection: React.FC<ProductSectionProps> = ({ 
  title, 
  emoji, 
  products, 
  onViewAll, 
  onProductClick 
}) => {
  if (products.length === 0) return null;
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between px-5 mb-3">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          {emoji && <span className="text-lg mr-2">{emoji}</span>}
          {title}
        </h2>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="flex items-center space-x-1 text-gray-900 font-semibold active:scale-95 transition-transform"
          >
            <span className="text-sm">View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex space-x-4 px-5 overflow-x-auto scrollbar-hide pb-4">
        {products.map((product) => (
          <div key={product.id} className="flex-shrink-0 w-44">
            <ProductCard 
              product={product} 
              compact 
              onCardClick={onProductClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSection;