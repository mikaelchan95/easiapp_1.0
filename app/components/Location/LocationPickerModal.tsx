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
import LocationPickerScreen from './LocationPickerScreen';

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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LocationPickerScreen onLocationSelect={handleLocationSelect} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  }
});

export default LocationPickerModal;