import React from 'react';
import MobileHeader from '../components/Mobile/MobileHeader';
import CategorySection from '../components/Mobile/CategorySection';
import BalanceRewards from '../components/Mobile/BalanceRewards';
import CarouselBanner from '../components/Mobile/CarouselBanner';
import ProductSection from '../components/Mobile/ProductSection';
import FeaturedProduct from '../components/Mobile/FeaturedProduct';
import BottomNavigation from '../components/Mobile/BottomNavigation';

const MobileHome: React.FC = () => {
  const hotDealsProducts = [
    {
      id: '1',
      name: 'Premium Wine',
      price: 800,
      rating: 4.9,
      image: 'https://images.pexels.com/photos/1120873/pexels-photo-1120873.jpeg?auto=compress&cs=tinysrgb&w=200',
      isLimitedOffer: true,
    },
    {
      id: '2',
      name: 'Premium Wine',
      price: 800,
      rating: 4.9,
      image: 'https://images.pexels.com/photos/1120873/pexels-photo-1120873.jpeg?auto=compress&cs=tinysrgb&w=200',
      isLimitedOffer: true,
    },
    {
      id: '3',
      name: 'Premium Wine',
      price: 800,
      rating: 4.9,
      image: 'https://images.pexels.com/photos/1120873/pexels-photo-1120873.jpeg?auto=compress&cs=tinysrgb&w=200',
      isLimitedOffer: true,
    },
  ];

  const newArrivalsProducts = [
    {
      id: '4',
      name: 'Premium Whisky',
      price: 650,
      rating: 4.9,
      image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
    {
      id: '5',
      name: 'Premium Whisky',
      price: 650,
      rating: 4.9,
      image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
    {
      id: '6',
      name: 'Premium Whisky',
      price: 650,
      rating: 4.9,
      image: 'https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
  ];

  const recommendedProducts = [
    {
      id: '7',
      name: 'Premium Spirits',
      price: 450,
      rating: 4.9,
      image: 'https://images.pexels.com/photos/5530273/pexels-photo-5530273.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
    {
      id: '8',
      name: 'Premium Spirits',
      price: 450,
      rating: 4.9,
      image: 'https://images.pexels.com/photos/5530273/pexels-photo-5530273.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
    {
      id: '9',
      name: 'Premium Spirits',
      price: 450,
      rating: 4.9,
      image: 'https://images.pexels.com/photos/5530273/pexels-photo-5530273.jpeg?auto=compress&cs=tinysrgb&w=200',
    },
  ];

  return (
    <div className="min-h-screen bg-white max-w-[430px] mx-auto relative">
      <div className="flex flex-col h-screen">
        {/* Header */}
        <MobileHeader />
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <CategorySection />
          <BalanceRewards />
          <CarouselBanner />
          <ProductSection title="Hot Deals" products={hotDealsProducts} />
          <FeaturedProduct />
          <ProductSection title="New Arrivals" products={newArrivalsProducts} />
          <ProductSection title="Recommended for you" products={recommendedProducts} />
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </div>
  );
};

export default MobileHome;