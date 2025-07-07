import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AddressDetailsFormProps, DeliveryDetails } from '../../types/location';
import { HapticFeedback } from '../../utils/haptics';

/**
 * Form for capturing detailed delivery information
 */
export default function AddressDetailsForm({
  location,
  initialValues = {},
  onSubmit,
  onSave,
  onCancel,
  isSaveMode = false
}: AddressDetailsFormProps) {
  // Initialize with provided values or defaults
  const [unitNumber, setUnitNumber] = useState(initialValues.unitNumber || '');
  const [buildingName, setBuildingName] = useState(initialValues.buildingName || '');
  const [deliveryInstructions, setDeliveryInstructions] = useState(
    initialValues.deliveryInstructions || ''
  );
  const [contactNumber, setContactNumber] = useState(initialValues.contactNumber || '');
  const [preferredTimeFrom, setPreferredTimeFrom] = useState(
    initialValues.preferredTime?.from || ''
  );
  const [preferredTimeTo, setPreferredTimeTo] = useState(
    initialValues.preferredTime?.to || ''
  );
  const [isDefault, setIsDefault] = useState(initialValues.isDefault || false);
  
  // For save mode
  const [saveLabel, setSaveLabel] = useState('');
  
  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Unit number is required
    if (!unitNumber) {
      newErrors.unitNumber = 'Unit/floor number is required';
    }
    
    // If saving, label is required
    if (isSaveMode && !saveLabel) {
      newErrors.saveLabel = 'Please provide a name for this address';
    }
    
    // Contact number format validation (Singapore)
    if (contactNumber && !/^[89]\d{7}$/.test(contactNumber.replace(/\D/g, ''))) {
      newErrors.contactNumber = 'Please enter a valid 8-digit Singapore phone number';
    }
    
    // Preferred time validation
    if ((preferredTimeFrom && !preferredTimeTo) || (!preferredTimeFrom && preferredTimeTo)) {
      newErrors.preferredTime = 'Please provide both start and end times';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = () => {
    if (!validateForm()) {
      HapticFeedback.error();
      return;
    }
    
    HapticFeedback.success();
    
    const details: DeliveryDetails = {
      location,
      unitNumber,
      buildingName: buildingName || undefined,
      deliveryInstructions: deliveryInstructions || undefined,
      contactNumber: contactNumber || undefined,
      isDefault,
      preferredTime: preferredTimeFrom && preferredTimeTo 
        ? { from: preferredTimeFrom, to: preferredTimeTo }
        : undefined
    };
    
    if (isSaveMode && onSave) {
      onSave({
        ...details,
        label: saveLabel
      });
    } else {
      onSubmit(details);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isSaveMode ? 'Save Location' : 'Delivery Details'}
          </Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onCancel}
          >
            <MaterialIcons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.locationCard}>
          <MaterialIcons name="location-on" size={24} color="#000" style={styles.locationIcon} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle} numberOfLines={1}>
              {location.title}
            </Text>
            <Text style={styles.locationSubtitle} numberOfLines={2}>
              {location.formattedAddress || location.subtitle || location.address}
            </Text>
          </View>
        </View>
        
        {isSaveMode && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Save as</Text>
            <TextInput
              style={[
                styles.input,
                errors.saveLabel ? styles.inputError : {}
              ]}
              placeholder="e.g. Home, Office, Partner's Place"
              value={saveLabel}
              onChangeText={setSaveLabel}
              maxLength={20}
            />
            {errors.saveLabel && (
              <Text style={styles.errorText}>{errors.saveLabel}</Text>
            )}
          </View>
        )}
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Unit / Floor Number*</Text>
          <TextInput
            style={[
              styles.input,
              errors.unitNumber ? styles.inputError : {}
            ]}
            placeholder="#01-01, Block A, Level 2"
            value={unitNumber}
            onChangeText={setUnitNumber}
          />
          {errors.unitNumber && (
            <Text style={styles.errorText}>{errors.unitNumber}</Text>
          )}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Building / Block Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional: e.g. The Sail @ Marina Bay"
            value={buildingName}
            onChangeText={setBuildingName}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Delivery Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Optional: notes for the delivery driver"
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Contact Number</Text>
          <TextInput
            style={[
              styles.input,
              errors.contactNumber ? styles.inputError : {}
            ]}
            placeholder="Optional: alternative contact number"
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
          />
          {errors.contactNumber && (
            <Text style={styles.errorText}>{errors.contactNumber}</Text>
          )}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Preferred Delivery Time</Text>
          <View style={styles.timeRangeContainer}>
            <TextInput
              style={[
                styles.timeInput,
                errors.preferredTime ? styles.inputError : {}
              ]}
              placeholder="From"
              value={preferredTimeFrom}
              onChangeText={setPreferredTimeFrom}
            />
            <Text style={styles.timeRangeSeparator}>to</Text>
            <TextInput
              style={[
                styles.timeInput,
                errors.preferredTime ? styles.inputError : {}
              ]}
              placeholder="To"
              value={preferredTimeTo}
              onChangeText={setPreferredTimeTo}
            />
          </View>
          {errors.preferredTime && (
            <Text style={styles.errorText}>{errors.preferredTime}</Text>
          )}
          <Text style={styles.helperText}>
            Optional: e.g. "9am" to "5pm" or "After 6pm"
          </Text>
        </View>
        
        {isSaveMode && (
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Set as default address</Text>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: '#d1d1d1', true: '#000' }}
              thumbColor={isDefault ? '#fff' : '#f4f3f4'}
            />
          </View>
        )}
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>
            {isSaveMode ? 'Save Location' : 'Confirm Details'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'hsl(0, 0%, 98%)',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(0, 0%, 90%)',
    backgroundColor: 'hsl(0, 0%, 100%)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'hsl(0, 0%, 0%)',
  },
  closeButton: {
    padding: 4,
  },
  locationCard: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'hsl(0, 0%, 100%)',
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(0, 0%, 90%)',
  },
  locationIcon: {
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: 'hsl(0, 0%, 0%)',
  },
  locationSubtitle: {
    fontSize: 14,
    color: 'hsl(0, 0%, 30%)',
  },
  formGroup: {
    padding: 16,
    backgroundColor: 'hsl(0, 0%, 100%)',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: 'hsl(0, 0%, 0%)',
  },
  input: {
    borderWidth: 1,
    borderColor: 'hsl(0, 0%, 90%)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'hsl(0, 0%, 98%)',
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'hsl(0, 0%, 90%)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'hsl(0, 0%, 98%)',
  },
  timeRangeSeparator: {
    marginHorizontal: 12,
    fontSize: 16,
    color: 'hsl(0, 0%, 30%)',
  },
  helperText: {
    fontSize: 12,
    color: 'hsl(0, 0%, 45%)',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'hsl(0, 0%, 100%)',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'hsl(0, 0%, 0%)',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'hsl(0, 0%, 90%)',
    backgroundColor: 'hsl(0, 0%, 100%)',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'hsl(0, 0%, 0%)',
    borderRadius: 8,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'hsl(0, 0%, 0%)',
  },
  submitButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'hsl(0, 0%, 0%)',
    borderRadius: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'hsl(0, 0%, 100%)',
  },
});