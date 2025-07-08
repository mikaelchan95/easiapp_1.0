import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { GOOGLE_MAPS_CONFIG } from '../../config/googleMaps';
import { LocationSuggestion, LocationCoordinate, SavedAddress } from '../../types/location';
import { GoogleMapsService } from '../../services/googleMapsService';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';

const { width, height } = Dimensions.get('window');

interface UberStyleLocationPickerProps {
  onLocationSelect: (location: LocationSuggestion) => void;
}

// Header Component
const LocationHeader: React.FC<{ onBackPress: () => void }> = ({ onBackPress }) => (
  <View style={[styles.header, { backgroundColor: COLORS.card }]}>
    <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
      <Ionicons name="chevron-back" size={24} color={COLORS.text} />
    </TouchableOpacity>
    <View style={styles.headerTitle}>
      <Text style={styles.headerTitleText}>Set location</Text>
    </View>
    <View style={styles.placeholderButton} />
  </View>
);

// Sheet Header Component
const SheetHeader: React.FC = () => (
  <View style={styles.sheetHeaderContainer}>
    <View style={styles.sheetHandle} />
    <View style={styles.sheetHeader}>
      <Text style={styles.sheetTitle}>Set delivery location</Text>
      <Text style={styles.sheetSubtitle}>Choose where you'd like your order delivered</Text>
    </View>
  </View>
);

// Saved Location Item Component
const SavedLocationItem: React.FC<{
  item: SavedAddress;
  onPress: (address: SavedAddress) => void;
  onQuickSave?: (address: SavedAddress) => void;
}> = ({ item, onPress, onQuickSave }) => (
  <TouchableOpacity 
    style={styles.savedLocationCard}
    onPress={() => onPress(item)}
    activeOpacity={0.7}
  >
    <View style={[styles.savedLocationIcon, { backgroundColor: item.color || COLORS.primary }]}>
      <Ionicons 
        name={item.icon as any || 'location'} 
        size={20} 
        color={COLORS.card} 
      />
    </View>
    <View style={styles.savedLocationInfo}>
      <Text style={styles.savedLocationLabel} numberOfLines={1}>
        {item.label}
      </Text>
      <Text style={styles.savedLocationAddress} numberOfLines={1}>
        {item.location.title}
      </Text>
      {item.isDefault && (
        <View style={styles.defaultBadge}>
          <Text style={styles.defaultBadgeText}>Default</Text>
        </View>
      )}
    </View>
    {onQuickSave && (
      <TouchableOpacity 
        style={styles.quickSaveButton}
        onPress={(e) => {
          e.stopPropagation();
          onQuickSave(item);
        }}
        activeOpacity={0.7}
      >
        <Ionicons name="bookmark-outline" size={16} color={COLORS.primary} />
      </TouchableOpacity>
    )}
    <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
  </TouchableOpacity>
);

// Current Location Button Component
const CurrentLocationButton: React.FC<{
  onPress: () => void;
  visible: boolean;
}> = ({ onPress, visible }) => {
  if (!visible) return null;
  
  return (
    <TouchableOpacity style={styles.primaryLocationButton} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.primaryButtonContent}>
        <View style={styles.primaryButtonIcon}>
          <Ionicons name="locate" size={24} color={COLORS.card} />
        </View>
        <View style={styles.primaryButtonText}>
          <Text style={styles.primaryButtonTitle}>Use my current location</Text>
          <Text style={styles.primaryButtonSubtitle}>We'll detect your location automatically</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Divider Component
const OrDivider: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;
  
  return (
    <View style={styles.dividerContainer}>
      <View style={styles.dividerLine} />
      <Text style={styles.dividerText}>OR</Text>
      <View style={styles.dividerLine} />
    </View>
  );
};

// Search Input Component
const SearchInput: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onClear: () => void;
  showLabel: boolean;
  inputRef?: React.RefObject<TextInput>;
}> = ({ value, onChangeText, onFocus, onClear, showLabel, inputRef }) => (
  <View style={styles.searchSection}>
    {showLabel && <Text style={styles.searchLabel}>Enter a specific address</Text>}
    <View style={styles.sheetInputWrapper}>
      <View style={styles.locationInputDot}>
        <View style={styles.deliveryDot} />
      </View>
      <TextInput
        ref={inputRef}
        style={styles.sheetInput}
        placeholder="Search for address, building, or area"
        placeholderTextColor={COLORS.textSecondary}
        value={value}
        onFocus={onFocus}
        onChangeText={onChangeText}
        autoCapitalize="none"
        returnKeyType="search"
        accessibilityLabel="Enter delivery address"
        accessibilityHint="Search for a location to set as your delivery address"
      />
      {value ? (
        <TouchableOpacity style={styles.clearButton} onPress={onClear}>
          <Ionicons name="close-circle-outline" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

// Search Results Component
const SearchResults: React.FC<{
  searchText: string;
  suggestions: LocationSuggestion[];
  isLoading: boolean;
  onSelectLocation: (location: LocationSuggestion) => void;
}> = ({ searchText, suggestions, isLoading, onSelectLocation }) => {
  if (searchText.length === 0) return null;

  return (
    <View style={styles.suggestionsContainer}>
      <Text style={styles.searchResultsTitle}>Search Results</Text>
      <ScrollView style={styles.suggestionsList} keyboardShouldPersistTaps="handled">
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Searching locations...</Text>
          </View>
        )}
        {!isLoading && suggestions.length > 0 && suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={`${suggestion.id}-${index}`}
            style={styles.suggestionItem}
            onPress={() => onSelectLocation(suggestion)}
            accessibilityLabel={`Select location ${suggestion.title}`}
            accessibilityRole="button"
          >
                          <View style={styles.suggestionIcon}>
              <Ionicons name={suggestion.isPremiumLocation ? "star" : "location"} size={20} color={COLORS.textSecondary} />
            </View>
            <View style={styles.suggestionTextContainer}>
              <Text style={styles.suggestionTitle} numberOfLines={1}>{suggestion.title}</Text>
              <Text style={styles.suggestionSubtitle} numberOfLines={1}>{suggestion.subtitle}</Text>
            </View>
          </TouchableOpacity>
        ))}
        {!isLoading && searchText.length > 0 && suggestions.length === 0 && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>No locations found.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const UberStyleLocationPicker: React.FC<UberStyleLocationPickerProps> = ({
  onLocationSelect
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const inputRef = useRef<TextInput>(null);
  const { 
    deliveryLocation, 
    setDeliveryLocation, 
    savedAddresses, 
    loadSavedAddresses,
    saveCurrentLocation,
    locationPreferences 
  } = useDeliveryLocation();
  
  // State management
  const [mapReady, setMapReady] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationSuggestion | null>(null);
  const [pickupLocation, setPickupLocation] = useState<LocationSuggestion | null>(null);
  const [mapRegion, setMapRegion] = useState(GOOGLE_MAPS_CONFIG.marinaBayRegion);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showSavedLocations, setShowSavedLocations] = useState(true);
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  // Enhanced keyboard handling with proper iOS support
  useEffect(() => {
    const keyboardWillShow = (event: any) => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates.height);
      setShowSavedLocations(false); // Hide saved locations when keyboard appears
    };

    const keyboardWillHide = () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      setShowSavedLocations(true); // Show saved locations when keyboard disappears
    };

    const keyboardDidShow = (event: any) => {
      if (Platform.OS === 'android') {
        setIsKeyboardVisible(true);
        setKeyboardHeight(event.endCoordinates.height);
        setShowSavedLocations(false);
      }
    };

    const keyboardDidHide = () => {
      if (Platform.OS === 'android') {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
        setShowSavedLocations(true);
      }
    };

    let showSubscription, hideSubscription;

    if (Platform.OS === 'ios') {
      showSubscription = Keyboard.addListener('keyboardWillShow', keyboardWillShow);
      hideSubscription = Keyboard.addListener('keyboardWillHide', keyboardWillHide);
    } else {
      showSubscription = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
      hideSubscription = Keyboard.addListener('keyboardDidHide', keyboardDidHide);
    }

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, []);

  // Initialize with current delivery location
  useEffect(() => {
    if (deliveryLocation) {
      setPickupLocation(deliveryLocation);
      if (deliveryLocation.coordinate) {
        setMapRegion({
          latitude: deliveryLocation.coordinate.latitude,
          longitude: deliveryLocation.coordinate.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      }
    }
  }, [deliveryLocation]);

  // Load initial data with preference checking
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load saved addresses
        await loadSavedAddresses();
        
        // Only load current location if preferences allow it
        if (locationPreferences.autoSuggestCurrent) {
          const location = await GoogleMapsService.getCurrentLocation();
          if (location) {
            setCurrentLocation(location);
            if (!pickupLocation && !deliveryLocation) {
              setPickupLocation(location);
              await setDeliveryLocation(location);
            }
            if (location.coordinate && !deliveryLocation) {
              setMapRegion({
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              });
            }
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    };

    loadInitialData();
  }, [locationPreferences.autoSuggestCurrent, pickupLocation, deliveryLocation, loadSavedAddresses, setDeliveryLocation]);

  // Handlers
  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleInputFocus = () => {
    // Ensure input stays visible when keyboard appears
    if (Platform.OS === 'ios') {
      // Small delay to ensure keyboard animation completes
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleSearchInput = async (text: string) => {
    setSearchText(text);
    
    if (text.length > 2) {
      try {
        setIsLoading(true);
        const results = await GoogleMapsService.getAutocompleteSuggestions(text);
        setSuggestions(results);
      } catch (error) {
        console.error('Search error:', error);
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleLocationSelection = async (location: LocationSuggestion) => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Validate location
      const validation = await GoogleMapsService.validateLocation(location);
      
      if (!validation.valid) {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        Alert.alert(
          'Location Not Available',
          validation.error || 'Unable to deliver to this location',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Use enriched location with delivery info
      const enrichedLocation = validation.enrichedLocation || location;
      
      setPickupLocation(enrichedLocation);
      await setDeliveryLocation(enrichedLocation);

      if (enrichedLocation.coordinate) {
        setMapRegion({
          latitude: enrichedLocation.coordinate.latitude,
          longitude: enrichedLocation.coordinate.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      }

      setSearchText('');
      Keyboard.dismiss();
      
      // Auto-confirm after a short delay
      setTimeout(() => {
        handleConfirmLocation(enrichedLocation);
      }, 300);
      
    } catch (error) {
      console.error('Error selecting location:', error);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert(
        'Error',
        'Unable to select this location. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleSavedLocationSelect = async (savedAddress: SavedAddress) => {
    const locationWithSavedType = {
      ...savedAddress.location,
      type: 'saved' as const
    };
    
    await handleLocationSelection(locationWithSavedType);
  };

  const handleCurrentLocationPress = async () => {
    Keyboard.dismiss();
    
    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      const loadingLocation = {
        id: 'loading_current_location',
        title: 'Getting your location...',
        subtitle: 'Please wait',
        coordinate: undefined,
      };
      setPickupLocation(loadingLocation);
      
      const location = await GoogleMapsService.getCurrentLocation();
      
      if (location) {
        setPickupLocation(location);
        await setDeliveryLocation(location);
        handleLocationSelection(location);
      } else {
        setPickupLocation(null);
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        Alert.alert('Location Error', 'Unable to get your current location. Please check your location permissions and try again.');
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      setPickupLocation(null);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Location Error', 'Unable to get your current location. Please try again.');
    }
  };

  const handleConfirmLocation = (location?: LocationSuggestion) => {
    const locationToConfirm = location || pickupLocation || deliveryLocation;
    
    if (locationToConfirm) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      onLocationSelect(locationToConfirm);
      
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  };

  const renderSuggestionItem = ({ item }: { item: LocationSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleLocationSelection(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionIcon}>
        <Ionicons 
          name={item.type === 'current' ? 'location' : 'location-outline'} 
          size={20} 
          color={COLORS.text} 
        />
      </View>
      <View style={styles.suggestionTextContainer}>
        <Text style={styles.suggestionTitle} numberOfLines={1}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={styles.suggestionSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  // Enhanced keyboard offset calculation for iOS
  const getKeyboardOffset = () => {
    if (!isKeyboardVisible || keyboardHeight === 0) return 0;
    
    if (Platform.OS === 'ios') {
      // Minimize offset to prevent over-adjustment
      return Math.max(keyboardHeight - insets.bottom - 100, 0);
    } else {
      // For Android, use a simpler calculation
      return keyboardHeight;
    }
  };

  // Calculate the keyboardVerticalOffset for KeyboardAvoidingView
  const getKeyboardVerticalOffset = () => {
    if (Platform.OS === 'ios') {
      // Account for the header height and safe area
      return insets.top + 60; // Header height approximation
    }
    return 0;
  };

  // Handle quick save of current location
  const handleQuickSave = async (address: SavedAddress) => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      // Quick save with default label
      const success = await saveCurrentLocation(
        `${address.label} (${new Date().toLocaleDateString()})`,
        address.icon,
        address.color
      );
      
      if (success) {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        // Show success feedback
        setShowSavePrompt(true);
        setTimeout(() => setShowSavePrompt(false), 2000);
      }
    } catch (error) {
      console.error('Error quick saving location:', error);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.card }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} translucent={false} />
      
      <LocationHeader onBackPress={handleBackPress} />
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={getKeyboardVerticalOffset()}
      >
        {/* Map */}
        <View style={[styles.mapContainer, isKeyboardVisible && styles.mapContainerKeyboard]}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={mapRegion}
            region={mapRegion}
            customMapStyle={GOOGLE_MAPS_CONFIG.mapStyle}
            showsUserLocation={true}
            showsMyLocationButton={false}
            onMapReady={() => setMapReady(true)}
          >
            {deliveryLocation?.coordinate && (
              <Marker
                coordinate={deliveryLocation.coordinate}
                title={deliveryLocation.title}
                description={deliveryLocation.subtitle || ''}
                pinColor="#000000"
              />
            )}
          </MapView>
          
          <View style={styles.centerMarker}>
            <View style={styles.markerDot} />
            <View style={styles.markerShadow} />
          </View>
        </View>
        
        {/* Location Sheet - Changed from absolute to flex positioning */}
        <View style={[
          styles.locationSheet,
          isKeyboardVisible && styles.locationSheetKeyboard
        ]}>
          <SheetHeader />
          
          <View style={styles.sheetContent}>
            <CurrentLocationButton 
              onPress={handleCurrentLocationPress}
              visible={searchText.length === 0}
            />
            
            <OrDivider visible={searchText.length === 0} />
            
            <SearchInput
              value={pickupLocation?.title || searchText}
              onChangeText={handleSearchInput}
              onFocus={handleInputFocus}
              onClear={() => {
                setSearchText('');
                setPickupLocation(null);
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              showLabel={searchText.length === 0}
              inputRef={inputRef}
            />
            
            {showSavedLocations && (
              <View style={styles.savedLocationsContainer}>
                <View style={styles.savedLocationsHeader}>
                  <Text style={styles.savedLocationsTitle}>Saved Locations</Text>
                  <TouchableOpacity 
                    style={styles.manageButton}
                    onPress={() => {
                      // Navigate to saved locations management
                      navigation.navigate('SavedLocations');
                    }}
                  >
                    <Text style={styles.manageButtonText}>Manage</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={savedAddresses}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <SavedLocationItem
                      item={item}
                      onPress={handleSavedLocationSelect}
                      onQuickSave={handleQuickSave}
                    />
                  )}
                  scrollEnabled={false}
                  nestedScrollEnabled={false}
                />
              </View>
            )}
            
            <SearchResults
              searchText={searchText}
              suggestions={suggestions}
              isLoading={isLoading}
              onSelectLocation={handleLocationSelection}
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Save Prompt Overlay */}
      {showSavePrompt && (
        <View style={styles.savePromptOverlay}>
          <View style={styles.savePromptContent}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
            <Text style={styles.savePromptText}>Location saved!</Text>
          </View>
        </View>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    zIndex: 10,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  placeholderButton: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    minHeight: 200, // Ensure minimum map height
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  centerMarker: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -8,
    marginTop: -16,
    alignItems: 'center',
  },
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.card,
  },
  markerShadow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginTop: 2,
  },
  locationSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: 400,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    paddingHorizontal: 0,
    overflow: 'hidden',
    // Use flex instead of absolute positioning
    flexShrink: 0,
  },
  sheetHeaderContainer: {
    paddingBottom: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.border,
    marginTop: 8,
    marginBottom: 8,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  primaryLocationButton: {
    backgroundColor: COLORS.text,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    ...SHADOWS.medium,
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  primaryButtonText: {
    flex: 1,
  },
  primaryButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.card,
    marginBottom: 2,
  },
  primaryButtonSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  searchSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 8,
  },
  sheetInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationInputDot: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deliveryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  sheetInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  clearButton: {
    padding: 8,
    marginLeft: 4,
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    minHeight: 200,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  suggestionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    marginLeft: 8,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  mapContainerKeyboard: {
    // Reduce map height when keyboard is visible to give more space to input
    flex: 0.3,
    minHeight: 150,
  },
  locationSheetKeyboard: {
    // Ensure the sheet has enough space and proper scrolling when keyboard is visible
    flex: 1,
    minHeight: 300,
    maxHeight: '70%',
  },
  sheetContent: {
    flex: 1,
  },
  sheetContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  savedLocationsContainer: {
    padding: 20,
  },
  savedLocationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  savedLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  savedLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  savedLocationInfo: {
    flex: 1,
  },
  savedLocationLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  savedLocationAddress: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 4,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.card,
  },
  savedLocationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  manageButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  manageButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  quickSaveButton: {
    padding: SPACING.xs,
    marginRight: SPACING.xs,
  },
  savePromptOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  savePromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  savePromptText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default UberStyleLocationPicker; 