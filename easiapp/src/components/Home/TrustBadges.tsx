import React from 'react';
import { ShoppingBag, Users, Star } from 'lucide-react';

const TrustBadges: React.FC = () => {
  const badges = [
    {
      icon: <ShoppingBag className="w-8 h-8 text-amber-600" />,
      title: "Premium Selection",
      description: "Curated collection of the world's finest alcoholic beverages"
    },
    {
      icon: <Users className="w-8 h-8 text-amber-600" />,
      title: "Trade Pricing",
      description: "Wholesale rates for restaurants, bars, and retailers"
    },
    {
      icon: <span className="text-2xl">🚚</span>,
      title: "Fast Delivery",
      description: "Same-day delivery across Singapore with temperature control"
    },
    {
      icon: <Star className="w-8 h-8 text-amber-600" />,
      title: "Authenticity Guaranteed",
      description: "100% authentic products with certificates of authenticity"
    }
  ];

  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {badges.map((badge, index) => (
            <div 
              key={index} 
              className="text-center animate-fade-in" 
              style={{animationDelay: `${index * 100}ms`}}
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {badge.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{badge.title}</h3>
              <p className="text-gray-600 text-sm">
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustBadges;