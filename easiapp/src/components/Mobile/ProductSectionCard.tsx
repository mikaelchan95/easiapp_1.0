import React from 'react';
import { ArrowRight } from 'lucide-react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { Product } from '../../types';
import ProductCard from './ProductCard';

interface ProductSectionCardProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  products: Product[];
  onViewAll?: () => void;
  onProductClick?: (product: Product) => void;
}

const ProductSectionCard: React.FC<ProductSectionCardProps> = ({
  title,
  icon: Icon,
  iconColor,
  products,
  onViewAll,
  onProductClick,
}) => {
  if (products.length === 0) return null;
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center">
            <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        </div>
        {onViewAll && (
          <button 
            onClick={onViewAll}
            className="flex items-center space-x-1 text-gray-900 font-bold px-3 py-2 rounded-lg active:scale-95 transition-transform"
          >
            <span className="text-sm">All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="flex space-x-3 px-4 overflow-x-auto scrollbar-hide pb-1">
        {products.map((product) => (
          <div key={product.id} className="flex-shrink-0 w-40">
            <ProductCard 
              product={product}
              isCompact
              onClick={() => onProductClick?.(product)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSectionCard;