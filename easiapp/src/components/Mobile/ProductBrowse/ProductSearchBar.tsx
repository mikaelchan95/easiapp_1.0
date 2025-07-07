import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface ProductSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
}

const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search products...",
  onFocus
}) => {
  const handleClearSearch = () => {
    onChange('');
  };

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/10 focus:bg-white transition-all"
      />
      {value && (
        <button
          onClick={handleClearSearch}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 active:scale-95 transition-transform"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default ProductSearchBar;