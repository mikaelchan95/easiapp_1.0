import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeliveryAddress } from './CheckoutScreen';

interface AddressStepProps {
  address: DeliveryAddress;
  onContinue: (address: DeliveryAddress) => void;
}

const AddressStep: React.FC<AddressStepProps> = ({ 
  address: initialAddress,
  onContinue
}) => {
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
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Initialize address with initialAddress only once when the component mounts
  // or when initialAddress changes
  useEffect(() => {
    setAddress(initialAddress);
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
  
  const validateAddress = () => {
    const newErrors: Record<string, string> = {};
    
    if (!address.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!address.street.trim()) {
      newErrors.street = 'Street address is required';
    }
    
    if (!address.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!address.postalCode.trim()) {
      newErrors.postalCode = 'Postal code is required';
    }
    
    if (!address.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleContinue = () => {
    if (validateAddress()) {
      onContinue(address);
    }
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Delivery Address</Text>
      <Text style={styles.subtitle}>Please enter your shipping details</Text>
      
      <View style={styles.form}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Enter your full name"
            value={address.name}
            onChangeText={(value) => updateField('name', value)}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Street Address</Text>
          <TextInput
            style={[styles.input, errors.street && styles.inputError]}
            placeholder="Enter street address"
            value={address.street}
            onChangeText={(value) => updateField('street', value)}
          />
          {errors.street ? <Text style={styles.errorText}>{errors.street}</Text> : null}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Unit/Apt/Suite (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="E.g., Apt #1234, Unit 567"
            value={address.unit}
            onChangeText={(value) => updateField('unit', value)}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={[styles.input, errors.city && styles.inputError]}
            placeholder="Enter city"
            value={address.city}
            onChangeText={(value) => updateField('city', value)}
          />
          {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Postal Code</Text>
          <TextInput
            style={[styles.input, errors.postalCode && styles.inputError]}
            placeholder="Enter postal code"
            value={address.postalCode}
            onChangeText={(value) => updateField('postalCode', value)}
            keyboardType="number-pad"
          />
          {errors.postalCode ? <Text style={styles.errorText}>{errors.postalCode}</Text> : null}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            placeholder="Enter phone number"
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
              {address.isDefault && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
          </TouchableOpacity>
          <Text style={styles.checkboxLabel}>Save as my default address</Text>
        </View>
      </View>
      
      <View style={styles.deliveryInfo}>
        <View style={styles.infoIcon}>
          <Ionicons name="information-circle" size={24} color="#4CAF50" />
        </View>
        <Text style={styles.infoText}>
          We deliver to most areas. Your address will be verified in the next step.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#1a1a1a',
    marginRight: 12,
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
    backgroundColor: '#1a1a1a',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  deliveryInfo: {
    flexDirection: 'row',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
});

export default AddressStep; 