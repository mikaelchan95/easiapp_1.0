import React from 'react';
import { Product } from '../../types';
import ProductCard from './ProductCard';
import { mockProducts } from '../../data/mockData';

interface ProductRecommendationsProps {
  product: Product;
  onProductClick: (product: Product) => void;
  onViewAll?: () => void;
}

const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  product,
  onProductClick,
  onViewAll
}) => {
  // Get recommendations from the app context
  const getRecommendations = () => {
    // In a real app, this would be more sophisticated and come from an API
    // Here we'll just use a simple approach based on the same category
    return mockProducts
      .filter((p: Product) => 
        p.category === product.category && 
        p.id !== product.id
      )
      .slice(0, 4);
  };

  const recommendedProducts = getRecommendations();

  if (recommendedProducts.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-gray-100 pt-6 mt-8">
      <h2 className="text-lg font-bold text-gray-900 mb-4">You May Also Like</h2>
      <div className="grid grid-cols-2 gap-3">
        {recommendedProducts.map((product) => (
          <div key={product.id} className="w-full">
            <ProductCard
              product={product}
              compact
              onCardClick={onProductClick}
            />
          </div>
        ))}
      </div>
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full text-center mt-4 font-bold text-gray-900"
        >
          View More
        </button>
      )}
    </div>
  );
};

export default ProductRecommendations;