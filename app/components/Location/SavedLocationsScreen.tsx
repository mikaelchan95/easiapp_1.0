import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { SavedAddress, LocationSuggestion } from '../../types/location';
import { GoogleMapsService } from '../../services/googleMapsService';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';
import SwipeableListItem from '../UI/SwipeableListItem';

interface SavedLocationsScreenProps {
  route: any;
  navigation: any;
}

const SavedLocationsScreen: React.FC<SavedLocationsScreenProps> = ({ route, navigation }) => {
  const { savedAddresses, loadSavedAddresses, setDeliveryLocation } = useDeliveryLocation();
  
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editIsDefault, setEditIsDefault] = useState(false);

  // Load saved addresses on mount
  useEffect(() => {
    loadSavedAddresses();
  }, [loadSavedAddresses]);

  // Handle address selection
  const handleAddressSelect = async (address: SavedAddress) => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      // Set as delivery location
      await setDeliveryLocation(address.location);
      
      // Navigate back
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error selecting address:', error);
    }
  };

  // Handle address deletion
  const handleAddressDelete = async (id: string) => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      
      Alert.alert(
        'Delete Address',
        'Are you sure you want to delete this saved location?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await GoogleMapsService.deleteAddress(id);
                await loadSavedAddresses();
                
                if (Platform.OS === 'ios') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              } catch (error) {
                console.error('Error deleting address:', error);
                if (Platform.OS === 'ios') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in delete confirmation:', error);
    }
  };

  // Handle address editing
  const handleAddressEdit = (address: SavedAddress) => {
    setEditingAddress(address);
    setEditLabel(address.label);
    setEditIcon(address.icon || 'location');
    setEditColor(address.color || COLORS.primary);
    setEditIsDefault(address.isDefault || false);
    setEditModalVisible(true);
  };

  // Save edited address
  const handleSaveEdit = async () => {
    if (!editingAddress || !editLabel.trim()) {
      Alert.alert('Error', 'Please provide a name for this address');
      return;
    }

    try {
      const updatedAddress: SavedAddress = {
        ...editingAddress,
        label: editLabel.trim(),
        icon: editIcon,
        color: editColor,
        isDefault: editIsDefault,
        updatedAt: new Date()
      };

      await GoogleMapsService.saveAddress(updatedAddress);
      await loadSavedAddresses();
      
      setEditModalVisible(false);
      setEditingAddress(null);
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error saving edited address:', error);
      Alert.alert('Error', 'Failed to save changes');
    }
  };

  // Set address as default
  const handleSetDefault = async (address: SavedAddress) => {
    try {
      // Remove default from all other addresses
      const updatedAddresses = savedAddresses.map(addr => ({
        ...addr,
        isDefault: addr.id === address.id
      }));

      // Save all addresses
      for (const addr of updatedAddresses) {
        await GoogleMapsService.saveAddress(addr);
      }

      await loadSavedAddresses();
      
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Error setting default address:', error);
    }
  };

  // Render address item
  const renderAddressItem = ({ item }: { item: SavedAddress }) => (
    <SwipeableListItem
      onDelete={() => handleAddressDelete(item.id)}
      rightActions={[
        {
          label: 'Edit',
          icon: 'create-outline',
          color: COLORS.primary,
          onPress: () => handleAddressEdit(item)
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.addressItem}
        onPress={() => handleAddressSelect(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: item.color || COLORS.primary }]}>
          <Ionicons 
            name={item.icon as any || 'location'} 
            size={20} 
            color={COLORS.card} 
          />
        </View>
        
        <View style={styles.addressDetails}>
          <View style={styles.addressHeader}>
            <Text style={styles.addressLabel}>{item.label}</Text>
            {item.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.addressLine} numberOfLines={1}>
            {item.location.title}
          </Text>
          
          {item.location.subtitle && (
            <Text style={styles.addressSubtitle} numberOfLines={1}>
              {item.location.subtitle}
            </Text>
          )}
        </View>
        
        <View style={styles.actionButtons}>
          {!item.isDefault && (
            <TouchableOpacity
              style={styles.setDefaultButton}
              onPress={() => handleSetDefault(item)}
            >
              <Ionicons name="star-outline" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleAddressEdit(item)}
          >
            <Ionicons name="create-outline" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </SwipeableListItem>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Locations</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      {savedAddresses.length > 0 ? (
        <FlatList
          data={savedAddresses}
          renderItem={renderAddressItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="location-outline" size={64} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>No saved addresses</Text>
          <Text style={styles.emptySubtitle}>
            Save your frequently used locations for faster checkout
          </Text>
        </View>
      )}

      {/* Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Address</Text>
            <TouchableOpacity 
              style={styles.modalSaveButton}
              onPress={handleSaveEdit}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Name</Text>
              <TextInput
                style={styles.formInput}
                value={editLabel}
                onChangeText={setEditLabel}
                placeholder="e.g. Home, Office"
                maxLength={30}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Icon</Text>
              <View style={styles.iconGrid}>
                {['location', 'home', 'business', 'car', 'school', 'heart'].map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      editIcon === icon && styles.iconOptionSelected
                    ]}
                    onPress={() => setEditIcon(icon)}
                  >
                    <Ionicons 
                      name={icon as any} 
                      size={24} 
                      color={editIcon === icon ? COLORS.card : COLORS.textSecondary} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Color</Text>
              <View style={styles.colorGrid}>
                {[COLORS.primary, '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'].map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      editColor === color && styles.colorOptionSelected
                    ]}
                    onPress={() => setEditColor(color)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Set as default address</Text>
              <Switch
                value={editIsDefault}
                onValueChange={setEditIsDefault}
                trackColor={{ false: '#d1d1d1', true: COLORS.primary }}
                thumbColor={editIsDefault ? COLORS.card : '#f4f3f4'}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  listContent: {
    paddingBottom: SPACING.lg,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  addressDetails: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  addressLabel: {
    ...TYPOGRAPHY.h4,
    fontWeight: '600',
    color: COLORS.text,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: SPACING.xs,
  },
  defaultText: {
    color: COLORS.card,
    fontSize: 10,
    fontWeight: '500',
  },
  addressLine: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: 2,
  },
  addressSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  setDefaultButton: {
    padding: SPACING.xs,
  },
  editButton: {
    padding: SPACING.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  modalCloseText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  modalSaveButton: {
    padding: SPACING.xs,
  },
  modalSaveText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: SPACING.md,
  },
  formGroup: {
    marginBottom: SPACING.lg,
  },
  formLabel: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  formInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  iconOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  colorOptionSelected: {
    borderColor: COLORS.text,
    borderWidth: 3,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  switchLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
});

export default SavedLocationsScreen; 