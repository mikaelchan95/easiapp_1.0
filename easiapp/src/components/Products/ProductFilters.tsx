import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Icon, getCategoryIcon } from '../../utils/icons';

const ProductFilters: React.FC = () => {
  const { state, dispatch } = useApp();

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'wine', label: 'Wine' },
    { value: 'whisky', label: 'Whisky' },
    { value: 'spirits', label: 'Spirits' },
    { value: 'liqueurs', label: 'Liqueurs' },
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value });
  };

  const handleCategoryChange = (category: string) => {
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: category });
  };

  const clearFilters = () => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
    dispatch({ type: 'SET_SELECTED_CATEGORY', payload: 'all' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search brands, types, or regions..."
              value={state.searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => {
            const isActive = state.selectedCategory === category.value;
            const IconComponent = getCategoryIcon(category.value);
            
            return (
              <button
                key={category.value}
                onClick={() => handleCategoryChange(category.value)}
                className={`
                  px-4 py-2.5 rounded-xl font-medium transition-all
                  flex items-center space-x-2
                  ${isActive 
                    ? 'bg-black text-white' 
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }
                `}
                aria-label={`Filter by ${category.label}`}
              >
                <Icon 
                  icon={IconComponent} 
                  size="sm" 
                  aria-label={category.label}
                />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>

        {/* Clear Filters */}
        {(state.searchQuery || state.selectedCategory !== 'all') && (
          <button
            onClick={clearFilters}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {(state.searchQuery || state.selectedCategory !== 'all') && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span>Active filters:</span>
            {state.searchQuery && (
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                "{state.searchQuery}"
              </span>
            )}
            {state.selectedCategory !== 'all' && (
              <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                {categories.find(c => c.value === state.selectedCategory)?.label}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;