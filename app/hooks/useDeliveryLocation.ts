import { useContext, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { LocationSuggestion } from '../types/location';

export const useDeliveryLocation = () => {
  const { state, dispatch } = useContext(AppContext);

  // Get current delivery location
  const deliveryLocation = state.selectedLocation;

  // Set delivery location
  const setDeliveryLocation = useCallback((location: LocationSuggestion | null) => {
    dispatch({ type: 'SET_SELECTED_LOCATION', payload: location });
  }, [dispatch]);

  // Check if location is set
  const hasDeliveryLocation = deliveryLocation !== null;

  // Get formatted address string
  const getFormattedAddress = useCallback(() => {
    if (!deliveryLocation) return '';
    
    if (deliveryLocation.subtitle) {
      return deliveryLocation.subtitle;
    }
    
    return deliveryLocation.title;
  }, [deliveryLocation]);

  // Get short address for display
  const getShortAddress = useCallback(() => {
    if (!deliveryLocation) return 'Set delivery address';
    
    return deliveryLocation.title;
  }, [deliveryLocation]);

  return {
    deliveryLocation,
    setDeliveryLocation,
    hasDeliveryLocation,
    getFormattedAddress,
    getShortAddress,
  };
};