import React from 'react';
import { Link } from 'react-router-dom';
import { Award, ArrowRight } from 'lucide-react';
import ProductCard from '../Products/ProductCard';
import { useApp } from '../../context/AppContext';

const FeaturedProducts: React.FC = () => {
  const { state } = useApp();
  
  // Get featured products
  const featuredProducts = state.products.filter(product => product.featured).slice(0, 4);

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Award className="w-8 h-8 text-amber-500 mr-3" />
              Featured Selection
            </h2>
            <p className="text-gray-600">Hand-picked premium beverages from our collection</p>
          </div>
          <Link
            to="/products"
            className="flex items-center space-x-2 text-amber-600 hover:text-amber-700 font-medium transition-colors bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md active:scale-95"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product, index) => (
            <div 
              key={product.id} 
              className="animate-fade-in" 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;