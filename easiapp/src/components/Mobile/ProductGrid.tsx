import React, { useState } from 'react';
import ProductCard from './ProductCard';
import ProductListItem from './ProductListItem';
import { Product } from '../../types';
import ProductDetail from './ProductDetail';
import ProductEmptyState from './ProductBrowse/ProductEmptyState';

interface ProductGridProps {
  products: Product[];
  viewMode: 'grid' | 'list';
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, viewMode }) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  if (products.length === 0) {
    return (
      <ProductEmptyState onReset={() => {}} />
    );
  }

  return (
    <>
      <div className="px-4 py-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4">
            {products.map((product, index) => (
              <div 
                key={product.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ProductCard 
                  product={product}
                  onClick={() => handleProductClick(product)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product, index) => (
              <div 
                key={product.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ProductListItem 
                  product={product}
                  onClick={() => handleProductClick(product)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
};

export default ProductGrid;