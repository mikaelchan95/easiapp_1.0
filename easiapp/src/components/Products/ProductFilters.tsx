import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const ProductFilters: React.FC = () => {
  const { state, dispatch } = useApp();

  const categories = [
    { value: 'all', label: 'All Products', emoji: '🍾' },
    { value: 'wine', label: 'Wine', emoji: '🍷' },
    { value: 'whisky', label: 'Whisky', emoji: '🥃' },
    { value: 'spirits', label: 'Spirits', emoji: '🍸' },
    { value: 'liqueurs', label: 'Liqueurs', emoji: '🍹' },
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
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => handleCategoryChange(category.value)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                state.selectedCategory === category.value
                  ? 'bg-amber-600 text-white shadow-md scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
              }`}
            >
              <span>{category.emoji}</span>
              <span>{category.label}</span>
            </button>
          ))}
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