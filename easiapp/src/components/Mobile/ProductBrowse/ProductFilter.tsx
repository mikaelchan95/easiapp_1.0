import React from 'react';
import { X, ChevronDown } from 'lucide-react';
import { useApp } from '../../../context/AppContext';

interface ProductFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  onClose: () => void;
}

const ProductFilter: React.FC<ProductFilterProps> = ({
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  priceRange,
  onPriceRangeChange,
  onClose
}) => {
  const { state } = useApp();
  
  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'wine', name: 'Wine' },
    { id: 'whisky', name: 'Whisky' },
    { id: 'spirits', name: 'Spirits' },
    { id: 'liqueurs', name: 'Liqueurs' }
  ];
  
  const sortOptions = [
    { id: 'featured', name: 'Featured' },
    { id: 'price-asc', name: 'Price: Low to High' },
    { id: 'price-desc', name: 'Price: High to Low' },
    { id: 'name-asc', name: 'Name: A to Z' },
  ];
  
  const priceRanges = [
    { id: [0, 100], name: 'Under $100' },
    { id: [100, 300], name: '$100 - $300' },
    { id: [300, 500], name: '$300 - $500' },
    { id: [500, 1000], name: '$500+' },
  ];

  const resetFilters = () => {
    onCategoryChange('all');
    onSortChange('featured');
    onPriceRangeChange([0, 1000]);
  };
  
  return (
    <div className="bg-white rounded-xl">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="font-bold text-lg text-gray-900">Filter Products</h3>
        <button 
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      
      <div className="p-4 space-y-6">
        {/* Categories */}
        <div>
          <h4 className="font-bold text-gray-900 mb-3">Categories</h4>
          <div className="space-y-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                  selectedCategory === category.id
                    ? 'bg-black text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                } active:scale-98`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Sort By */}
        <div>
          <h4 className="font-bold text-gray-900 mb-3">Sort By</h4>
          <div className="space-y-2">
            {sortOptions.map(option => (
              <button
                key={option.id}
                onClick={() => onSortChange(option.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                  sortBy === option.id
                    ? 'bg-black text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                } active:scale-98`}
              >
                {option.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Price Range */}
        <div>
          <h4 className="font-bold text-gray-900 mb-3">Price</h4>
          <div className="space-y-2">
            {priceRanges.map(range => (
              <button
                key={range.name}
                onClick={() => onPriceRangeChange(range.id as [number, number])}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                  priceRange[0] === range.id[0] && priceRange[1] === range.id[1]
                    ? 'bg-black text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                } active:scale-98`}
              >
                {range.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Reset button */}
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={resetFilters}
            className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold active:scale-95 transition-transform"
          >
            Reset All Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductFilter;