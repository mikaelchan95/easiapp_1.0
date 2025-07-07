import React, { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Filter, Grid, List, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProductGrid from '../components/Mobile/ProductGrid';
import CategoryGrid from '../components/Mobile/CategoryGrid';
import ProductFilter from '../components/Mobile/ProductBrowse/ProductFilter';
import { sortProducts } from '../utils/product';

interface ProductBrowseProps {
  onBack: () => void;
  initialCategory?: string;
}

const ProductBrowse: React.FC<ProductBrowseProps> = ({ onBack, initialCategory = 'all' }) => {
  const { state } = useApp();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = [...state.products];

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query)
      );
    }

    // Apply price filter
    filtered = filtered.filter(product => 
      product.retailPrice >= priceRange[0] && 
      product.retailPrice <= priceRange[1]
    );

    // Apply sorting
    return sortProducts(filtered, sortBy);
  }, [state.products, selectedCategory, searchQuery, sortBy, priceRange]);

  const getCategoryName = (categoryId: string) => {
    switch (categoryId) {
      case 'all': return 'All Products';
      case 'wine': return 'Wine';
      case 'whisky': return 'Whisky';
      case 'spirits': return 'Spirits';
      case 'liqueurs': return 'Liqueurs';
      default: return 'Products';
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100">
        <div className="px-4 py-3">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <button 
                onClick={onBack}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center active:scale-95 transition-transform"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4 text-gray-900" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">{getCategoryName(selectedCategory)}</h1>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center active:scale-95 transition-transform"
              aria-label="Show filters"
            >
              <Filter className="w-4 h-4 text-gray-700" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-3 flex items-center">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black/20 focus:bg-white transition-all"
            />
          </div>

          {/* Category Tabs */}
          <div className="mb-3">
            <CategoryGrid 
              activeCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </div>

          {/* View Controls */}
          <div className="flex items-center justify-between pb-2">
            {/* Result Count */}
            <div className="text-xs text-gray-500 font-medium">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'result' : 'results'}
            </div>
            
            {/* Sort & View Controls */}
            <div className="flex items-center space-x-3">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-black/20"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A-Z</option>
              </select>
              
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                  aria-label="Grid view"
                >
                  <Grid className={`w-3.5 h-3.5 ${viewMode === 'grid' ? 'text-gray-900' : 'text-gray-500'}`} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                  aria-label="List view"
                >
                  <List className={`w-3.5 h-3.5 ${viewMode === 'list' ? 'text-gray-900' : 'text-gray-500'}`} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Filters Panel */}
          {showFilters && (
            <div className="border-t border-gray-100 py-4 animate-slide-down">
              <ProductFilter
                priceRange={priceRange}
                onPriceRangeChange={setPriceRange}
                onClose={() => setShowFilters(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="page-content pb-24">
        <ProductGrid 
          products={filteredProducts}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};

export default ProductBrowse;