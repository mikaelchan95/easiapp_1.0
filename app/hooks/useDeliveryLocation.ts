import { useContext, useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../context/AppContext';
import { LocationSuggestion, SavedAddress } from '../types/location';
import { GoogleMapsService } from '../services/googleMapsService';

const LOCATION_PREFERENCES_KEY = '@easiapp:location_preferences';

interface LocationPreferences {
  autoSuggestCurrent: boolean;
  lastLocationSource: 'current' | 'saved' | 'search';
  preventCurrentLocationAutoSelect: boolean;
}

const defaultPreferences: LocationPreferences = {
  autoSuggestCurrent: false, // Don't auto-suggest current location by default
  lastLocationSource: 'search',
  preventCurrentLocationAutoSelect: true, // Prevent reverting to current location
};

export const useDeliveryLocation = () => {
  const { state, dispatch } = useContext(AppContext);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [locationPreferences, setLocationPreferences] = useState<LocationPreferences>(defaultPreferences);

  // Get current delivery location
  const deliveryLocation = state.selectedLocation;

  // Set delivery location
  const setDeliveryLocation = useCallback(async (location: LocationSuggestion | null) => {
    dispatch({ type: 'SET_SELECTED_LOCATION', payload: location });
    
    // Update preferences based on location source
    if (location) {
      const newPreferences = {
        ...locationPreferences,
        lastLocationSource: location.type === 'current' ? 'current' as const : 
                           location.type === 'saved' ? 'saved' as const : 'search' as const,
        // If user explicitly selects a non-current location, prevent auto-reversion
        preventCurrentLocationAutoSelect: location.type !== 'current'
      };
      setLocationPreferences(newPreferences);
      await AsyncStorage.setItem(LOCATION_PREFERENCES_KEY, JSON.stringify(newPreferences));
    }
  }, [dispatch, locationPreferences]);

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

  // Load saved addresses
  const loadSavedAddresses = useCallback(async () => {
    try {
      const addresses = await GoogleMapsService.getSavedAddresses();
      setSavedAddresses(addresses);
    } catch (error) {
      console.error('Failed to load saved addresses:', error);
    }
  }, []);

  // Add location to saved addresses
  const saveCurrentLocation = useCallback(async (label: string, icon?: string, color?: string) => {
    if (!deliveryLocation) return false;
    
    try {
      const savedAddress: SavedAddress = {
        id: `saved_${Date.now()}`,
        label,
        location: deliveryLocation,
        createdAt: new Date(),
        updatedAt: new Date(),
        icon,
        color,
        isDefault: savedAddresses.length === 0, // First saved address becomes default
      };
      
      await GoogleMapsService.saveAddress(savedAddress);
      await loadSavedAddresses(); // Refresh the list
      return true;
    } catch (error) {
      console.error('Failed to save location:', error);
      return false;
    }
  }, [deliveryLocation, savedAddresses.length, loadSavedAddresses]);

  // Get default saved address
  const getDefaultSavedAddress = useCallback(() => {
    return savedAddresses.find(address => address.isDefault) || savedAddresses[0] || null;
  }, [savedAddresses]);

  // Check if current location is saved
  const isCurrentLocationSaved = useCallback(() => {
    if (!deliveryLocation) return false;
    return savedAddresses.some(address => 
      address.location.id === deliveryLocation.id ||
      (address.location.coordinate && deliveryLocation.coordinate &&
       Math.abs(address.location.coordinate.latitude - deliveryLocation.coordinate.latitude) < 0.001 &&
       Math.abs(address.location.coordinate.longitude - deliveryLocation.coordinate.longitude) < 0.001)
    );
  }, [deliveryLocation, savedAddresses]);

  // Load preferences and saved addresses on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load preferences
        const storedPreferences = await AsyncStorage.getItem(LOCATION_PREFERENCES_KEY);
        if (storedPreferences) {
          const parsedPreferences = JSON.parse(storedPreferences);
          setLocationPreferences({ ...defaultPreferences, ...parsedPreferences });
        }
        
        // Load saved addresses
        await loadSavedAddresses();
      } catch (error) {
        console.error('Failed to load location data:', error);
      }
    };
    
    loadData();
  }, [loadSavedAddresses]);

  return {
    deliveryLocation,
    setDeliveryLocation,
    hasDeliveryLocation,
    getFormattedAddress,
    getShortAddress,
    savedAddresses,
    loadSavedAddresses,
    saveCurrentLocation,
    getDefaultSavedAddress,
    isCurrentLocationSaved,
    locationPreferences,
    setLocationPreferences: async (prefs: LocationPreferences) => {
      setLocationPreferences(prefs);
      await AsyncStorage.setItem(LOCATION_PREFERENCES_KEY, JSON.stringify(prefs));
    },
  };
};