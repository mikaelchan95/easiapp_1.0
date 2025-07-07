import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CategoryIcons, CommerceIcons, Icon } from '../../utils/icons';

const Hero: React.FC = () => {
  const { dispatch } = useApp();

  const categories = [
    { name: 'Wine', icon: CategoryIcons.wine },
    { name: 'Whisky', icon: CategoryIcons.whisky },
    { name: 'Spirits', icon: CategoryIcons.spirits },
  ];

  const handleCategoryClick = (category: string) => {
    dispatch({ 
      type: 'SET_SELECTED_CATEGORY', 
      payload: category.toLowerCase() 
    });
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  };

  return (
    <section className="relative min-h-[600px] bg-gradient-to-br from-amber-600 to-amber-800 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.05) 35px, rgba(255,255,255,0.05) 70px)`
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Your Premium Alcohol
            <span className="block text-amber-200">Delivered Fast</span>
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-amber-100">
            Singapore's finest selection of wines, spirits & more
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <input
                type="text"
                name="search"
                placeholder="Search for Macallan, Dom Pérignon, Hennessy..."
                className="w-full px-6 py-4 rounded-full text-gray-900 text-lg shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-300"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-amber-600 text-white px-6 py-2 rounded-full hover:bg-amber-700 transition-colors"
              >
                <Search className="w-6 h-6" />
              </button>
            </div>
          </form>

          {/* Category Cards */}
          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mb-12">
            {categories.map((category) => (
              <motion.button
                key={category.name}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryClick(category.name)}
                className="bg-white/10 backdrop-blur-md p-6 rounded-xl hover:bg-white/20 transition-colors"
              >
                <Icon 
                  icon={category.icon} 
                  size="xl" 
                  className="mx-auto mb-2 text-amber-200"
                  aria-label={category.name}
                />
                <span className="block font-medium">{category.name}</span>
              </motion.button>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div>
              <p className="text-3xl font-bold text-amber-200">2,000+</p>
              <p className="text-sm">Premium Products</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-200">1-3hr</p>
              <p className="text-sm">Express Delivery</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-200">24/7</p>
              <p className="text-sm">Customer Support</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Elements */}
      <motion.div
        animate={{ 
          y: [0, -10, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-10 right-10 bg-amber-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center space-x-2"
      >
        <Icon 
          icon={CommerceIcons.delivery} 
          size="md"
          aria-label="Same day delivery"
        />
        <span className="font-bold">Same Day Delivery</span>
      </motion.div>

      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <button className="bg-white text-amber-600 px-8 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition-shadow flex items-center space-x-2">
          <span>Shop Now</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>
    </section>
  );
};

export default Hero;