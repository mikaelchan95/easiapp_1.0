import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DeliveryAddress } from '../../types/checkout';
import { LocationSuggestion } from '../../types/location';
import { GoogleMapsService } from '../../services/googleMapsService';
import { HapticFeedback } from '../../utils/haptics';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';
import { validateField, validateAddress } from '../../utils/checkoutValidation';
import { AppContext } from '../../context/AppContext';

interface AddressStepProps {
  address: DeliveryAddress;
  onContinue: (address: DeliveryAddress) => void;
}

const AddressStep: React.FC<AddressStepProps> = ({
  address: initialAddress,
  onContinue,
}) => {
  const navigation = useNavigation();
  const { state } = useContext(AppContext);
  const { deliveryLocation, setDeliveryLocation } = useDeliveryLocation();
  const [address, setAddress] = useState<DeliveryAddress>(initialAddress);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveAsDefault, setSaveAsDefault] = useState(
    initialAddress?.isDefault || false
  );
  const [hasValidated, setHasValidated] = useState(false);

  // Validate address on mount and when address changes
  useEffect(() => {
    if (hasValidated) {
      const validation = validateAddress(address);
      setErrors(validation.errors);
    }
  }, [address, hasValidated]);

  // Auto-populate from delivery location and notify parent on mount
  useEffect(() => {
    if (deliveryLocation && (!address.address || address.address === '')) {
      // Auto-populate address from delivery location and user account
      const autoFilledAddress = {
        ...address,
        id: deliveryLocation.id || `address_${Date.now()}`,
        name:
          state.user?.full_name ||
          state.user?.email ||
          deliveryLocation.title ||
          address.name,
        address:
          deliveryLocation.address ||
          deliveryLocation.subtitle ||
          deliveryLocation.title,
        postalCode:
          deliveryLocation.postalCode ||
          extractPostalCodeFromSubtitle(deliveryLocation.subtitle || ''),
        unitNumber: deliveryLocation.unitNumber || address.unitNumber,
        phone: state.user?.phone || address.phone,
      };
      setAddress(autoFilledAddress);

      // If we have name and address (minimum required fields), notify parent
      if (autoFilledAddress.name && autoFilledAddress.address) {
        onContinue(autoFilledAddress);
      }
    } else if (
      initialAddress &&
      initialAddress.name &&
      initialAddress.address
    ) {
      onContinue(initialAddress);
    }
  }, [deliveryLocation, state.user]); // Re-run when delivery location or user changes

  // Update address when form fields change with real-time validation
  const handleChange = (field: keyof DeliveryAddress, value: string) => {
    const updatedAddress = {
      ...address,
      [field]: value,
      id: address.id || `address_${Date.now()}`, // Ensure ID is set
    };
    setAddress(updatedAddress);

    // Real-time field validation
    if (hasValidated && field !== 'isDefault') {
      const fieldValidation = validateField(field as any, value);
      setErrors(prev => {
        const newErrors = { ...prev };
        if (fieldValidation.isValid) {
          delete newErrors[field];
        } else {
          newErrors[field] = fieldValidation.error || '';
        }
        return newErrors;
      });
    }

    // Always notify parent of address changes, let the parent decide validation
    onContinue(updatedAddress);
  };

  // Validate all fields when user tries to continue
  const handleContinue = () => {
    setHasValidated(true);
    const validation = validateAddress(address);
    setErrors(validation.errors);

    if (validation.canContinue) {
      HapticFeedback.success();
      onContinue(address);
    } else {
      HapticFeedback.error();
    }
  };

  // Handle save as default toggle
  const toggleSaveAsDefault = () => {
    const newValue = !saveAsDefault;
    setSaveAsDefault(newValue);
    const updatedAddress = {
      ...address,
      isDefault: newValue,
    };
    setAddress(updatedAddress);

    // Always notify parent of address changes
    onContinue(updatedAddress);
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
        address: location.title,
        postalCode: extractPostalCodeFromSubtitle(location.subtitle || ''),
      };

      setAddress(updatedAddress);

      // Clear address error if it exists
      if (errors.address) {
        setErrors(prev => ({ ...prev, address: '' }));
      }

      // Trigger validation if user has already attempted to continue
      if (hasValidated) {
        const validation = validateAddress(updatedAddress);
        setErrors(validation.errors);
      }

      // Notify parent of address change
      onContinue(updatedAddress);

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
    navigation.navigate('DeliveryLocationScreen', {
      returnToScreen: 'Checkout',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        {/* Location Picker Button */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Delivery Address</Text>
          <TouchableOpacity
            style={[
              styles.locationButton,
              errors.address && styles.locationButtonError,
            ]}
            onPress={openLocationPicker}
            accessible={true}
            accessibilityLabel={
              deliveryLocation
                ? `Current address: ${deliveryLocation.title}`
                : 'Select delivery address'
            }
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
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textSecondary}
              />
            </View>
          </TouchableOpacity>
          {errors.address ? (
            <Text style={styles.errorText}>{errors.address}</Text>
          ) : null}
        </View>

        {/* Contact Details */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Contact Name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={address.name}
            onChangeText={value => handleChange('name', value)}
            placeholder="Enter recipient's name"
            placeholderTextColor={COLORS.placeholder}
            autoCapitalize="words"
          />
          {errors.name ? (
            <Text style={styles.errorText}>{errors.name}</Text>
          ) : null}
        </View>

        <View style={styles.formRow}>
          <View style={[styles.formGroup, styles.unitInput]}>
            <Text style={styles.label}>Unit / Floor</Text>
            <TextInput
              style={styles.input}
              value={address.unitNumber || ''}
              onChangeText={value => handleChange('unitNumber', value)}
              placeholder="#01-23"
              placeholderTextColor={COLORS.placeholder}
            />
          </View>

          <View style={[styles.formGroup, styles.phoneInput]}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={address.phone}
              onChangeText={value => handleChange('phone', value)}
              placeholder="9123 4567"
              placeholderTextColor={COLORS.placeholder}
              keyboardType="phone-pad"
            />
            {errors.phone ? (
              <Text style={styles.errorText}>{errors.phone}</Text>
            ) : null}
          </View>
        </View>

        {/* Save as Default Checkbox */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={toggleSaveAsDefault}
          accessible={true}
          accessibilityLabel={
            saveAsDefault
              ? 'Uncheck save as default delivery address'
              : 'Check save as default delivery address'
          }
          accessibilityRole="checkbox"
          accessibilityState={{ checked: saveAsDefault }}
        >
          <View style={styles.checkbox}>
            <View
              style={[
                styles.checkboxInner,
                saveAsDefault && styles.checkboxChecked,
              ]}
            >
              {saveAsDefault && (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              )}
            </View>
          </View>
          <Text style={styles.checkboxLabel}>
            Save as default delivery address
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.deliveryInfo}>
        <View style={styles.infoIcon}>
          <Ionicons
            name="information-circle"
            size={24}
            color={COLORS.success}
          />
        </View>
        <Text style={styles.infoText}>
          We deliver to most areas in Singapore. Your address will be verified
          in the next step.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
  },
  form: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.medium,
    elevation: 6,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  locationButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOWS.light,
    elevation: 3,
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
    borderRadius: 12,
    padding: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontSize: 16,
    ...SHADOWS.light,
    elevation: 2,
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
    alignItems: 'flex-start',
    gap: SPACING.md,
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
    marginTop: SPACING.md,
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    ...SHADOWS.light,
    elevation: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    marginRight: SPACING.md,
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
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    marginTop: SPACING.sm,
    ...SHADOWS.light,
    elevation: 3,
  },
  infoIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: '#2E7D32',
    lineHeight: 22,
    fontWeight: '500',
  },
});

export default AddressStep;
