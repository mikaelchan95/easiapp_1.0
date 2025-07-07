import React from 'react';
import { ArrowLeft, Search, SlidersHorizontal } from 'lucide-react';

interface SearchHeaderProps {
  onBack: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterToggle: () => void;
}

const SearchHeader: React.FC<SearchHeaderProps> = ({
  onBack,
  searchQuery,
  onSearchChange,
  onFilterToggle
}) => {
  return (
    <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
      <div className="px-4 py-4">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-sm"
            />
          </div>
          
          <button 
            onClick={onFilterToggle}
            className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center"
          >
            <SlidersHorizontal className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchHeader;