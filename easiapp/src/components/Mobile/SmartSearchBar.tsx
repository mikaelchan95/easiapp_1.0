import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, TrendingUp, Clock, ArrowUpRight, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';

interface SmartSearchBarProps {
  onProductSelect: (product: Product) => void;
  onSearchExpand?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  onProductSelect,
  onSearchExpand,
  placeholder = "Search products...",
  autoFocus = false
}) => {
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('easi-recent-searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  // Reset active suggestion index when suggestions change
  useEffect(() => {
    setActiveSuggestionIndex(-1);
    // Resize suggestion refs array to match suggestions length
    suggestionRefs.current = suggestionRefs.current.slice(0, suggestions.length);
  }, [suggestions]);

  // Search function with debouncing
  const searchProducts = useCallback((searchQuery: string) => {
    // Only search if query has at least 2 characters
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Simulate API delay for better UX
    setTimeout(() => {
      const normalizedQuery = searchQuery.toLowerCase().trim();
      
      const results = state.products
        .filter(product => {
          const nameMatch = product.name.toLowerCase().includes(normalizedQuery);
          const descMatch = product.description.toLowerCase().includes(normalizedQuery);
          const categoryMatch = product.category.toLowerCase().includes(normalizedQuery);
          const skuMatch = product.sku.toLowerCase().includes(normalizedQuery);
          
          return nameMatch || descMatch || categoryMatch || skuMatch;
        })
        .sort((a, b) => {
          // 1. Exact prefix match in name (starts with query)
          const aNameStartsWith = a.name.toLowerCase().startsWith(normalizedQuery);
          const bNameStartsWith = b.name.toLowerCase().startsWith(normalizedQuery);
          
          if (aNameStartsWith && !bNameStartsWith) return -1;
          if (!aNameStartsWith && bNameStartsWith) return 1;
          
          // 2. Word start matches (matches start of any word in name)
          const aWordMatch = a.name.toLowerCase().split(' ').some(word => 
            word.startsWith(normalizedQuery)
          );
          const bWordMatch = b.name.toLowerCase().split(' ').some(word => 
            word.startsWith(normalizedQuery)
          );
          
          if (aWordMatch && !bWordMatch) return -1;
          if (!aWordMatch && bWordMatch) return 1;
          
          // 3. Exact name match (contains query)
          const aNameMatch = a.name.toLowerCase().includes(normalizedQuery);
          const bNameMatch = b.name.toLowerCase().includes(normalizedQuery);
          
          if (aNameMatch && !bNameMatch) return -1;
          if (!aNameMatch && bNameMatch) return 1;
          
          // 4. Featured products
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          
          // 5. In-stock items
          if (a.stock > 0 && b.stock === 0) return -1;
          if (a.stock === 0 && b.stock > 0) return 1;
          
          // 6. Higher stock items (more popular)
          return b.stock - a.stock;
        })
        .slice(0, 5); // Limit to top 5 results

      setSuggestions(results);
      setIsLoading(false);
    }, 150);
  }, [state.products]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchProducts(query);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query, searchProducts]);

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true);
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    // Search with current query if it has at least 2 characters
    if (query.trim().length >= 2) {
      searchProducts(query);
    }
  };

  // Handle input blur with delay to allow click on suggestions
  const handleBlur = (e: React.FocusEvent) => {
    // Check if the related target is inside the container
    if (containerRef.current && containerRef.current.contains(e.relatedTarget as Node)) {
      return; // Don't close if focusing on an element inside the container
    }
    
    // Add a small delay before closing to allow clicking on suggestions
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  // Handle search submission
  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery || searchQuery.trim().length < 2) return;
    
    // Save to recent searches
    const updatedSearches = [
      searchQuery, 
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, 5);
    
    setRecentSearches(updatedSearches);
    
    try {
      localStorage.setItem('easi-recent-searches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
    
    // Expand to full search if available
    if (onSearchExpand) {
      onSearchExpand();
    }
    
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    onProductSelect(product);
    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
    
    if (navigator.vibrate) {
      navigator.vibrate(25);
    }
  };

  // Handle recent search selection
  const handleRecentSelect = (search: string) => {
    setQuery(search);
    setTimeout(() => searchProducts(search), 0);
    
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  // Clear input
  const clearInput = () => {
    setQuery('');
    setSuggestions([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Enhanced key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only handle keyboard navigation when dropdown is open
    if (!isOpen) {
      if (e.key === 'Enter') {
        if (query.trim().length >= 2) {
          handleSearch();
        }
      } else if (e.key === 'Escape') {
        inputRef.current?.blur();
      } else if (e.key === 'ArrowDown' && query.trim().length >= 2) {
        e.preventDefault();
        setIsOpen(true);
        setActiveSuggestionIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (suggestions.length > 0) {
          const nextIndex = 
            activeSuggestionIndex < suggestions.length - 1 
              ? activeSuggestionIndex + 1 
              : 0;
          
          setActiveSuggestionIndex(nextIndex);
          
          // Scroll into view if needed
          if (suggestionRefs.current[nextIndex]) {
            suggestionRefs.current[nextIndex]?.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest' 
            });
          }
          
          // Haptic feedback
          if (navigator.vibrate) {
            navigator.vibrate(5);
          }
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (suggestions.length > 0) {
          const prevIndex = 
            activeSuggestionIndex > 0 
              ? activeSuggestionIndex - 1 
              : suggestions.length - 1;
          
          setActiveSuggestionIndex(prevIndex);
          
          // Scroll into view if needed
          if (suggestionRefs.current[prevIndex]) {
            suggestionRefs.current[prevIndex]?.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'nearest' 
            });
          }
          
          // Haptic feedback
          if (navigator.vibrate) {
            navigator.vibrate(5);
          }
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
          handleProductSelect(suggestions[activeSuggestionIndex]);
        } else if (query.trim().length >= 2) {
          handleSearch();
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: { [key: string]: string } = {
      wine: '🍷',
      whisky: '🥃',
      spirits: '🍸',
      liqueurs: '🍹'
    };
    return emojis[category] || '🍾';
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 text-gray-900 font-semibold rounded px-1">
          {part}
        </span>
      ) : part
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input */}
      <div className={`relative transition-all duration-300 ${
        isOpen ? 'transform scale-102' : ''
      }`}>
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className={`w-4 h-4 transition-colors ${
            isOpen ? 'text-gray-900' : 'text-gray-400'
          }`} />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full pl-12 pr-12 py-4 bg-white border rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none transition-all duration-300 ${
            isOpen 
              ? 'border-gray-900 shadow-lg ring-4 ring-gray-900/10' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-activedescendant={
            activeSuggestionIndex >= 0 
              ? `suggestion-${suggestions[activeSuggestionIndex]?.id}` 
              : undefined
          }
        />
        
        {query && (
          <button
            onClick={clearInput}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 active:scale-95 transition-transform"
            aria-label="Clear search"
          >
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors">
              <X className="w-3 h-3 text-gray-600" />
            </div>
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && (
        <div 
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in"
          id="search-suggestions"
          role="listbox"
        >
          {/* Loading State */}
          {isLoading && query && query.length >= 2 && (
            <div className="p-4 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin mr-2"></div>
              <span className="text-gray-600 text-sm">Searching...</span>
            </div>
          )}

          {/* Short Query Indicator */}
          {query && query.length < 2 && (
            <div className="p-4 text-center border-b border-gray-100">
              <div className="text-gray-500 text-sm">Type at least 2 characters to search</div>
            </div>
          )}

          {/* Recent Searches - shown when no query */}
          {!query && recentSearches.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Recent</span>
              </div>
              <div className="space-y-2">
                {recentSearches.slice(0, 3).map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSelect(search)}
                    className="w-full text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-gray-900">{search}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Suggestions - shown for valid queries */}
          {suggestions.length > 0 && query.length >= 2 && (
            <div className="max-h-80 overflow-y-auto scrollbar-hide">
              {suggestions.map((product, index) => {
                const price = state.user?.role === 'trade' ? product.tradePrice : product.retailPrice;
                const isActive = index === activeSuggestionIndex;
                
                return (
                  <button
                    ref={el => suggestionRefs.current[index] = el}
                    key={product.id}
                    id={`suggestion-${product.id}`}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleProductSelect(product)}
                    onMouseEnter={() => setActiveSuggestionIndex(index)}
                    className={`w-full p-4 flex items-center space-x-3 text-left animate-fade-in transition-colors ${
                      isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                            {highlightMatch(product.name, query)}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {getCategoryEmoji(product.category)} {product.category}
                            </span>
                            {product.stock <= 5 && product.stock > 0 && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-semibold">
                                {product.stock} left
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-3">
                          <span className="text-sm font-bold text-gray-900">
                            ${price.toFixed(0)}
                          </span>
                          <ArrowUpRight className="w-3 h-3 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {query && query.length >= 2 && !isLoading && suggestions.length === 0 && (
            <div className="p-4 text-center">
              <div className="text-gray-500 mb-2">No products found</div>
              <button
                onClick={() => handleSearch(query)}
                className="text-sm text-gray-900 font-semibold hover:underline"
              >
                Search all products
              </button>
            </div>
          )}

          {/* Popular Searches - shown when no query or recent searches */}
          {(!query || query.length < 2) && recentSearches.length === 0 && !isLoading && (
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Popular</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Whisky', 'Wine', 'Vodka', 'Gin', 'Rum'].map((term) => (
                  <button
                    key={term}
                    onClick={() => handleRecentSelect(term)}
                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* View All Results */}
          {query && query.length >= 2 && suggestions.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => handleSearch(query)}
                className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors active:scale-95 flex items-center justify-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>See All Results</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearchBar;