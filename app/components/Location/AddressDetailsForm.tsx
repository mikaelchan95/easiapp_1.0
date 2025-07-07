import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../utils/theme';
import { LocationSuggestion } from '../../types/location';

interface AddressDetailsFormProps {
  location: LocationSuggestion;
  onSave: (details: any) => void;
  onCancel: () => void;
}

const AddressDetailsForm: React.FC<AddressDetailsFormProps> = ({
  location,
  onSave,
  onCancel,
}) => {
  const [unitNumber, setUnitNumber] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [preferredTimeFrom, setPreferredTimeFrom] = useState('');
  const [preferredTimeTo, setPreferredTimeTo] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [label, setLabel] = useState('');

  const handleSave = () => {
    onSave({
      location,
      unitNumber,
      buildingName,
      deliveryInstructions,
      preferredTime: preferredTimeFrom && preferredTimeTo ? {
        from: preferredTimeFrom,
        to: preferredTimeTo,
      } : undefined,
      contactNumber,
      label: label || 'Other',
    });
  };

  const quickLabels = ['Home', 'Office', 'Other'];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add Delivery Details</Text>
          <Text style={styles.locationText}>{location.title}</Text>
          {location.subtitle && (
            <Text style={styles.locationSubtext}>{location.subtitle}</Text>
          )}
        </View>

        {/* Quick Labels */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Save as</Text>
          <View style={styles.quickLabels}>
            {quickLabels.map((quickLabel) => (
              <TouchableOpacity
                key={quickLabel}
                style={[
                  styles.labelButton,
                  label === quickLabel && styles.labelButtonActive,
                ]}
                onPress={() => setLabel(quickLabel)}
              >
                <Ionicons
                  name={quickLabel === 'Home' ? 'home' : quickLabel === 'Office' ? 'business' : 'location'}
                  size={16}
                  color={label === quickLabel ? COLORS.card : COLORS.text}
                  style={styles.labelIcon}
                />
                <Text
                  style={[
                    styles.labelText,
                    label === quickLabel && styles.labelTextActive,
                  ]}
                >
                  {quickLabel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Address Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Unit / Floor Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., #12-34"
              placeholderTextColor={COLORS.placeholder}
              value={unitNumber}
              onChangeText={setUnitNumber}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Building / Block Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Tower A"
              placeholderTextColor={COLORS.placeholder}
              value={buildingName}
              onChangeText={setBuildingName}
            />
          </View>
        </View>

        {/* Delivery Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., Leave at door, ring doorbell, security code: 1234"
            placeholderTextColor={COLORS.placeholder}
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Preferred Delivery Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Delivery Time</Text>
          <View style={styles.timeInputs}>
            <View style={[styles.inputGroup, styles.timeInput]}>
              <Text style={styles.inputLabel}>From</Text>
              <TextInput
                style={styles.input}
                placeholder="9:00 AM"
                placeholderTextColor={COLORS.placeholder}
                value={preferredTimeFrom}
                onChangeText={setPreferredTimeFrom}
              />
            </View>
            <View style={[styles.inputGroup, styles.timeInput]}>
              <Text style={styles.inputLabel}>To</Text>
              <TextInput
                style={styles.input}
                placeholder="6:00 PM"
                placeholderTextColor={COLORS.placeholder}
                value={preferredTimeTo}
                onChangeText={setPreferredTimeTo}
              />
            </View>
          </View>
        </View>

        {/* Contact Number */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Alternative contact number"
            placeholderTextColor={COLORS.placeholder}
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
          />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Address</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  locationSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  quickLabels: {
    flexDirection: 'row',
    gap: 12,
  },
  labelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  labelButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  labelIcon: {
    marginRight: 6,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  labelTextActive: {
    color: COLORS.card,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  timeInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
    ...SHADOWS.medium,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.card,
  },
});

export default AddressDetailsForm;