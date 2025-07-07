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
      if (location.placeId && !location.coordinate) {
        try {
          const placeDetails = await GoogleMapsService.getPlaceDetails(location.placeId);
          if (placeDetails) {
            fullLocation = placeDetails;
          }
        } catch (error) {
          console.error('Error fetching place details:', error);
          // Continue with original location if details fetch fails
        }
      }

      setState(prev => ({ ...prev, selectedLocation: fullLocation }));
      
      // If it's a current location tap, close immediately
      if (location.type === 'current') {
        // For current location, we'll handle confirmation in the parent component
        onLocationSelect(fullLocation);
      }
      
      // Announce to screen readers
      AccessibilityInfo.announceForAccessibility(`Selected ${fullLocation.title}`);
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
    const selectedLoc = location || state.selectedLocation;
    
    if (!selectedLoc) return;

    // Check if the selected location has delivery available
    if (selectedLoc.coordinate) {
      const deliveryCheck = GoogleMapsService.isDeliveryAvailable(selectedLoc.coordinate);
      
      if (!deliveryCheck.available) {
        // Provide error haptic feedback
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (error) {
          // Haptics might not be available on all devices
        }
        
        // Show alert for unavailable delivery
        Alert.alert(
          "Delivery Unavailable",
          `Sorry, delivery to ${selectedLoc.title} is not available at this time. We currently deliver within Singapore city areas.`,
          [{ text: "OK" }]
        );
        
        // Announce to screen readers
        AccessibilityInfo.announceForAccessibility(`Delivery to ${selectedLoc.title} is not available`);
        
        return;
      }
    }

    // Provide haptic feedback
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Haptics might not be available on all devices
    }

    // Animate header update
    Animations.springAnimation(headerAnimationValue, 1, 'gentle');
    
    // Update the header location display
    setTimeout(async () => {
      onLocationSelect(selectedLoc);
      
      // Add to recent locations if it's not already there and not current location
      if (selectedLoc.type !== 'recent' && selectedLoc.type !== 'current') {
        const newRecent: LocationSuggestion = {
          ...selectedLoc,
          type: 'recent'
        };
        
        const updatedRecentLocations = [
          newRecent, 
          ...state.recentLocations.filter(loc => loc.id !== selectedLoc.id)
        ].slice(0, MAX_RECENT_LOCATIONS);
        
        setState(prev => ({
          ...prev,
          recentLocations: updatedRecentLocations
        }));
        
        // Save to storage
        await saveRecentLocations(updatedRecentLocations);
      }
      
      // Close the picker
      handleClosePicker();
      
      // Reset header animation
      headerAnimationValue.setValue(0);
    }, 150);
    
    // Announce to screen readers
    AccessibilityInfo.announceForAccessibility(`Location confirmed: ${selectedLoc.title}`);
  }, [state.selectedLocation, state.recentLocations, onLocationSelect, handleClosePicker, headerAnimationValue, saveRecentLocations]);

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
    handleRefreshLocation();
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