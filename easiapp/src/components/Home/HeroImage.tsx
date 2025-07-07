import React from 'react';

const HeroImage: React.FC = () => {
  return (
    <div className="relative hidden lg:block">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <img
            src="https://images.pexels.com/photos/1283219/pexels-photo-1283219.jpeg?auto=compress&cs=tinysrgb&w=400"
            alt="Premium Whisky"
            className="w-full h-48 object-cover rounded-2xl shadow-lg"
            loading="lazy"
          />
          <img
            src="https://images.pexels.com/photos/1120873/pexels-photo-1120873.jpeg?auto=compress&cs=tinysrgb&w=400"
            alt="Fine Wine"
            className="w-full h-32 object-cover rounded-2xl shadow-lg"
            loading="lazy"
          />
        </div>
        <div className="space-y-4 mt-8">
          <img
            src="https://images.pexels.com/photos/5530273/pexels-photo-5530273.jpeg?auto=compress&cs=tinysrgb&w=400"
            alt="Premium Spirits"
            className="w-full h-32 object-cover rounded-2xl shadow-lg"
            loading="lazy"
          />
          <img
            src="https://images.pexels.com/photos/774455/pexels-photo-774455.jpeg?auto=compress&cs=tinysrgb&w=400"
            alt="Luxury Collection"
            className="w-full h-48 object-cover rounded-2xl shadow-lg"
            loading="lazy"
          />
        </div>
      </div>

      {/* Animation overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-transparent opacity-50 rounded-2xl"></div>
    </div>
  );
};

export default HeroImage;