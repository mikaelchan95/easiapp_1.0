import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import DeliveryLocationPicker from './DeliveryLocationPicker';
import { LocationSuggestion } from '../../types/location';
import { COLORS } from '../../utils/theme';

interface DeliveryLocationScreenProps {
  onLocationSelect?: (location: LocationSuggestion) => void;
}

interface RouteParams {
  onLocationSelect?: (location: LocationSuggestion) => void;
  initialLocation?: LocationSuggestion;
}

const DeliveryLocationScreen: React.FC<DeliveryLocationScreenProps> = ({
  onLocationSelect
}) => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams || {};

  const handleLocationSelect = useCallback((location: LocationSuggestion) => {
    console.log('Location selected:', location);
    
    // Use callback from route params or props
    const callback = params.onLocationSelect || onLocationSelect;
    if (callback) {
      callback(location);
    }
    
    // Navigate back
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation, onLocationSelect, params.onLocationSelect]);

  return (
    <View style={styles.container}>
      <DeliveryLocationPicker 
        onLocationSelect={handleLocationSelect}
        initialLocation={params.initialLocation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

export default DeliveryLocationScreen;