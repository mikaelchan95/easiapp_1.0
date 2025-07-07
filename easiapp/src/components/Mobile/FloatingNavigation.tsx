import React from 'react';
import { Search, ShoppingCart, Home, MessageCircle, User } from 'lucide-react';

interface FloatingNavigationProps {
  onNavigationClick?: (item: string) => void;
  cartCount?: number;
  activeItem?: string;
}

const FloatingNavigation: React.FC<FloatingNavigationProps> = ({ 
  onNavigationClick, 
  cartCount = 0,
  activeItem = 'Home'
}) => {
  const navItems = [
    { icon: Search, label: 'Explore', active: activeItem === 'Explore' },
    { icon: ShoppingCart, label: 'Cart', active: activeItem === 'Cart', hasCount: true },
    { icon: Home, label: 'Home', active: activeItem === 'Home' },
    { icon: MessageCircle, label: 'Chat', active: activeItem === 'Chat' },
    { icon: User, label: 'Profile', active: activeItem === 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white/95 backdrop-blur-lg border-t border-gray-100 px-5 py-3 shadow-2xl">
        <div className="flex justify-center space-x-8 max-w-sm mx-auto">
          {navItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <button 
                key={index} 
                className="flex flex-col items-center py-1 transition-all duration-300 relative btn-ios-press group"
                onClick={() => onNavigationClick?.(item.label)}
              >
                <div className={`p-2 rounded-xl transition-all duration-300 relative ${
                  item.active 
                    ? 'bg-black shadow-lg scale-110 group-hover:shadow-xl' 
                    : 'hover:bg-gray-50 group-hover:scale-105'
                }`}>
                  <IconComponent className={`w-4 h-4 transition-colors duration-300 ${
                    item.active ? 'text-white' : 'text-gray-600 group-hover:text-gray-800'
                  }`} />
                  
                  {/* Cart Badge with enhanced animation */}
                  {item.hasCount && cartCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-in">
                      <span className="text-xs font-bold text-white">
                        {cartCount > 9 ? '9+' : cartCount}
                      </span>
                      <div className="absolute inset-0 bg-primary-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                  )}
                </div>
                <span className={`text-xs font-medium mt-1 transition-all duration-300 ${
                  item.active ? 'text-black scale-105' : 'text-gray-500 group-hover:text-gray-700'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom,0px)] w-full"></div>
      </div>
    </div>
  );
};

export default FloatingNavigation;