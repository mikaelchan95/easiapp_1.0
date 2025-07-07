import React from 'react';
import { Search, ShoppingCart, Home, Gift, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useNavigation, NavigationRoute } from '../../context/NavigationContext';
import NavbarItem from './NavbarItem';

interface BottomNavbarProps {
  onNavigate: (route: NavigationRoute) => void;
}

const BottomNavbar: React.FC<BottomNavbarProps> = ({ onNavigate }) => {
  const { getCartItemCount } = useApp();
  const { activeRoute } = useNavigation();
  
  // Define navigation items
  const navItems = [
    { 
      icon: Search, 
      label: 'Explore', 
      route: 'explore' as NavigationRoute,
      hasCount: false 
    },
    { 
      icon: ShoppingCart, 
      label: 'Cart', 
      route: 'cart' as NavigationRoute,
      hasCount: true, 
      count: getCartItemCount() 
    },
    { 
      icon: Home, 
      label: 'Home', 
      route: 'home' as NavigationRoute,
      hasCount: false 
    },
    { 
      icon: Gift, 
      label: 'Rewards', 
      route: 'rewards' as NavigationRoute,
      hasCount: false 
    },
    { 
      icon: User, 
      label: 'Profile', 
      route: 'profile' as NavigationRoute,
      hasCount: false 
    },
  ];

  return (
    <div className="bg-white/95 backdrop-blur-lg border-t border-gray-100 px-5 py-2 shadow-2xl">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {navItems.map((item) => (
          <NavbarItem
            key={item.route}
            icon={item.icon}
            label={item.label}
            route={item.route}
            isActive={activeRoute === item.route}
            hasCount={item.hasCount}
            count={item.count}
            onClick={() => onNavigate(item.route)}
          />
        ))}
      </div>
      <div className="h-[env(safe-area-inset-bottom,0px)] w-full"></div>
    </div>
  );
};

export default BottomNavbar;