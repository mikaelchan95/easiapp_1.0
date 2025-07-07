import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Star, ChevronRight } from 'lucide-react';
import { Product } from '../../types';
import { getCategoryEmoji, truncateText } from '../../utils/product';

interface ProductSearchProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  products,
  onProductSelect,
  onSearch,
  placeholder = "Search products..."
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Handle search query changes
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    
    const searchTerms = query.toLowerCase().trim();
    const results = products
      .filter(product => 
        product.name.toLowerCase().includes(searchTerms) ||
        product.description.toLowerCase().includes(searchTerms) ||
        product.category.toLowerCase().includes(searchTerms)
      )
      .slice(0, 5); // Limit to 5 suggestions
      
    setSuggestions(results);
  }, [query, products]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };
  
  const handleInputFocus = () => {
    setIsFocused(true);
  };
  
  const handleClear = () => {
    setQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  const handleProductClick = (product: Product) => {
    onProductSelect(product);
    setIsFocused(false);
    setQuery('');
  };
  
  const handleSubmitSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSearch(query);
    setIsFocused(false);
  };
  
  const highlightMatch = (text: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.trim()})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? (
            <span key={i} className="bg-yellow-200 text-gray-900 font-semibold rounded-sm">
              {part}
            </span>
          ) : part
        )}
      </>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmitSearch}>
        <div className={`relative transition-all duration-300 ${
          isFocused ? 'transform scale-102 shadow-lg' : ''
        }`}>
          <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 transition-colors ${
            isFocused ? 'text-gray-900' : 'text-gray-400'
          }`} />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className={`w-full pl-12 pr-10 py-4 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none transition-all duration-300 ${
              isFocused 
                ? 'border-gray-400 ring-4 ring-gray-900/10' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          />
          
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 animate-fade-in">
          {/* Product Suggestions */}
          {suggestions.length > 0 && (
            <div className="max-h-80 overflow-y-auto scrollbar-hide">
              {suggestions.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  className="w-full p-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0 active:scale-98"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 line-clamp-1">
                      {highlightMatch(product.name)}
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <span>{getCategoryEmoji(product.category)}</span>
                      <span className="capitalize">{product.category}</span>
                      {product.stock <= 5 && product.stock > 0 && (
                        <span className="bg-yellow-100 text-yellow-700 px-1 rounded-sm text-xs">
                          {product.stock} left
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {query && suggestions.length === 0 && (
            <div className="p-4 text-center">
              <div className="text-gray-500 mb-2">No products found</div>
              <button
                onClick={() => handleSubmitSearch()}
                className="text-black font-bold hover:underline"
              >
                Search for "{query}"
              </button>
            </div>
          )}
          
          {/* Search All Products */}
          {query && suggestions.length > 0 && (
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => handleSubmitSearch()}
                className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors active:scale-95 flex items-center justify-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>View All Results</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;