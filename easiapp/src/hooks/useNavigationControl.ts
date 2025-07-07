import { useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';

interface NavigationControlOptions {
  hide?: boolean;
  showOnUnmount?: boolean;
}

/**
 * Hook to control navigation visibility in components
 */
export const useNavigationControl = (
  options: NavigationControlOptions = { hide: true, showOnUnmount: true }
) => {
  const { hide = true, showOnUnmount = true } = options;
  const { hideNavigation, showNavigation } = useNavigation();

  useEffect(() => {
    // Hide navigation when component mounts
    if (hide) {
      hideNavigation();
    }
    
    // Show navigation when component unmounts
    return () => {
      if (showOnUnmount) {
        showNavigation();
      }
    };
  }, [hide, showOnUnmount, hideNavigation, showNavigation]);

  return {
    hideNavigation,
    showNavigation
  };
};

export default useNavigationControl;