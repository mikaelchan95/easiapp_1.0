import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type NavigationRoute = 'home' | 'explore' | 'cart' | 'rewards' | 'profile';

interface NavigationContextType {
  activeRoute: NavigationRoute;
  cartCount: number;
  isNavVisible: boolean;
  setActiveRoute: (route: NavigationRoute) => void;
  setCartCount: (count: number) => void;
  hideNavigation: () => void;
  showNavigation: () => void;
  toggleNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
  initialRoute?: NavigationRoute;
  initialCartCount?: number;
}

// These are routes where we don't want to show the navigation bar
const HIDDEN_NAV_ROUTES = [
  '/checkout', 
  '/auth',
  '/success',
];

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  initialRoute = 'home',
  initialCartCount = 0
}) => {
  const [activeRoute, setActiveRoute] = useState<NavigationRoute>(initialRoute);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [isNavVisible, setIsNavVisible] = useState(true);

  // Check path on mount and route changes to auto-hide navigation on certain routes
  useEffect(() => {
    const checkPath = () => {
      const path = window.location.pathname;
      const shouldHideNav = HIDDEN_NAV_ROUTES.some(route => path.includes(route));
      setIsNavVisible(!shouldHideNav);
    };

    checkPath();
    window.addEventListener('popstate', checkPath);
    return () => window.removeEventListener('popstate', checkPath);
  }, []);

  const hideNavigation = () => setIsNavVisible(false);
  const showNavigation = () => setIsNavVisible(true);
  const toggleNavigation = () => setIsNavVisible(prev => !prev);

  return (
    <NavigationContext.Provider value={{
      activeRoute,
      cartCount,
      isNavVisible,
      setActiveRoute,
      setCartCount,
      hideNavigation,
      showNavigation,
      toggleNavigation
    }}>
      {children}
    </NavigationContext.Provider>
  );
};