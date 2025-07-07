import React from 'react';
import { Truck, Shield, Award, Clock } from 'lucide-react';

const TrustBadges: React.FC = () => {
  const badges = [
    {
      icon: Truck,
      title: 'Same Day Delivery',
      description: 'Order before 2PM',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: Shield,
      title: '100% Authentic',
      description: 'Verified products',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: Award,
      title: 'Premium Selection',
      description: 'Curated collection',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Always here to help',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <div className="bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map((badge, index) => {
            const IconComponent = badge.icon;
            return (
              <div 
                key={index}
                className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className={`w-12 h-12 ${badge.iconBg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <IconComponent 
                    className={`w-6 h-6 ${badge.iconColor}`}
                    aria-label={badge.title}
                  />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{badge.title}</h3>
                <p className="text-sm text-gray-600">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrustBadges;