import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoogleMapsService } from '../../services/googleMapsService';
import { LocationSuggestion, SavedAddress, DeliveryDetails } from '../../types/location';
import LocationSelectionUI from './LocationSelectionUI';
import { HapticFeedback } from '../../utils/haptics';

/**
 * Main screen for location selection, integrating all location-related components
 */
export default function LocationScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // State for saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  
  // Load saved addresses when component mounts
  useEffect(() => {
    const loadSavedAddresses = async () => {
      try {
        const addresses = await GoogleMapsService.getSavedAddresses();
        setSavedAddresses(addresses);
      } catch (error) {
        console.error('Error loading saved addresses:', error);
      }
    };
    
    loadSavedAddresses();
  }, []);

  // Handle location selection
  const handleLocationSelect = (location: LocationSuggestion) => {
    // Add to recent locations
    GoogleMapsService.addToRecentLocations(location);
  };
  
  // Handle address details submission
  const handleAddressDetailsSubmit = (details: DeliveryDetails) => {
    HapticFeedback.success();
    
    // Pass details back to previous screen or perform navigation
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // Handle saving a new address
  const handleSaveAddress = async (address: SavedAddress) => {
    HapticFeedback.success();
    
    try {
      // Generate unique ID if not provided
      if (!address.id) {
        address.id = `address_${Date.now()}`;
      }
      
      // Set timestamps
      address.createdAt = new Date();
      address.updatedAt = new Date();
      
      // Save to storage
      await GoogleMapsService.saveAddress(address);
      
      // Update local state
      const updatedAddresses = await GoogleMapsService.getSavedAddresses();
      setSavedAddresses(updatedAddresses);
      
      // Navigate back or show success message
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error saving address:', error);
    }
  };

  return (
    <SafeAreaView style={[
      styles.container,
      { paddingTop: insets.top }
    ]}>
      <LocationSelectionUI
        onLocationSelect={handleLocationSelect}
        onAddressDetailsSubmit={handleAddressDetailsSubmit}
        onSaveAddress={handleSaveAddress}
        savedAddresses={savedAddresses}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'hsl(0, 0%, 98%)',
  },
});