import React from 'react';
import { useNavigation, NavigationRoute } from '../../context/NavigationContext';
import BottomNavbar from './BottomNavbar';

interface NavbarContainerProps {
  onNavigate: (route: NavigationRoute) => void;
}

const NavbarContainer: React.FC<NavbarContainerProps> = ({ onNavigate }) => {
  const { isNavVisible } = useNavigation();
  
  if (!isNavVisible) {
    return null;
  }

  return (
    <div className="nav-container">
      <BottomNavbar onNavigate={onNavigate} />
    </div>
  );
};

export default NavbarContainer;