import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useNavigation } from '../../context/NavigationContext';

interface PopupContextType {
  isPopupOpen: boolean;
  openPopup: () => void;
  closePopup: () => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const usePopup = () => {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider');
  }
  return context;
};

interface PopupProviderProps {
  children: ReactNode;
}

export const PopupProvider: React.FC<PopupProviderProps> = ({ children }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { hideNavigation, showNavigation } = useNavigation();

  const openPopup = () => {
    setIsPopupOpen(true);
    hideNavigation();
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    showNavigation();
  };

  // Ensure navigation is shown again if component unmounts while popup is open
  useEffect(() => {
    return () => {
      if (isPopupOpen) {
        showNavigation();
      }
    };
  }, [isPopupOpen, showNavigation]);

  return (
    <PopupContext.Provider value={{ isPopupOpen, openPopup, closePopup }}>
      {children}
    </PopupContext.Provider>
  );
};