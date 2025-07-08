import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { LocationSuggestion, SavedAddress, DeliveryDetails } from '../../types/location';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';
import { GoogleMapsService } from '../../services/googleMapsService';
import EnhancedLocationPicker from './EnhancedLocationPicker';
import AddressDetailsForm from './AddressDetailsForm';

interface LocationManagementDemoProps {
  navigation?: any;
}

/**
 * Demo component showcasing the enhanced saved locations functionality
 * This demonstrates the complete flow: location selection -> address details -> saving
 */
const LocationManagementDemo: React.FC<LocationManagementDemoProps> = ({ navigation }) => {
  const { savedAddresses, loadSavedAddresses, setDeliveryLocation } = useDeliveryLocation();
  
  // State management
  const [currentStep, setCurrentStep] = useState<'demo' | 'picker' | 'details'>('demo');
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [isLocationPickerVisible, setLocationPickerVisible] = useState(false);
  const [isAddressFormVisible, setAddressFormVisible] = useState(false);

  // Load saved addresses on mount
  useEffect(() => {
    loadSavedAddresses();
  }, [loadSavedAddresses]);

  // Handle location selection from picker
  const handleLocationSelect = (location: LocationSuggestion) => {
    setSelectedLocation(location);
    setLocationPickerVisible(false);
    setAddressFormVisible(true);
  };

  // Handle address details submission (for delivery)
  const handleAddressSubmit = async (details: DeliveryDetails) => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Set as delivery location
      await setDeliveryLocation(details.location);
      
      setAddressFormVisible(false);
      setSelectedLocation(null);
      
      Alert.alert(
        'Success!',
        'Address details saved for this delivery.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error submitting address details:', error);
      Alert.alert('Error', 'Failed to save address details');
    }
  };

  // Handle saving address to saved locations
  const handleAddressSave = async (details: DeliveryDetails & {label: string; icon?: string; color?: string}) => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      const savedAddress: SavedAddress = {
        id: `saved_${Date.now()}`,
        label: details.label,
        location: details.location,
        unitNumber: details.unitNumber,
        buildingName: details.buildingName,
        deliveryInstructions: details.deliveryInstructions,
        contactNumber: details.contactNumber,
        isDefault: details.isDefault,
        icon: details.icon || 'location-on',
        color: details.color || '#607D8B',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await GoogleMapsService.saveAddress(savedAddress);
      await loadSavedAddresses();
      
      setAddressFormVisible(false);
      setSelectedLocation(null);
      
      Alert.alert(
        'Saved!',
        `"${details.label}" has been saved to your locations.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Error', 'Failed to save address');
    }
  };

  // Handle using a saved address
  const handleUseSavedAddress = async (address: SavedAddress) => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      await setDeliveryLocation(address.location);
      
      Alert.alert(
        'Address Selected',
        `Using "${address.label}" for delivery.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error using saved address:', error);
    }
  };

  // Render demo actions
  const renderDemoActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Location Management Demo</Text>
      <Text style={styles.sectionDescription}>
        Try out the enhanced saved locations functionality with comprehensive address details.
      </Text>
      
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => setLocationPickerVisible(true)}
      >
        <Ionicons name="add-circle" size={24} color={COLORS.primary} />
        <Text style={styles.actionButtonText}>Add New Location</Text>
        <Text style={styles.actionButtonSubtext}>
          Search and save a location with full details
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation?.navigate('SavedLocations')}
      >
        <Ionicons name="bookmark" size={24} color={COLORS.primary} />
        <Text style={styles.actionButtonText}>Manage Saved Locations</Text>
        <Text style={styles.actionButtonSubtext}>
          View, edit, and organize your saved addresses
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render saved addresses preview
  const renderSavedAddresses = () => {
    if (savedAddresses.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Saved Locations</Text>
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No saved locations yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first location to get started
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Saved Locations</Text>
          <TouchableOpacity onPress={() => navigation?.navigate('SavedLocations')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {savedAddresses.slice(0, 3).map((address) => (
          <TouchableOpacity
            key={address.id}
            style={styles.addressItem}
            onPress={() => handleUseSavedAddress(address)}
          >
            <View style={[styles.addressIcon, { backgroundColor: address.color || '#607D8B' }]}>
              <Ionicons 
                name={address.icon as any || 'location-on'} 
                size={20} 
                color={COLORS.card} 
              />
            </View>
            <View style={styles.addressInfo}>
              <View style={styles.addressHeader}>
                <Text style={styles.addressLabel}>{address.label}</Text>
                {address.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressTitle}>{address.location.title}</Text>
              {(address.unitNumber || address.buildingName) && (
                <Text style={styles.addressDetails}>
                  {[address.unitNumber, address.buildingName].filter(Boolean).join(', ')}
                </Text>
              )}
              {address.deliveryInstructions && (
                <Text style={styles.addressInstructions}>
                  📝 {address.deliveryInstructions}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render features list
  const renderFeatures = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Enhanced Features</Text>
      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <Ionicons name="search" size={20} color={COLORS.primary} />
          <Text style={styles.featureText}>Smart location search with autocomplete</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="home" size={20} color={COLORS.primary} />
          <Text style={styles.featureText}>Custom icons and colors for easy recognition</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="document-text" size={20} color={COLORS.primary} />
          <Text style={styles.featureText}>Unit numbers, building names, and delivery instructions</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="time" size={20} color={COLORS.primary} />
          <Text style={styles.featureText}>Preferred delivery time windows</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="call" size={20} color={COLORS.primary} />
          <Text style={styles.featureText}>Alternative contact numbers</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="star" size={20} color={COLORS.primary} />
          <Text style={styles.featureText}>Set default addresses for quick selection</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderDemoActions()}
        {renderSavedAddresses()}
        {renderFeatures()}
      </ScrollView>

      {/* Enhanced Location Picker */}
      <EnhancedLocationPicker
        visible={isLocationPickerVisible}
        onClose={() => setLocationPickerVisible(false)}
        onLocationSelect={handleLocationSelect}
        title="Select Location"
        showSavedLocations={true}
        showCurrentLocation={true}
      />

      {/* Address Details Form */}
      {selectedLocation && isAddressFormVisible && (
        <AddressDetailsForm
          location={selectedLocation}
          onSubmit={handleAddressSubmit}
          onSave={handleAddressSave}
          onCancel={() => {
            setAddressFormVisible(false);
            setSelectedLocation(null);
          }}
          isSaveMode={true}
        />
      )}
    </SafeAreaView>
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
  section: {
    backgroundColor: COLORS.card,
    marginVertical: SPACING.xs,
    paddingVertical: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  sectionDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  seeAllText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    ...SHADOWS.light,
  },
  actionButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
    marginLeft: SPACING.sm,
  },
  actionButtonSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 2,
    marginLeft: SPACING.sm,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    ...SHADOWS.light,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  addressInfo: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: SPACING.xs,
  },
  defaultBadgeText: {
    color: COLORS.card,
    fontSize: 10,
    fontWeight: '600',
  },
  addressTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: 2,
  },
  addressDetails: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 2,
    fontWeight: '500',
  },
  addressInstructions: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '500',
    marginTop: SPACING.sm,
  },
  emptySubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  featuresList: {
    paddingHorizontal: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  featureText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginLeft: SPACING.sm,
    flex: 1,
  },
});

export default LocationManagementDemo; 