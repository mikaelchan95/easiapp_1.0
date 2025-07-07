import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';
import { NavigationRoute } from '../../context/NavigationContext';

interface NavbarItemProps {
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  hasCount?: boolean;
  count?: number;
  onClick: () => void;
  route: NavigationRoute;
}

const NavbarItem: React.FC<NavbarItemProps> = ({
  icon: Icon,
  label,
  isActive,
  hasCount = false,
  count = 0,
  onClick
}) => {
  // Handle the press animation
  const handlePress = () => {
    // Haptic feedback for touch devices
    if (navigator.vibrate) {
      navigator.vibrate(10); 
    }
    onClick();
  };
  
  return (
    <button 
      className="flex flex-col items-center py-1 transition-all duration-200 relative group"
      onClick={handlePress}
      aria-label={label}
    >
      <div className={`p-2 rounded-xl transition-all duration-200 relative ${
        isActive 
          ? 'bg-black shadow-md scale-110' 
          : 'hover:bg-gray-50 active:scale-90'
      }`}>
        <Icon className={`w-4 h-4 transition-colors duration-200 ${
          isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-800'
        }`} />
        
        {/* Badge with count */}
        {hasCount && count > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center shadow-md animate-fade-in">
            <span className="text-xs font-bold text-white">
              {count > 9 ? '9+' : count}
            </span>
            <div className="absolute inset-0 bg-primary-400 rounded-full animate-ping opacity-75"></div>
          </div>
        )}
      </div>
      <span className={`text-xs font-medium mt-1 transition-all duration-200 ${
        isActive ? 'text-black scale-105' : 'text-gray-500 group-hover:text-gray-700'
      }`}>
        {label}
      </span>
    </button>
  );
};

export default NavbarItem;