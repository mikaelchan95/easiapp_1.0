import React, { useState } from 'react';
import { ArrowLeft, Filter, Grid, List } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import SmartSearchBar from './SmartSearchBar';
import ProductGrid from './ProductGrid';
import ProductDetail from './ProductDetail';
import FloatingNavigation from './FloatingNavigation';

interface SmartSearchViewProps {
  onBack: () => void;
  initialQuery?: string;
}

const SmartSearchView: React.FC<SmartSearchViewProps> = ({ onBack, initialQuery = '' }) => {
  const { state, getCartItemCount } = useApp();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  // Search and filter products
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];

    let results = state.products.filter(product => 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort results
    switch (sortBy) {
      case 'price-low':
        results.sort((a, b) => a.retailPrice - b.retailPrice);
        break;
      case 'price-high':
        results.sort((a, b) => b.retailPrice - a.retailPrice);
        break;
      case 'name':
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'relevance':
      default:
        // Sort by relevance (name match > featured > stock)
        results.sort((a, b) => {
          const aNameMatch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
          const bNameMatch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
          
          if (aNameMatch && !bNameMatch) return -1;
          if (!aNameMatch && bNameMatch) return 1;
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          if (a.stock > 0 && b.stock === 0) return -1;
          if (a.stock === 0 && b.stock > 0) return 1;
          
          return 0;
        });
        break;
    }

    return results;
  }, [state.products, searchQuery, sortBy]);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleSearchExpand = () => {
    // Already in expanded view
  };

  const handleNavigationClick = (item: string) => {
    switch (item) {
      case 'Home':
        onBack();
        break;
      default:
        break;
    }
  };

  const getResultsText = () => {
    if (!searchQuery.trim()) return 'Enter a search term';
    if (searchResults.length === 0) return 'No results found';
    return `${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`;
  };

  return (
    <div className="bg-gray-50 min-h-screen w-full max-w-sm mx-auto relative">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-gray-100">
        <div className="px-4 py-4">
          {/* Top Bar */}
          <div className="flex items-center space-x-3 mb-4">
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center btn-ios-press"
            >
              <ArrowLeft className="w-4 h-4 text-gray-900" />
            </button>
            
            <div className="flex-1">
              <SmartSearchBar
                onProductSelect={handleProductSelect}
                onSearchExpand={handleSearchExpand}
                placeholder="Search products..."
                autoFocus={true}
              />
            </div>
          </div>

          {/* Results Info & Controls */}
          {searchQuery.trim() && (
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-600">
                {getResultsText()}
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-gray-300"
                >
                  <option value="relevance">Best Match</option>
                  <option value="price-low">Price ↑</option>
                  <option value="price-high">Price ↓</option>
                  <option value="name">A-Z</option>
                </select>

                {/* View Mode */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid' 
                        ? 'bg-white shadow-sm' 
                        : ''
                    }`}
                  >
                    <Grid className={`w-4 h-4 ${viewMode === 'grid' ? 'text-gray-900' : 'text-gray-500'}`} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'list' 
                        ? 'bg-white shadow-sm' 
                        : ''
                    }`}
                  >
                    <List className={`w-4 h-4 ${viewMode === 'list' ? 'text-gray-900' : 'text-gray-500'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        {!searchQuery.trim() ? (
          // Empty State
          <div className="flex flex-col items-center justify-center px-8 py-20">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Search Products</h3>
            <p className="text-gray-500 text-center mb-8 leading-relaxed">
              Find wines, whisky, spirits and more from our premium collection
            </p>
            
            {/* Popular Categories */}
            <div className="w-full space-y-3">
              <p className="text-sm font-semibold text-gray-700 text-center">Popular Categories</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Premium Whisky', emoji: '🥃' },
                  { name: 'Fine Wine', emoji: '🍷' },
                  { name: 'Craft Spirits', emoji: '🍸' },
                  { name: 'Liqueurs', emoji: '🍹' }
                ].map((category) => (
                  <button
                    key={category.name}
                    onClick={() => setSearchQuery(category.name.split(' ')[1].toLowerCase())}
                    className="bg-white border border-gray-200 rounded-2xl p-4 text-center hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-2xl mb-2">{category.emoji}</div>
                    <div className="text-sm font-medium text-gray-900">{category.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : searchResults.length === 0 ? (
          // No Results
          <div className="flex flex-col items-center justify-center px-8 py-20">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl">😔</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-500 text-center mb-8">
              Try searching for something else or browse our categories
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-semibold btn-premium"
            >
              Clear Search
            </button>
          </div>
        ) : (
          // Search Results
          <ProductGrid 
            products={searchResults}
            viewMode={viewMode}
          />
        )}
      </div>

      {/* Floating Navigation */}
      <FloatingNavigation 
        onNavigationClick={handleNavigationClick}
        cartCount={getCartItemCount()}
        activeItem="Explore"
      />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default SmartSearchView;