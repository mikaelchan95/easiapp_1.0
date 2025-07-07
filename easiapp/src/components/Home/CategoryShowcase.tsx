import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getCategoryEmoji } from '../../utils/product';

const CategoryShowcase: React.FC = () => {
  const { state } = useApp();
  
  const topCategories = [
    {
      name: 'Premium Whisky',
      description: 'Single malts and rare blends',
      image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=400',
      count: state.products.filter(p => p.category === 'whisky').length,
      slug: 'whisky'
    },
    {
      name: 'Fine Wines',
      description: 'Bordeaux, Burgundy & Champagne',
      image: 'https://images.pexels.com/photos/1120873/pexels-photo-1120873.jpeg?auto=compress&cs=tinysrgb&w=400',
      count: state.products.filter(p => p.category === 'wine').length,
      slug: 'wine'
    },
    {
      name: 'Craft Spirits',
      description: 'Artisanal vodka, gin & rum',
      image: 'https://images.pexels.com/photos/5530273/pexels-photo-5530273.jpeg?auto=compress&cs=tinysrgb&w=400',
      count: state.products.filter(p => p.category === 'spirits').length,
      slug: 'spirits'
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-amber-500 mr-3" />
            Popular Categories
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our most sought-after categories, from rare collectibles to everyday favorites
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {topCategories.map((category, index) => (
            <Link
              key={category.name}
              to={`/products?category=${category.slug}`}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 animate-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{getCategoryEmoji(category.slug)}</span>
                  <h3 className="text-xl font-bold">{category.name}</h3>
                </div>
                <p className="text-gray-200 text-sm mb-2">{category.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    {category.count} products
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;