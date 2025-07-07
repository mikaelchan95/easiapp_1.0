import React from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, Star, Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const Hero: React.FC = () => {
  const { state } = useApp();

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Premium Alcohol
              <span className="text-amber-600 block">Delivered Fresh</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Discover our curated selection of fine wines, premium whisky, craft spirits, and artisanal liqueurs. 
              From everyday favorites to rare collectibles - we deliver quality to your doorstep.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                to="/products"
                className="bg-amber-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-amber-700 transition-colors flex items-center justify-center space-x-2 shadow-lg"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Shop Now</span>
              </Link>
              {!state.user && (
                <Link
                  to="/login"
                  className="border-2 border-amber-600 text-amber-600 px-8 py-4 rounded-lg font-semibold hover:bg-amber-600 hover:text-white transition-colors flex items-center justify-center space-x-2"
                >
                  <Users className="w-5 h-5" />
                  <span>Trade Account</span>
                </Link>
              )}
            </div>

            {/* Quick Search */}
            <div className="mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search whisky, wine, spirits..."
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
                  onClick={() => window.location.href = '/products'}
                />
              </div>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: 'Wine', icon: '🍷' },
                { name: 'Whisky', icon: '🥃' },
                { name: 'Spirits', icon: '🍸' },
                { name: 'Liqueurs', icon: '🍹' },
              ].map((category) => (
                <Link
                  key={category.name}
                  to={`/products?category=${category.name.toLowerCase()}`}
                  className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center group"
                >
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className="font-medium text-gray-900 group-hover:text-amber-600 transition-colors">
                    {category.name}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img
                  src="https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Premium Whisky"
                  className="w-full h-48 object-cover rounded-2xl shadow-lg"
                />
                <img
                  src="https://images.pexels.com/photos/1120873/pexels-photo-1120873.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Fine Wine"
                  className="w-full h-32 object-cover rounded-2xl shadow-lg"
                />
              </div>
              <div className="space-y-4 mt-8">
                <img
                  src="https://images.pexels.com/photos/5530273/pexels-photo-5530273.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Premium Spirits"
                  className="w-full h-32 object-cover rounded-2xl shadow-lg"
                />
                <img
                  src="https://images.pexels.com/photos/774455/pexels-photo-774455.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Luxury Collection"
                  className="w-full h-48 object-cover rounded-2xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Selection</h3>
              <p className="text-gray-600 text-sm">
                Curated collection of the world's finest alcoholic beverages
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Trade Pricing</h3>
              <p className="text-gray-600 text-sm">
                Wholesale rates for restaurants, bars, and retailers
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚚</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast Delivery</h3>
              <p className="text-gray-600 text-sm">
                Same-day delivery across Singapore with temperature control
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Authenticity Guaranteed</h3>
              <p className="text-gray-600 text-sm">
                100% authentic products with certificates of authenticity
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;