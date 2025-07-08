import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { SavedAddress, LocationSuggestion, DeliveryDetails } from '../../types/location';
import { GoogleMapsService } from '../../services/googleMapsService';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';
import SwipeableListItem from '../UI/SwipeableListItem';
import EnhancedLocationPicker from './EnhancedLocationPicker';
import AddressDetailsForm from './AddressDetailsForm';

const { width } = Dimensions.get('window');

/**
 * Modern minimalistic saved locations screen with widget-based design
 * Following design principles: clarity, consistency, visual hierarchy
 */
export default function SavedLocationsScreen() {
  const navigation = useNavigation();
  const { deliveryLocation, setDeliveryLocation } = useDeliveryLocation();
  
  // State management
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLocationPickerVisible, setLocationPickerVisible] = useState(false);
  const [isAddressFormVisible, setAddressFormVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [isManageMode, setIsManageMode] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  // Load saved addresses
  const loadSavedAddresses = useCallback(async () => {
    try {
      const addresses = await GoogleMapsService.getSavedAddresses();
      setSavedAddresses(addresses);
      
      // Animate in content
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Error loading saved addresses:', error);
      Alert.alert('Connection Error', 'Check your connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [fadeAnim, slideAnim]);

  useEffect(() => {
    loadSavedAddresses();
  }, [loadSavedAddresses]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadSavedAddresses();
  }, [loadSavedAddresses]);

  // Handle location selection from picker (goes to address form)
  const handleLocationPickerSelect = (location: LocationSuggestion) => {
    setSelectedLocation(location);
    setLocationPickerVisible(false);
    setAddressFormVisible(true);
  };

  // Handle location selection with details from address form
  const handleLocationSelected = async (locationSuggestion: LocationSuggestion, details: DeliveryDetails & {label: string; icon?: string; color?: string}) => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      const newAddress: SavedAddress = {
        id: Date.now().toString(),
        label: details.label,
        location: locationSuggestion,
        isDefault: details.isDefault || false,
        icon: details.icon || 'home',
        color: COLORS.text,
        unitNumber: details.unitNumber,
        buildingName: details.buildingName,
        deliveryInstructions: details.deliveryInstructions,
        contactNumber: details.contactNumber,
        preferredTime: details.preferredTime,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await GoogleMapsService.saveAddress(newAddress);
      await loadSavedAddresses();
      setLocationPickerVisible(false);
      
      Alert.alert('Location Saved', 'Added successfully.');
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Save Failed', 'Please try again.');
    }
  };

  // Handle address selection
  const handleAddressSelect = async (address: SavedAddress) => {
    if (isManageMode) {
      setSelectedAddressId(address.id === selectedAddressId ? null : address.id);
      return;
    }

    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      setDeliveryLocation(address.location);
      navigation.goBack();
    } catch (error) {
      console.error('Error selecting address:', error);
      Alert.alert('Selection Failed', 'Please try again.');
    }
  };

  // Handle address deletion
  const handleAddressDelete = async (addressId: string) => {
    const addressToDelete = savedAddresses.find(addr => addr.id === addressId);
    const addressLabel = addressToDelete?.label || 'this location';
    
    Alert.alert(
      'Delete Location',
      `Remove "${addressLabel}" from your saved locations?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
              
              await GoogleMapsService.deleteAddress(addressId);
              await loadSavedAddresses();
              
              if (savedAddresses.length <= 1) {
                setIsManageMode(false);
              }
              
              setSelectedAddressId(null);
              
              if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert('Delete Failed', 'Please try again.');
            }
          }
        }
      ]
    );
  };

  // Handle set as default
  const handleSetAsDefault = async (addressId: string) => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      const addresses = await GoogleMapsService.getSavedAddresses();
      for (const addr of addresses) {
        const updatedAddr = { ...addr, isDefault: addr.id === addressId };
        await GoogleMapsService.saveAddress(updatedAddr);
      }
      
      await loadSavedAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      Alert.alert('Update Failed', 'Please try again.');
    }
  };

  // Toggle manage mode
  const toggleManageMode = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsManageMode(!isManageMode);
    setSelectedAddressId(null);
  };

  // Get address icon with semantic mapping
  const getAddressIcon = (iconName: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      'home': 'home',
      'business': 'business',
      'school': 'school',
      'fitness-center': 'fitness',
      'local-hospital': 'medical',
      'shopping-cart': 'storefront',
      'restaurant': 'restaurant',
      'location-on': 'location',
    };
    return iconMap[iconName] || 'location';
  };

    // Navigation header with back button
  const renderNavigationHeader = () => (
    <View style={styles.navigationHeader}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.navigationTitle}>Saved Locations</Text>
      {savedAddresses.length > 0 && (
        <TouchableOpacity 
          style={[
            styles.manageButton,
            isManageMode && styles.manageButtonActive
          ]}
          onPress={toggleManageMode}
          accessibilityLabel={isManageMode ? "Done editing" : "Edit locations"}
        >
          <Text style={[
            styles.manageButtonText,
            isManageMode && styles.manageButtonTextActive
          ]}>
            {isManageMode ? 'Done' : 'Manage'}
          </Text>
        </TouchableOpacity>
      )}
      {savedAddresses.length === 0 && <View style={styles.headerSpacer} />}
    </View>
  );

  // Header widget with location count (only show when there are locations)
  const renderHeaderWidget = () => {
    if (savedAddresses.length === 0) return null;
    
    return (
      <Animated.View 
        style={[
          styles.headerWidget,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerSubtitle}>
            {savedAddresses.length} {savedAddresses.length === 1 ? 'location' : 'locations'} saved
          </Text>
        </View>
      </Animated.View>
    );
  };

  // Quick action widget for adding new location
  const renderQuickActionWidget = () => (
    <Animated.View 
      style={[
        styles.quickActionWidget,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.addLocationCard}
                 onPress={() => setLocationPickerVisible(true)}
         accessibilityLabel="Add location"
      >
        <View style={styles.addLocationIconContainer}>
          <Ionicons name="add" size={24} color={COLORS.buttonText} />
        </View>
                 <View style={styles.addLocationContent}>
           <Text style={styles.addLocationTitle}>Add Location</Text>
           <Text style={styles.addLocationSubtitle}>Quick access for deliveries</Text>
         </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );

  // Modern address card with improved visual hierarchy
  const renderAddressCard = ({ item, index }: { item: SavedAddress; index: number }) => {
    const isSelected = selectedAddressId === item.id;
    const iconName = getAddressIcon(item.icon || 'home');
    
    const animatedStyle = {
      opacity: fadeAnim,
      transform: [
        { 
          translateY: slideAnim.interpolate({
            inputRange: [0, 50],
            outputRange: [0, 50 + (index * 10)],
          })
        }
      ]
    };

    if (isManageMode) {
      return (
        <Animated.View style={[styles.cardContainer, animatedStyle]}>
          <TouchableOpacity
            style={[
              styles.addressCard,
              styles.manageCard,
              isSelected && styles.selectedCard
            ]}
                         onPress={() => handleAddressSelect(item)}
             accessibilityLabel={item.label}
             accessibilityState={{ selected: isSelected }}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.addressIconContainer}>
                  <Ionicons name={iconName} size={20} color={COLORS.buttonText} />
                </View>
                <View style={styles.addressDetails}>
                  <View style={styles.labelRow}>
                    <Text style={styles.addressLabel}>{item.label}</Text>
                    {item.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.addressText} numberOfLines={2}>
                    {item.unitNumber && `${item.unitNumber}, `}
                    {item.location.formattedAddress || item.location.title}
                  </Text>
                  {item.deliveryInstructions && (
                    <Text style={styles.instructionsText} numberOfLines={1}>
                      {item.deliveryInstructions}
                    </Text>
                  )}
                </View>
                <View style={styles.selectionIndicator}>
                  <View style={[
                    styles.checkboxContainer,
                    isSelected && styles.checkboxSelected
                  ]}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color={COLORS.buttonText} />
                    )}
                  </View>
                </View>
              </View>
              
              {/* Management actions */}
              {isSelected && (
                <View style={styles.actionButtons}>
                  {!item.isDefault && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                                           onPress={() => handleSetAsDefault(item.id)}
                     accessibilityLabel="Make default"
                    >
                      <Ionicons name="star-outline" size={16} color={COLORS.text} />
                      <Text style={styles.actionButtonText}>Set Default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.deleteAction]}
                                         onPress={() => handleAddressDelete(item.id)}
                     accessibilityLabel="Delete"
                  >
                    <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                    <Text style={[styles.actionButtonText, styles.deleteActionText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    return (
      <Animated.View style={[styles.cardContainer, animatedStyle]}>
        <SwipeableListItem onDelete={() => handleAddressDelete(item.id)}>
          <TouchableOpacity
            style={styles.addressCard}
                         onPress={() => handleAddressSelect(item)}
             accessibilityLabel={`Select ${item.label}`}
          >
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={styles.addressIconContainer}>
                  <Ionicons name={iconName} size={20} color={COLORS.buttonText} />
                </View>
                <View style={styles.addressDetails}>
                  <View style={styles.labelRow}>
                    <Text style={styles.addressLabel}>{item.label}</Text>
                    {item.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.addressText} numberOfLines={2}>
                    {item.unitNumber && `${item.unitNumber}, `}
                    {item.location.formattedAddress || item.location.title}
                  </Text>
                  {item.deliveryInstructions && (
                    <Text style={styles.instructionsText} numberOfLines={1}>
                      {item.deliveryInstructions}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </View>
            </View>
          </TouchableOpacity>
        </SwipeableListItem>
      </Animated.View>
    );
  };

     // Enhanced empty state with improved visual design
   const renderEmptyState = () => (
     <Animated.View 
       style={[
         styles.emptyStateContainer,
         {
           opacity: fadeAnim,
           transform: [{ translateY: slideAnim }]
         }
       ]}
     >
       <View style={styles.emptyStateContent}>
         {/* Improved visual hierarchy with multiple elements */}
         <View style={styles.emptyIllustration}>
           <View style={styles.emptyIconBackground}>
             <Ionicons name="location" size={32} color={COLORS.buttonText} />
           </View>
           <View style={styles.emptyIconAccent}>
             <Ionicons name="add-circle" size={20} color={COLORS.text} />
           </View>
         </View>
         
         <View style={styles.emptyTextContent}>
           <Text style={styles.emptyTitle}>Add Your First Location</Text>
           <Text style={styles.emptySubtitle}>
             Save home, work, or any place you order from regularly
           </Text>
         </View>

         {/* Quick suggestions */}
         <View style={styles.emptySuggestions}>
           <View style={styles.suggestionItem}>
             <Ionicons name="home" size={16} color={COLORS.textSecondary} />
             <Text style={styles.suggestionText}>Home</Text>
           </View>
           <View style={styles.suggestionItem}>
             <Ionicons name="business" size={16} color={COLORS.textSecondary} />
             <Text style={styles.suggestionText}>Work</Text>
           </View>
           <View style={styles.suggestionItem}>
             <Ionicons name="heart" size={16} color={COLORS.textSecondary} />
             <Text style={styles.suggestionText}>Favorites</Text>
           </View>
         </View>
         
         <TouchableOpacity 
           style={styles.emptyActionButton}
           onPress={() => setLocationPickerVisible(true)}
           accessibilityLabel="Add location"
         >
           <Ionicons name="add" size={20} color={COLORS.buttonText} style={styles.buttonIcon} />
           <Text style={styles.emptyActionButtonText}>Add Location</Text>
         </TouchableOpacity>
       </View>
     </Animated.View>
   );

  // Loading state with better UX
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.text} />
                 <Text style={styles.loadingText}>Loading locations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Navigation Header */}
        {renderNavigationHeader()}
        
        {/* Header Widget */}
        {renderHeaderWidget()}
        
        {/* Quick Action Widget - Only show when there are saved locations */}
        {savedAddresses.length > 0 && renderQuickActionWidget()}
        
        {/* Address List */}
        <FlatList
          data={savedAddresses}
          renderItem={renderAddressCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            savedAddresses.length === 0 && styles.emptyListContainer
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.text}
              colors={[COLORS.text]}
            />
          }
          ListEmptyComponent={renderEmptyState}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />

        {/* Enhanced Location Picker Modal */}
        <EnhancedLocationPicker
          visible={isLocationPickerVisible}
          onClose={() => setLocationPickerVisible(false)}
          onLocationSelect={handleLocationPickerSelect}
        />

        {/* Address Details Form Modal */}
        {selectedLocation && (
          <Modal
            visible={isAddressFormVisible}
            animationType="slide"
            presentationStyle="fullScreen"
          >
            <AddressDetailsForm
              location={selectedLocation}
              onSubmit={(details) => {
                setAddressFormVisible(false);
                setSelectedLocation(null);
              }}
              onSave={async (details) => {
                await handleLocationSelected(selectedLocation, details);
                setAddressFormVisible(false);
                setSelectedLocation(null);
              }}
              onCancel={() => {
                setAddressFormVisible(false);
                setSelectedLocation(null);
              }}
              isSaveMode={true}
            />
          </Modal>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.card, // Match header background
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background, // Content area background
  },
  
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },

  // Navigation header with back button
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },

  // Header widget - clean and modern
  headerWidget: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: 20,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.light,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  manageButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 80,
    alignItems: 'center',
  },
  manageButtonActive: {
    backgroundColor: COLORS.buttonBg,
    borderColor: COLORS.buttonBg,
  },
  manageButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },
  manageButtonTextActive: {
    color: COLORS.buttonText,
  },

  // Quick action widget
  quickActionWidget: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
  },
  addLocationCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addLocationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.buttonBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  addLocationContent: {
    flex: 1,
  },
  addLocationTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  addLocationSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Address cards with improved visual hierarchy
  listContainer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  cardContainer: {
    marginBottom: SPACING.sm,
  },
  separator: {
    height: SPACING.sm,
  },
  addressCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  manageCard: {
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  selectedCard: {
    borderColor: COLORS.buttonBg,
    backgroundColor: COLORS.card,
  },
  cardContent: {
    padding: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.buttonBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  addressDetails: {
    flex: 1,
    marginRight: SPACING.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  addressLabel: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    marginRight: SPACING.sm,
  },
  defaultBadge: {
    backgroundColor: COLORS.buttonBg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.buttonText,
    fontWeight: '600',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.xs,
  },
  instructionsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  selectionIndicator: {
    justifyContent: 'center',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.buttonBg,
    borderColor: COLORS.buttonBg,
  },

  // Action buttons for management
  actionButtons: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deleteAction: {
    borderColor: COLORS.error + '40',
    backgroundColor: COLORS.error + '10',
  },
  actionButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text,
    fontWeight: '600',
    marginLeft: SPACING.xs,
    fontSize: 14,
  },
  deleteActionText: {
    color: COLORS.error,
  },

     // Enhanced empty state with improved visual design
   emptyStateContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     paddingHorizontal: SPACING.xl,
   },
   emptyStateContent: {
     alignItems: 'center',
     maxWidth: 320,
   },
   emptyIllustration: {
     position: 'relative',
     marginBottom: SPACING.xl,
   },
   emptyIconBackground: {
     width: 80,
     height: 80,
     borderRadius: 40,
     backgroundColor: COLORS.buttonBg,
     justifyContent: 'center',
     alignItems: 'center',
     ...SHADOWS.medium,
   },
   emptyIconAccent: {
     position: 'absolute',
     bottom: -4,
     right: -4,
     width: 28,
     height: 28,
     borderRadius: 14,
     backgroundColor: COLORS.card,
     justifyContent: 'center',
     alignItems: 'center',
     borderWidth: 2,
     borderColor: COLORS.background,
     ...SHADOWS.light,
   },
   emptyTextContent: {
     alignItems: 'center',
     marginBottom: SPACING.xl,
   },
   emptyTitle: {
     ...TYPOGRAPHY.h3,
     color: COLORS.text,
     fontWeight: '600',
     marginBottom: SPACING.sm,
     textAlign: 'center',
   },
   emptySubtitle: {
     ...TYPOGRAPHY.body,
     color: COLORS.textSecondary,
     textAlign: 'center',
     lineHeight: 24,
   },
   emptySuggestions: {
     flexDirection: 'row',
     justifyContent: 'center',
     alignItems: 'center',
     marginBottom: SPACING.xl,
     gap: SPACING.lg,
   },
   suggestionItem: {
     alignItems: 'center',
     gap: SPACING.xs,
   },
   suggestionText: {
     ...TYPOGRAPHY.caption,
     color: COLORS.textSecondary,
     fontWeight: '500',
     fontSize: 12,
   },
   emptyActionButton: {
     backgroundColor: COLORS.buttonBg,
     paddingHorizontal: SPACING.xl,
     paddingVertical: SPACING.lg,
     borderRadius: 16,
     minWidth: 200,
     alignItems: 'center',
     flexDirection: 'row',
     justifyContent: 'center',
     gap: SPACING.sm,
     ...SHADOWS.light,
   },
   buttonIcon: {
     marginRight: 0,
   },
   emptyActionButtonText: {
     ...TYPOGRAPHY.button,
     color: COLORS.buttonText,
     fontWeight: '600',
   },
}); 