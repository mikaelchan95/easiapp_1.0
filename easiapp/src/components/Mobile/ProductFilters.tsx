import React from 'react';
import { X } from 'lucide-react';

interface ProductFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  onClose: () => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  priceRange,
  onPriceRangeChange,
  onClose
}) => {
  const priceRanges = [
    { id: [0, 100], name: 'Under $100' },
    { id: [100, 300], name: '$100 - $300' },
    { id: [300, 500], name: '$300 - $500' },
    { id: [500, 1000], name: '$500+' },
  ];

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h4 className="text-base font-medium text-gray-900 mb-3">Price</h4>
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <button
              key={range.name}
              onClick={() => onPriceRangeChange(range.id as [number, number])}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                priceRange[0] === range.id[0] && priceRange[1] === range.id[1]
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="font-medium">{range.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;