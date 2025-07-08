import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, AccessibilityInfo, Alert, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LocationPickerProps, LocationSuggestion, LocationPickerState, LocationCoordinate } from '../../types/location';
import { COLORS, SHADOWS, SPACING } from '../../utils/theme';
import * as Animations from '../../utils/animations';
import { GoogleMapsService } from '../../services/googleMapsService';
import { GOOGLE_MAPS_CONFIG } from '../../config/googleMaps';

import LocationHeader from './LocationHeader';
import LocationBottomSheet from './LocationBottomSheet';

const RECENT_LOCATIONS_KEY = 'recent_locations';
const MAX_RECENT_LOCATIONS = 5;

const LocationPicker: React.FC<LocationPickerProps> = ({
  currentLocation = 'Marina Bay Sands',
  onLocationSelect,
  onLocationUpdate,
  style,
  placeholder = 'Search for a location...',
  mapRegion = GOOGLE_MAPS_CONFIG.marinaBayRegion
}) => {
  const [state, setState] = useState<LocationPickerState>({
    isOpen: false,
    isMapMode: false,
    selectedLocation: null,
    searchText: '',
    suggestions: [],
    recentLocations: [],
    isLoadingCurrent: false,
    currentLocation: null
  });

  // Animation refs
  const headerAnimationValue = useRef(new Animated.Value(0)).current;

  // Search timeout ref
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent locations from storage
  const loadRecentLocations = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_LOCATIONS_KEY);
      if (stored) {
        const recentLocations = JSON.parse(stored);
        setState(prev => ({ ...prev, recentLocations }));
      } else {
        // Load popular locations as initial suggestions
        const popularLocations = GoogleMapsService.getPopularLocations();
        setState(prev => ({ ...prev, recentLocations: popularLocations.slice(0, 3) }));
      }
    } catch (error) {
      console.error('Error loading recent locations:', error);
      // Fallback to popular locations
      const popularLocations = GoogleMapsService.getPopularLocations();
      setState(prev => ({ ...prev, recentLocations: popularLocations.slice(0, 3) }));
    }
  }, []);

  // Save recent locations to storage
  const saveRecentLocations = useCallback(async (locations: LocationSuggestion[]) => {
    try {
      await AsyncStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(locations));
    } catch (error) {
      console.error('Error saving recent locations:', error);
    }
  }, []);

  // Handle opening the bottom sheet
  const handleOpenPicker = useCallback(async () => {
    // Provide haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics might not be available on all devices
    }

    setState(prev => ({ ...prev, isOpen: true }));
    
    // Load initial suggestions (popular locations)
    const popularLocations = GoogleMapsService.getPopularLocations();
    setState(prev => ({ ...prev, suggestions: popularLocations }));
    
    // Announce to screen readers
    AccessibilityInfo.announceForAccessibility('Location picker opened');
  }, []);

  // Handle closing the bottom sheet
  const handleClosePicker = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isOpen: false, 
      isMapMode: false,
      searchText: '',
      selectedLocation: null
    }));
    
    // Clear search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, []);

  // Handle search text changes with debouncing
  const handleSearchTextChange = useCallback((text: string) => {
    setState(prev => ({ ...prev, searchText: text }));
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(async () => {
      if (text.trim()) {
        try {
          const suggestions = await GoogleMapsService.getAutocompleteSuggestions(text);
          setState(prev => ({ ...prev, suggestions }));
        } catch (error) {
          console.error('Error fetching search suggestions:', error);
          // Fallback to popular locations
          const popularLocations = GoogleMapsService.getPopularLocations();
          setState(prev => ({ ...prev, suggestions: popularLocations }));
        }
      } else {
        // Show popular locations when search is empty
        const popularLocations = GoogleMapsService.getPopularLocations();
        setState(prev => ({ ...prev, suggestions: popularLocations }));
      }
    }, 300); // 300ms debounce
  }, []);

  // Handle location selection
  const handleLocationSelect = useCallback(async (location: LocationSuggestion) => {
    try {
      // Provide haptic feedback
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        // Haptics might not be available on all devices
      }

      // If location has placeId but no coordinates, fetch details
      let fullLocation = location;
      try {
        if (location.placeId && !location.coordinate) {
          const placeDetails = await GoogleMapsService.getPlaceDetails(location.placeId);
          if (placeDetails) {
            fullLocation = placeDetails;
          }
        }
      } catch (error) {
        console.error('Error fetching place details:', error);
      }

      setState(prev => ({ ...prev, selectedLocation: fullLocation }));
      
      // If it's a current location tap, close immediately
      if (location.type === 'current') {
        // Store the location to be confirmed
        const locationToConfirm = fullLocation;
        
        // Use setTimeout to defer execution and prevent immediate crash
        setTimeout(() => {
          try {
            // Call handleConfirmLocation directly without dependency
            // This avoids circular dependency issues
            if (locationToConfirm) {
              // Clone to avoid reference issues
              const locCopy = { ...locationToConfirm };
              
              // Check if the selected location has delivery available
              if (locCopy.coordinate) {
                const deliveryCheck = GoogleMapsService.isDeliveryAvailable(locCopy.coordinate);
                
                if (deliveryCheck.available) {
                  // If delivery is available, proceed with the confirmation
                  try {
                    // Safety check for onLocationSelect
                    if (typeof onLocationSelect === 'function') {
                      onLocationSelect(locCopy);
                      
                      // Close picker
                      setState(prev => ({ 
                        ...prev, 
                        isOpen: false, 
                        isMapMode: false,
                        searchText: '',
                        selectedLocation: null
                      }));
                    }
                  } catch (confirmError) {
                    console.error('Error confirming location:', confirmError);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error confirming current location:', error);
          }
        }, 100);
      }
      
      // Announce to screen readers
      try {
        AccessibilityInfo.announceForAccessibility(`Selected ${fullLocation.title}`);
      } catch (error) {
        console.error('Error with accessibility announcement:', error);
      }
    } catch (error) {
      console.error('Error in handleLocationSelect:', error);
    }
  }, [onLocationSelect]);

  // Handle current location refresh
  const handleRefreshLocation = useCallback(async () => {
    setState(prev => ({ ...prev, isLoadingCurrent: true }));
    
    // Provide haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics might not be available on all devices
    }

    try {
      const currentLoc = await GoogleMapsService.getCurrentLocation();
      
      setState(prev => ({ 
        ...prev, 
        currentLocation: currentLoc, 
        isLoadingCurrent: false 
      }));
      
      // Announce to screen readers
      AccessibilityInfo.announceForAccessibility('Current location updated');
    } catch (error) {
      console.error('Error getting current location:', error);
      setState(prev => ({ ...prev, isLoadingCurrent: false }));
      
      // Show error feedback
      Alert.alert(
        "Location Error",
        "Unable to get your current location. Please check your location permissions.",
        [{ text: "OK" }]
      );
    }
  }, []);

  // Handle deleting recent location
  const handleDeleteRecent = useCallback(async (id: string) => {
    const updatedRecentLocations = state.recentLocations.filter(loc => loc.id !== id);
    setState(prev => ({
      ...prev,
      recentLocations: updatedRecentLocations
    }));
    
    // Save to storage
    await saveRecentLocations(updatedRecentLocations);
    
    // Announce to screen readers
    AccessibilityInfo.announceForAccessibility('Recent location removed');
  }, [state.recentLocations, saveRecentLocations]);

  // Handle toggling map mode
  const handleToggleMapMode = useCallback(() => {
    setState(prev => ({ ...prev, isMapMode: !prev.isMapMode }));
  }, []);

  // Handle confirming location selection
  const handleConfirmLocation = useCallback(async (location?: LocationSuggestion) => {
    try {
      console.log('Starting handleConfirmLocation');
      const selectedLoc = location || state.selectedLocation;
      
      if (!selectedLoc) {
        console.error('No location selected');
        return;
      }

      console.log('Confirming location:', selectedLoc.title);

      try {
        // Provide haptic feedback
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
          console.error('Haptics error:', error);
        }
        
        // First close the picker to avoid UI getting stuck
        setState(prev => ({ 
          ...prev, 
          isOpen: false, 
          isMapMode: false,
          searchText: '',
        }));
        
        // Wait a bit to ensure UI updates before trying to update location
        setTimeout(() => {
          try {
            console.log('Executing location update callback');
            
            // Clone the object to prevent reference issues
            const locationToSend: LocationSuggestion = { 
              ...selectedLoc,
              title: selectedLoc.title || 'Selected Location',
              id: selectedLoc.id || `loc_${Date.now()}`,
              type: (selectedLoc.type as "suggestion" | "recent" | "current" | "postal" | "saved") || 'suggestion'
            };
            
            // Call the callback with a try-catch
            try {
              if (typeof onLocationSelect === 'function') {
                onLocationSelect(locationToSend);
                console.log('Location callback executed successfully');
              } else {
                console.error('onLocationSelect is not a function');
              }
            } catch (callbackError) {
              console.error('Error in onLocationSelect callback:', callbackError);
            }
            
            // Update recent locations
            try {
              if (locationToSend.type !== 'recent' && locationToSend.type !== 'current') {
                const newRecent: LocationSuggestion = {
                  ...locationToSend,
                  type: 'recent'
                };
                
                const safeRecentLocations = Array.isArray(state.recentLocations) 
                  ? state.recentLocations.filter(loc => loc?.id && loc.id !== locationToSend.id)
                  : [];
                
                const updatedRecentLocations = [
                  newRecent, 
                  ...safeRecentLocations
                ].slice(0, MAX_RECENT_LOCATIONS);
                
                setState(prev => ({
                  ...prev,
                  recentLocations: updatedRecentLocations
                }));
                
                // Save to storage
                try {
                  saveRecentLocations(updatedRecentLocations);
                } catch (storageError) {
                  console.error('Storage error:', storageError);
                }
              }
            } catch (recentError) {
              console.error('Error updating recent locations:', recentError);
            }
          } catch (timeoutError) {
            console.error('Error in location confirmation timeout:', timeoutError);
          }
        }, 300);
      } catch (confirmError) {
        console.error('Error in location confirmation process:', confirmError);
      }
    } catch (outerError) {
      console.error('Outer error in handleConfirmLocation:', outerError);
      
      // Make sure to close the picker even if there's an error
      setState(prev => ({ 
        ...prev, 
        isOpen: false, 
        isMapMode: false,
        searchText: '',
      }));
    }
  }, [state.selectedLocation, state.recentLocations, onLocationSelect, saveRecentLocations]);

  // Handle pin drop in map mode
  const handlePinDrop = useCallback(async (coordinate: LocationCoordinate) => {
    try {
      // Reverse geocode the coordinate to get address information
      const locationData = await GoogleMapsService.reverseGeocode(coordinate);
      
      const droppedLocation: LocationSuggestion = locationData || {
        id: 'dropped-pin',
        title: 'Dropped Pin',
        subtitle: `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
        type: 'suggestion',
        coordinate,
        address: `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`
      };
      
      setState(prev => ({ ...prev, selectedLocation: droppedLocation }));
    } catch (error) {
      console.error('Error reverse geocoding dropped pin:', error);
      
      // Fallback to coordinate-only location
      const droppedLocation: LocationSuggestion = {
        id: 'dropped-pin',
        title: 'Dropped Pin',
        subtitle: `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
        type: 'suggestion',
        coordinate,
        address: `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`
      };
      
      setState(prev => ({ ...prev, selectedLocation: droppedLocation }));
    }
  }, []);

  // Load recent locations on mount
  useEffect(() => {
    loadRecentLocations();
  }, [loadRecentLocations]);

  // Get current location on mount
  useEffect(() => {
    const loadCurrentLocationConditionally = async () => {
      try {
        // Check user preferences before auto-loading current location
        const storedPreferences = await AsyncStorage.getItem('@easiapp:location_preferences');
        let shouldAutoLoadCurrent = false;
        
        if (storedPreferences) {
          const preferences = JSON.parse(storedPreferences);
          shouldAutoLoadCurrent = preferences.autoSuggestCurrent === true; // Only if explicitly enabled
        }
        
        if (shouldAutoLoadCurrent) {
          handleRefreshLocation();
        }
      } catch (error) {
        console.error('Error checking location preferences:', error);
        // Don't load current location on error
      }
    };
    
    loadCurrentLocationConditionally();
  }, [handleRefreshLocation]);

  return (
    <View style={[styles.container, style]}>
      <LocationHeader
        currentLocation={currentLocation}
        onPress={handleOpenPicker}
        isLoading={state.isLoadingCurrent}
      />
      
      <LocationBottomSheet
        isVisible={state.isOpen}
        onClose={handleClosePicker}
        onLocationSelect={handleLocationSelect}
        searchText={state.searchText}
        onSearchTextChange={handleSearchTextChange}
        suggestions={state.suggestions}
        recentLocations={state.recentLocations}
        currentLocation={state.currentLocation}
        isLoadingCurrent={state.isLoadingCurrent}
        onRefreshLocation={handleRefreshLocation}
        isMapMode={state.isMapMode}
        onToggleMapMode={handleToggleMapMode}
        onConfirm={() => handleConfirmLocation()}
        selectedLocation={state.selectedLocation}
        onDeleteRecent={handleDeleteRecent}
        onPinDrop={handlePinDrop}
        mapRegion={mapRegion}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Container styles can be added here if needed
  }
});

export default LocationPicker;