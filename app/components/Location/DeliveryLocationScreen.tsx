import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import DeliveryLocationPicker from './DeliveryLocationPicker';
import { LocationSuggestion } from '../../types/location';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';

const DeliveryLocationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { setDeliveryLocation } = useDeliveryLocation();

  const handleLocationSelect = async (location: LocationSuggestion) => {
    try {
      // Set the selected location globally
      await setDeliveryLocation(location);

      // Check if we should return to a specific screen
      const params = route.params as any;
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

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <DeliveryLocationPicker
        onLocationSelect={handleLocationSelect}
        initialLocation={null}
        placeholder="Enter delivery address"
      />
    </SafeAreaView>
  );
};

export default DeliveryLocationScreen;
