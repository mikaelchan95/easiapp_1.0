import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';

import { LocationPickerProps, LocationSuggestion, LocationPickerState, LocationCoordinate } from '../../types/location';
import { COLORS, SHADOWS, SPACING } from '../../utils/theme';
import * as Animations from '../../utils/animations';

import LocationHeader from './LocationHeader';
import LocationBottomSheet from './LocationBottomSheet';

// Mock data for demonstration
const mockRecentLocations: LocationSuggestion[] = [
  {
    id: '1',
    title: 'Marina Bay Sands',
    subtitle: '10 Bayfront Ave, Singapore 018956',
    type: 'recent',
    coordinate: { latitude: 1.2834, longitude: 103.8607 },
    address: '10 Bayfront Ave, Singapore 018956'
  },
  {
    id: '2',
    title: 'Gardens by the Bay',
    subtitle: '18 Marina Gardens Dr, Singapore 018953',
    type: 'recent',
    coordinate: { latitude: 1.2816, longitude: 103.8636 },
    address: '18 Marina Gardens Dr, Singapore 018953'
  },
  {
    id: '3',
    title: 'Raffles Hotel Singapore',
    subtitle: '1 Beach Rd, Singapore 189673',
    type: 'recent',
    coordinate: { latitude: 1.2947, longitude: 103.8547 },
    address: '1 Beach Rd, Singapore 189673'
  }
];

const mockSuggestions: LocationSuggestion[] = [
  {
    id: 's1',
    title: 'Clarke Quay',
    subtitle: '3 River Valley Rd, Singapore 179024',
    type: 'suggestion',
    coordinate: { latitude: 1.2888, longitude: 103.8467 },
    address: '3 River Valley Rd, Singapore 179024'
  },
  {
    id: 's2',
    title: 'Orchard Road',
    subtitle: 'Orchard, Singapore',
    type: 'suggestion',
    coordinate: { latitude: 1.3048, longitude: 103.8318 },
    address: 'Orchard, Singapore'
  },
  {
    id: 's3',
    title: 'Chinatown',
    subtitle: 'Chinatown, Singapore',
    type: 'suggestion',
    coordinate: { latitude: 1.2826, longitude: 103.8441 },
    address: 'Chinatown, Singapore'
  }
];

const LocationPicker: React.FC<LocationPickerProps> = ({
  currentLocation = 'Marina Bay Sands',
  onLocationSelect,
  onLocationUpdate,
  style,
  placeholder = 'Search for a location...',
  mapRegion = {
    latitude: 1.2834,
    longitude: 103.8607,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
  }
}) => {
  const [state, setState] = useState<LocationPickerState>({
    isOpen: false,
    isMapMode: false,
    selectedLocation: null,
    searchText: '',
    suggestions: mockSuggestions,
    recentLocations: mockRecentLocations,
    isLoadingCurrent: false,
    currentLocation: null
  });

  // Animation refs
  const headerAnimationValue = useRef(new Animated.Value(0)).current;

  // Handle opening the bottom sheet
  const handleOpenPicker = useCallback(async () => {
    // Provide haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics might not be available on all devices
    }

    setState(prev => ({ ...prev, isOpen: true }));
    
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
  }, []);

  // Handle search text changes
  const handleSearchTextChange = useCallback((text: string) => {
    setState(prev => ({ ...prev, searchText: text }));
    
    // Filter suggestions based on search text
    if (text.trim()) {
      const filteredSuggestions = mockSuggestions.filter(suggestion =>
        suggestion.title.toLowerCase().includes(text.toLowerCase()) ||
        (suggestion.subtitle && suggestion.subtitle.toLowerCase().includes(text.toLowerCase()))
      );
      setState(prev => ({ ...prev, suggestions: filteredSuggestions }));
    } else {
      setState(prev => ({ ...prev, suggestions: mockSuggestions }));
    }
  }, []);

  // Handle location selection
  const handleLocationSelect = useCallback(async (location: LocationSuggestion) => {
    // Provide haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptics might not be available on all devices
    }

    setState(prev => ({ ...prev, selectedLocation: location }));
    
    // If it's a current location tap, close immediately
    if (location.type === 'current') {
      handleConfirmLocation(location);
    }
    
    // Announce to screen readers
    AccessibilityInfo.announceForAccessibility(`Selected ${location.title}`);
  }, []);

  // Handle current location refresh
  const handleRefreshLocation = useCallback(async () => {
    setState(prev => ({ ...prev, isLoadingCurrent: true }));
    
    // Provide haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics might not be available on all devices
    }

    // Simulate GPS fetch
    setTimeout(() => {
      const currentLoc: LocationSuggestion = {
        id: 'current',
        title: 'Current Location',
        subtitle: '1 Marina Boulevard, Singapore 018989',
        type: 'current',
        coordinate: { latitude: 1.2826, longitude: 103.8565 },
        address: '1 Marina Boulevard, Singapore 018989'
      };
      
      setState(prev => ({ 
        ...prev, 
        currentLocation: currentLoc, 
        isLoadingCurrent: false 
      }));
      
      // Announce to screen readers
      AccessibilityInfo.announceForAccessibility('Current location updated');
    }, 1500);
  }, []);

  // Handle deleting recent location
  const handleDeleteRecent = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      recentLocations: prev.recentLocations.filter(loc => loc.id !== id)
    }));
    
    // Announce to screen readers
    AccessibilityInfo.announceForAccessibility('Recent location removed');
  }, []);

  // Handle toggling map mode
  const handleToggleMapMode = useCallback(() => {
    setState(prev => ({ ...prev, isMapMode: !prev.isMapMode }));
  }, []);

  // Handle confirming location selection
  const handleConfirmLocation = useCallback(async (location?: LocationSuggestion) => {
    const selectedLoc = location || state.selectedLocation;
    
    if (!selectedLoc) return;

    // Provide haptic feedback
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Haptics might not be available on all devices
    }

    // Animate header update
    Animations.springAnimation(headerAnimationValue, 1, 'gentle');
    
    // Update the header location display
    setTimeout(() => {
      onLocationSelect(selectedLoc);
      
      // Add to recent locations if it's not already there
      if (selectedLoc.type !== 'recent') {
        const newRecent: LocationSuggestion = {
          ...selectedLoc,
          type: 'recent'
        };
        setState(prev => ({
          ...prev,
          recentLocations: [newRecent, ...prev.recentLocations.slice(0, 4)]
        }));
      }
      
      // Close the picker
      handleClosePicker();
      
      // Reset header animation
      headerAnimationValue.setValue(0);
    }, 150);
    
    // Announce to screen readers
    AccessibilityInfo.announceForAccessibility(`Location confirmed: ${selectedLoc.title}`);
  }, [state.selectedLocation, onLocationSelect, handleClosePicker, headerAnimationValue]);

  // Handle pin drop in map mode
  const handlePinDrop = useCallback((coordinate: LocationCoordinate) => {
    // Create a location suggestion from coordinates
    const droppedLocation: LocationSuggestion = {
      id: 'dropped-pin',
      title: 'Dropped Pin',
      subtitle: `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`,
      type: 'suggestion',
      coordinate,
      address: `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`
    };
    
    setState(prev => ({ ...prev, selectedLocation: droppedLocation }));
  }, []);

  // Effect to load current location on mount
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