import React from 'react';
import { X } from 'lucide-react';

interface ProductFilterProps {
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  onClose: () => void;
}

const ProductFilter: React.FC<ProductFilterProps> = ({
  priceRange,
  onPriceRangeChange,
  onClose
}) => {
  const priceRanges = [
    { id: [0, 100], name: 'Under $100' },
    { id: [100, 300], name: '$100 - $300' },
    { id: [300, 500], name: '$300 - $500' },
    { id: [500, 1000], name: '$500 - $1,000' },
    { id: [1000, 10000], name: '$1,000 & Above' },
  ];

  const resetFilters = () => {
    onPriceRangeChange([0, 10000]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Price Range</h3>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      
      <div className="space-y-3">
        {priceRanges.map((range) => (
          <button
            key={range.name}
            onClick={() => onPriceRangeChange(range.id as [number, number])}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 active:scale-95 ${
              priceRange[0] === range.id[0] && priceRange[1] === range.id[1]
                ? 'bg-black text-white'
                : 'bg-white border border-gray-100 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="font-medium">{range.name}</span>
          </button>
        ))}
      </div>
      
      <div className="pt-4 border-t border-gray-100">
        <button
          onClick={resetFilters}
          className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-bold active:scale-95 transition-transform"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default ProductFilter;