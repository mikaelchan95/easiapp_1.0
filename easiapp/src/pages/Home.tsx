import React, { useEffect } from 'react';
import HomeHero from '../components/Home/HomeHero';
import ProductCarousel from '../components/Home/ProductCarousel';
import CategoryShowcase from '../components/Home/CategoryShowcase';
import TrustSignals from '../components/Home/TrustSignals';
import NewsletterSignup from '../components/Home/NewsletterSignup';
import { useHomeData } from '../hooks/useHomeData';
import { Flame, Sparkles, Star } from 'lucide-react';

const Home: React.FC = () => {
  const { 
    featuredProducts, 
    newArrivals, 
    trendingProducts 
  } = useHomeData();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="animate-fade-in">
      <HomeHero />
      
      {/* Product Carousels */}
      {featuredProducts.length > 0 && (
        <ProductCarousel
          title="Featured Selection"
          icon={<Star className="w-5 h-5 text-amber-600" />}
          products={featuredProducts}
          viewAllUrl="/products?featured=true"
        />
      )}
      
      {trendingProducts.length > 0 && (
        <ProductCarousel
          title="Trending Now"
          icon={<Flame className="w-5 h-5 text-red-500" />}
          products={trendingProducts}
          viewAllUrl="/products?sort=popular"
        />
      )}
      
      {/* Categories */}
      <CategoryShowcase />
      
      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <ProductCarousel
          title="New Arrivals"
          icon={<Sparkles className="w-5 h-5 text-blue-500" />}
          products={newArrivals}
          viewAllUrl="/products?sort=newest"
        />
      )}
      
      {/* Trust Signals */}
      <TrustSignals />
      
      {/* Newsletter */}
      <NewsletterSignup />
    </div>
  );
};

export default Home;