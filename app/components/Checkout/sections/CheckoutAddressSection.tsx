/**
 * CheckoutAddressSection - Inline address form for unified checkout
 */
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DeliveryAddress } from '../../../types/checkout';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../../utils/theme';
import { HapticFeedback } from '../../../utils/haptics';
import { useDeliveryLocation } from '../../../hooks/useDeliveryLocation';
import { AppContext } from '../../../context/AppContext';

interface Props {
  address: DeliveryAddress | null;
  onUpdate: (address: DeliveryAddress) => void;
  onComplete: () => void;
}

export default function CheckoutAddressSection({
  address,
  onUpdate,
  onComplete,
}: Props) {
  const navigation = useNavigation();
  const { state } = useContext(AppContext);
  const { deliveryLocation, setDeliveryLocation } = useDeliveryLocation();

  const [formData, setFormData] = useState<DeliveryAddress>({
    id: address?.id || `addr_${Date.now()}`,
    name: address?.name || state.user?.full_name || state.user?.name || '',
    address: address?.address || '',
    unitNumber: address?.unitNumber || '',
    postalCode: address?.postalCode || '',
    phone: address?.phone || state.user?.phone || '',
    isDefault: address?.isDefault || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync with delivery location
  useEffect(() => {
    if (deliveryLocation && !formData.address) {
      const postalMatch = deliveryLocation.subtitle?.match(/\b\d{6}\b/);
      setFormData(prev => ({
        ...prev,
        address: deliveryLocation.title || deliveryLocation.address || '',
        postalCode: postalMatch ? postalMatch[0] : prev.postalCode,
      }));
    }
  }, [deliveryLocation]);

  // Update parent on form changes
  useEffect(() => {
    if (formData.name && formData.address && formData.phone) {
      onUpdate(formData);
    }
  }, [formData]);

  const handleChange = (field: keyof DeliveryAddress, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error on edit
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Contact name is required';
    }
    if (!formData.address?.trim()) {
      newErrors.address = 'Delivery address is required';
    }
    if (!formData.phone?.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{8,}$/.test(formData.phone)) {
      newErrors.phone = 'Enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validate()) {
      HapticFeedback.success();
      onUpdate(formData);
      onComplete();
    } else {
      HapticFeedback.error();
    }
  };

  const openLocationPicker = () => {
    HapticFeedback.selection();
    navigation.navigate('DeliveryLocationScreen', {
      returnToScreen: 'UnifiedCheckout',
    });
  };

  const isValid = !!(formData.name && formData.address && formData.phone);

  return (
    <View style={styles.container}>
      {/* Location Picker */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Delivery Address</Text>
        <TouchableOpacity
          style={[styles.locationButton, errors.address && styles.inputError]}
          onPress={openLocationPicker}
          activeOpacity={0.7}
        >
          <Ionicons name="location" size={20} color={COLORS.primary} />
          <View style={styles.locationTextContainer}>
            {formData.address ? (
              <>
                <Text style={styles.locationTitle} numberOfLines={1}>
                  {formData.address}
                </Text>
                {formData.postalCode && (
                  <Text style={styles.locationSubtitle}>
                    Singapore {formData.postalCode}
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
        </TouchableOpacity>
        {errors.address && (
          <Text style={styles.errorText}>{errors.address}</Text>
        )}
      </View>

      {/* Contact Name */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Contact Name</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={formData.name}
          onChangeText={v => handleChange('name', v)}
          placeholder="Enter recipient's name"
          placeholderTextColor={COLORS.textSecondary}
          autoCapitalize="words"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      {/* Unit Number & Phone */}
      <View style={styles.row}>
        <View style={[styles.fieldGroup, styles.halfField]}>
          <Text style={styles.label}>Unit / Floor</Text>
          <TextInput
            style={styles.input}
            value={formData.unitNumber}
            onChangeText={v => handleChange('unitNumber', v)}
            placeholder="#01-23"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        <View style={[styles.fieldGroup, styles.halfField]}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            value={formData.phone}
            onChangeText={v => handleChange('phone', v)}
            placeholder="9123 4567"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
        </View>
      </View>

      {/* Save as Default */}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() =>
          handleChange('isDefault', formData.isDefault ? '' : 'true')
        }
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            formData.isDefault && styles.checkboxChecked,
          ]}
        >
          {formData.isDefault && (
            <Ionicons name="checkmark" size={14} color={COLORS.card} />
          )}
        </View>
        <Text style={styles.checkboxLabel}>
          Save as default delivery address
        </Text>
      </TouchableOpacity>

      {/* Continue Button */}
      <TouchableOpacity
        style={[
          styles.continueButton,
          !isValid && styles.continueButtonDisabled,
        ]}
        onPress={handleContinue}
        disabled={!isValid}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>
          Continue to Delivery Schedule
        </Text>
        <Ionicons name="arrow-forward" size={18} color={COLORS.card} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  fieldGroup: {
    gap: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  halfField: {
    flex: 1,
  },
  label: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    ...TYPOGRAPHY.small,
    color: '#F44336',
    marginTop: 4,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: SPACING.md,
  },
  locationTextContainer: {
    flex: 1,
    marginHorizontal: SPACING.sm,
  },
  locationTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  locationSubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  locationPlaceholder: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  checkboxChecked: {
    backgroundColor: COLORS.text,
    borderColor: COLORS.text,
  },
  checkboxLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.text,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  continueButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  continueButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.card,
  },
});
