import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import RedesignedLocationPicker from './RedesignedLocationPicker';
import { LocationSuggestion } from '../../types/location';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';

const DeliveryLocationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { setDeliveryLocation } = useDeliveryLocation();
  const params = route.params as any;

  const handleLocationSelect = async (location: LocationSuggestion) => {
    try {
      // Set the selected location globally
      await setDeliveryLocation(location);

      // Check if we should return to a specific screen
      if (params?.returnToScreen) {
        navigation.navigate(params.returnToScreen);
      } else {
        // Navigate back to the previous screen
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Error setting delivery location:', error);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <RedesignedLocationPicker
        onLocationSelect={handleLocationSelect}
        onBack={handleBack}
        initialLocation={params?.initialLocation || null}
        placeholder="Search for your address"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default DeliveryLocationScreen;
