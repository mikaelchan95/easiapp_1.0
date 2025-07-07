import React, { useState, useCallback, useContext } from 'react';
import { 
  Modal, 
  View, 
  StyleSheet, 
  SafeAreaView,
  StatusBar,
  Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppContext } from '../../context/AppContext';
import { LocationSuggestion } from '../../types/location';
import { COLORS } from '../../utils/theme';
import LocationPicker from './LocationPicker';

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ 
  visible, 
  onClose 
}) => {
  const { state, dispatch } = useContext(AppContext);
  const navigation = useNavigation();
  
  const handleLocationSelect = useCallback((location: LocationSuggestion) => {
    // Update global state
    dispatch({ type: 'SET_SELECTED_LOCATION', payload: location });
    
    // Close the modal
    onClose();
  }, [dispatch, onClose]);

  const handleLocationUpdate = useCallback((location: LocationSuggestion) => {
    console.log('Location updated:', location);
  }, []);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor={COLORS.background}
        />
        
        <View style={styles.content}>
          <LocationPicker
            currentLocation={state.selectedLocation?.title || 'Select Location'}
            onLocationSelect={handleLocationSelect}
            onLocationUpdate={handleLocationUpdate}
            placeholder="Search for delivery location..."
            mapRegion={
              state.selectedLocation?.coordinate ? {
                latitude: state.selectedLocation.coordinate.latitude,
                longitude: state.selectedLocation.coordinate.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05
              } : {
                latitude: 1.2834,
                longitude: 103.8607,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05
              }
            }
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
  },
});

export default LocationPickerModal;