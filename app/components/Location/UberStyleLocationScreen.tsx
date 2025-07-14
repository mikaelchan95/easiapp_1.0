import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import UberStyleLocationPicker from './UberStyleLocationPicker';
import { LocationSuggestion } from '../../types/location';
import { COLORS } from '../../utils/theme';

interface UberStyleLocationScreenProps {
  onLocationSelect?: (location: LocationSuggestion) => void;
}

const UberStyleLocationScreen: React.FC<UberStyleLocationScreenProps> = ({
  onLocationSelect,
}) => {
  const navigation = useNavigation();

  const handleLocationSelect = useCallback(
    (location: LocationSuggestion) => {
      console.log('Location selected:', location);

      // If callback provided, call it
      if (onLocationSelect) {
        onLocationSelect(location);
      }

      // Navigate back
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    [navigation, onLocationSelect]
  );

  return (
    <View style={styles.container}>
      <UberStyleLocationPicker onLocationSelect={handleLocationSelect} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});

export default UberStyleLocationScreen;
