import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DeliveryAddress } from './CheckoutScreen';
import { LocationSuggestion } from '../../types/location';
import { GoogleMapsService } from '../../services/googleMapsService';
import { HapticFeedback } from '../../utils/haptics';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';

interface AddressStepProps {
  address: DeliveryAddress;
  onContinue: (address: DeliveryAddress) => void;
}

const AddressStep: React.FC<AddressStepProps> = ({ address: initialAddress, onContinue }) => {
  const navigation = useNavigation();
  const { deliveryLocation, setDeliveryLocation } = useDeliveryLocation();
  const [address, setAddress] = useState<DeliveryAddress>(initialAddress);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveAsDefault, setSaveAsDefault] = useState(initialAddress.isDefault || false);

  // Update address when form fields change
  const handleChange = (field: keyof DeliveryAddress, value: string) => {
    setAddress(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when field is edited
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle save as default toggle
  const toggleSaveAsDefault = () => {
    const newValue = !saveAsDefault;
    setSaveAsDefault(newValue);
    setAddress(prev => ({
      ...prev,
      isDefault: newValue
    }));
  };

  // Handle location selection from picker with validation
  const handleLocationSelect = async (location: LocationSuggestion) => {
    try {
      HapticFeedback.selection();
      
      // Validate the location
      const validation = await GoogleMapsService.validateLocation(location);
      
      if (!validation.valid) {
        HapticFeedback.error();
        alert(validation.error || 'Unable to deliver to this location');
        return;
      }
      
      // Update global delivery location first
      setDeliveryLocation(location);
      
      // Update address fields from location
      const updatedAddress = {
        ...address,
        street: location.title,
        city: extractCityFromSubtitle(location.subtitle || ''),
        postalCode: extractPostalCodeFromSubtitle(location.subtitle || ''),
      };
      
      setAddress(updatedAddress);
      
      // Clear street error if it exists
      if (errors.street) {
        setErrors(prev => ({ ...prev, street: '' }));
      }
      
      HapticFeedback.success();
    } catch (error) {
      console.error('Error validating location:', error);
      HapticFeedback.error();
      alert('Unable to validate location. Please try again.');
    }
  };

  // Extract city from location subtitle
  const extractCityFromSubtitle = (subtitle: string): string => {
    // For Singapore addresses, usually ends with "Singapore" or has it in the middle
    if (subtitle.includes('Singapore')) {
      return 'Singapore';
    }
    // Try to extract city from comma-separated parts
    const parts = subtitle.split(',').map(part => part.trim());
    if (parts.length > 1) {
      return parts[parts.length - 2] || 'Singapore'; // Second to last part is usually city
    }
    return 'Singapore'; // Default for Singapore
  };

  // Extract postal code from location subtitle
  const extractPostalCodeFromSubtitle = (subtitle: string): string => {
    // Singapore postal codes are 6 digits
    const postalMatch = subtitle.match(/\b\d{6}\b/);
    return postalMatch ? postalMatch[0] : '';
  };

  // Navigate to location picker
  const openLocationPicker = () => {
    HapticFeedback.selection();
    navigation.navigate('DeliveryLocationScreen');
  };
  
  const validateAddress = () => {
    const newErrors: Record<string, string> = {};
    
    if (!address.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!address.street.trim()) {
      newErrors.street = 'Please select a delivery address';
    }
    
    if (!address.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is valid without setting errors
  const isFormValid = () => {
    return address.name.trim() && address.street.trim() && address.phone.trim();
  };
  
  const handleContinue = () => {
    if (validateAddress()) {
      HapticFeedback.success();
      onContinue(address);
    } else {
      HapticFeedback.error();
    }
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Delivery Address</Text>
      <Text style={styles.subtitle}>Where should we deliver your order?</Text>
      
      <View style={styles.form}>
        {/* Location Picker Button */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Delivery Address</Text>
          <TouchableOpacity
            style={[styles.locationButton, errors.street && styles.locationButtonError]}
            onPress={openLocationPicker}
            accessible={true}
            accessibilityLabel={deliveryLocation ? `Current address: ${deliveryLocation.title}` : "Select delivery address"}
            accessibilityRole="button"
            accessibilityHint="Opens location picker to choose delivery address"
          >
            <View style={styles.locationButtonContent}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
              <View style={styles.locationTextContainer}>
                {deliveryLocation ? (
                  <>
                    <Text style={styles.locationTitle} numberOfLines={1}>
                      {deliveryLocation.title}
                    </Text>
                    {deliveryLocation.subtitle && (
                      <Text style={styles.locationSubtitle} numberOfLines={1}>
                        {deliveryLocation.subtitle}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.locationPlaceholder}>
                    Tap to select delivery address
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>
          {errors.street ? <Text style={styles.errorText}>{errors.street}</Text> : null}
        </View>

        {/* Contact Details */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Contact Name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={address.name}
            onChangeText={(value) => handleChange('name', value)}
            placeholder="Enter recipient's name"
            placeholderTextColor={COLORS.placeholder}
            autoCapitalize="words"
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </View>
        
        <View style={styles.formRow}>
          <View style={[styles.formGroup, styles.unitInput]}>
            <Text style={styles.label}>Unit / Floor</Text>
            <TextInput
              style={styles.input}
              value={address.unit}
              onChangeText={(value) => handleChange('unit', value)}
              placeholder="#01-23"
              placeholderTextColor={COLORS.placeholder}
            />
          </View>
          
          <View style={[styles.formGroup, styles.phoneInput]}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={address.phone}
              onChangeText={(value) => handleChange('phone', value)}
              placeholder="9123 4567"
              placeholderTextColor={COLORS.placeholder}
              keyboardType="phone-pad"
            />
            {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
          </View>
        </View>
        
        {/* Save as Default Checkbox */}
        <TouchableOpacity 
          style={styles.checkboxContainer} 
          onPress={toggleSaveAsDefault}
          accessible={true}
          accessibilityLabel={saveAsDefault ? "Uncheck save as default delivery address" : "Check save as default delivery address"}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: saveAsDefault }}
        >
          <View style={styles.checkbox}>
            <View style={[styles.checkboxInner, saveAsDefault && styles.checkboxChecked]}>
              {saveAsDefault && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
          </View>
          <Text style={styles.checkboxLabel}>Save as default delivery address</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.deliveryInfo}>
        <View style={styles.infoIcon}>
          <Ionicons name="information-circle" size={24} color={COLORS.success} />
        </View>
        <Text style={styles.infoText}>
          We deliver to most areas in Singapore. Your address will be verified in the next step.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  form: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
    elevation: 6,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  locationButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.sm,
  },
  locationButtonError: {
    borderColor: COLORS.error,
  },
  locationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  locationTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  locationSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  locationPlaceholder: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.sm,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    ...TYPOGRAPHY.small,
    marginTop: SPACING.xs,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitInput: {
    flex: 1,
  },
  phoneInput: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 16,
    height: 16,
    borderRadius: 2,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  checkboxLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
  },
  deliveryInfo: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  infoIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    lineHeight: 20,
  },
});

export default AddressStep; 