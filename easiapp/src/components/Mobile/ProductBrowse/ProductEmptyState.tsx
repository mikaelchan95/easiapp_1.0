import React from 'react';
import { Search } from 'lucide-react';

interface ProductEmptyStateProps {
  query?: string;
  onReset: () => void;
}

const ProductEmptyState: React.FC<ProductEmptyStateProps> = ({ 
  query,
  onReset
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 animate-fade-in">
        <Search className="w-8 h-8 text-gray-400" />
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-4 animate-fade-in">
        {query ? 'No Results Found' : 'No Products Found'}
      </h3>
      
      <p className="text-gray-500 mb-8 animate-fade-in">
        {query 
          ? `We couldn't find any matches for "${query}"`
          : "We couldn't find any products matching your criteria"
        }
      </p>
      
      <button
        onClick={onReset}
        className="bg-black text-white px-8 py-4 rounded-xl font-bold animate-fade-in active:scale-95 transition-transform"
      >
        Reset Filters
      </button>
    </div>
  );
};

export default ProductEmptyState;