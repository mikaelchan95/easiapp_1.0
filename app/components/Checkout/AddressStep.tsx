import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DeliveryAddress } from './CheckoutScreen';
import { LocationSuggestion } from '../../types/location';
import { GoogleMapsService } from '../../services/googleMapsService';
import { HapticFeedback } from '../../utils/haptics';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';

interface AddressStepProps {
  address: DeliveryAddress;
  onContinue: (address: DeliveryAddress) => void;
}

const AddressStep: React.FC<AddressStepProps> = ({ 
  address: initialAddress,
  onContinue
}) => {
  const navigation = useNavigation();
  
  // Use useEffect to set the initial address to avoid direct state initialization
  // that might cause infinite renders
  const [address, setAddress] = useState<DeliveryAddress>({
    name: '',
    street: '',
    unit: '',
    city: '',
    postalCode: '',
    phone: '',
    isDefault: false
  });
  
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initialize address with initialAddress only once when the component mounts
  // or when initialAddress changes
  useEffect(() => {
    setAddress(initialAddress);
    
    // If we have an address, create a location suggestion for display
    if (initialAddress.street) {
      setSelectedLocation({
        id: 'current_address',
        title: initialAddress.street,
        subtitle: `${initialAddress.city}, ${initialAddress.postalCode}`,
        type: 'suggestion',
        address: `${initialAddress.street}, ${initialAddress.city}, ${initialAddress.postalCode}`,
      });
    }
  }, [JSON.stringify(initialAddress)]);
  
  const updateField = (field: keyof DeliveryAddress, value: string) => {
    setAddress(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
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
      
      setSelectedLocation(location);
      
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
    // @ts-ignore - Navigation params will be handled by the screen
    navigation.navigate('DeliveryLocationScreen', {
      onLocationSelect: handleLocationSelect,
      initialLocation: selectedLocation,
    });
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
            accessibilityLabel={selectedLocation ? `Current address: ${selectedLocation.title}` : "Select delivery address"}
            accessibilityRole="button"
            accessibilityHint="Opens location picker to choose delivery address"
          >
            <View style={styles.locationButtonContent}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
              <View style={styles.locationTextContainer}>
                {selectedLocation ? (
                  <>
                    <Text style={styles.locationTitle} numberOfLines={1}>
                      {selectedLocation.title}
                    </Text>
                    {selectedLocation.subtitle && (
                      <Text style={styles.locationSubtitle} numberOfLines={1}>
                        {selectedLocation.subtitle}
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
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Enter your full name"
            placeholderTextColor={COLORS.textSecondary}
            value={address.name}
            onChangeText={(value) => updateField('name', value)}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Unit/Apt/Suite (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="E.g., Apt #1234, Unit 567"
            placeholderTextColor={COLORS.textSecondary}
            value={address.unit}
            onChangeText={(value) => updateField('unit', value)}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            placeholder="Enter phone number"
            placeholderTextColor={COLORS.textSecondary}
            value={address.phone}
            onChangeText={(value) => updateField('phone', value)}
            keyboardType="phone-pad"
          />
          {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
        </View>
        
        <View style={styles.checkboxRow}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => updateField('isDefault', address.isDefault ? 'false' : 'true')}
          >
            <View style={[styles.checkboxInner, address.isDefault && styles.checkboxChecked]}>
              {address.isDefault && <Ionicons name="checkmark" size={16} color={COLORS.card} />}
            </View>
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>Save as my default address</Text>
        </View>
      </View>
      
      <View style={styles.deliveryInfo}>
        <View style={styles.infoIcon}>
          <Ionicons name="information-circle" size={24} color={COLORS.success} />
        </View>
        <Text style={styles.infoText}>
          We deliver to most areas in Singapore. Your address will be verified in the next step.
        </Text>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        style={[styles.continueButton, !isFormValid() && styles.continueButtonDisabled]}
        onPress={handleContinue}
        disabled={!isFormValid()}
      >
        <Text style={[styles.continueButtonText, !isFormValid() && styles.continueButtonTextDisabled]}>
          Continue to Delivery Time
        </Text>
        <Ionicons 
          name="arrow-forward" 
          size={20} 
          color={!isFormValid() ? COLORS.textSecondary : COLORS.card} 
        />
      </TouchableOpacity>
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
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
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
  checkboxRow: {
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
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.medium,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  continueButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.card,
    marginRight: SPACING.xs,
  },
  continueButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
});

export default AddressStep; 