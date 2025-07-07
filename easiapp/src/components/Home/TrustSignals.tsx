import React from 'react';
import { Users } from 'lucide-react';

const TrustSignals: React.FC = () => {
  const signals = [
    {
      icon: "🏆",
      title: "Curated Excellence",
      description: "Hand-selected by our expert sommeliers"
    },
    {
      icon: "🚚",
      title: "Same-Day Delivery",
      description: "Temperature-controlled throughout Singapore"
    },
    {
      icon: "💎",
      title: "Trade Pricing",
      description: "Wholesale rates for businesses"
    },
    {
      icon: "🔐",
      title: "100% Authentic",
      description: "Certificates with premium bottles"
    }
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-amber-500 mr-3" />
            Why Choose EASI?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            More than just distribution - we're your partner in discovering exceptional beverages
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {signals.map((signal, index) => (
            <div 
              key={index} 
              className="text-center group animate-fade-in" 
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl transition-shadow">
                <span className="text-3xl">{signal.icon}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{signal.title}</h3>
              <p className="text-gray-600 text-sm">{signal.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSignals;