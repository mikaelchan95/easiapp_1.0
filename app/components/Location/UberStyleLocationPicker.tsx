import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';

import { COLORS, SHADOWS, SPACING } from '../../utils/theme';
import { GOOGLE_MAPS_CONFIG } from '../../config/googleMaps';
import { LocationSuggestion, LocationCoordinate } from '../../types/location';
import { GoogleMapsService } from '../../services/googleMapsService';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';

const { width, height } = Dimensions.get('window');

interface UberStyleLocationPickerProps {
  onLocationSelect: (location: LocationSuggestion) => void;
}

const UberStyleLocationPicker: React.FC<UberStyleLocationPickerProps> = ({
  onLocationSelect
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { deliveryLocation, setDeliveryLocation } = useDeliveryLocation();
  
  const [mapReady, setMapReady] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  
  // Animated values
  const searchBarHeight = useRef(new Animated.Value(0)).current;
  const searchBarOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(0)).current;
  
  // Location states - use global state for current location but local for pickup/dropoff in Uber style
  const [currentLocation, setCurrentLocation] = useState<LocationSuggestion | null>(null);
  const [pickupLocation, setPickupLocation] = useState<LocationSuggestion | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationSuggestion | null>(null);
  const [mapRegion, setMapRegion] = useState(GOOGLE_MAPS_CONFIG.marinaBayRegion);

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

  // Handle back button
  const handleBackPress = () => {
    if (searchMode) {
      setSearchMode(false);
      animateSearchBar(false);
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // Animate search bar
  const animateSearchBar = (show: boolean) => {
    Animated.parallel([
      Animated.timing(searchBarHeight, {
        toValue: show ? 300 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(searchBarOpacity, {
        toValue: show ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(cardTranslateY, {
        toValue: show ? -300 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle input focus
  const handleInputFocus = () => {
    setSearchMode(true);
    animateSearchBar(true);
  };

  // Handle search input
  const handleSearchInput = async (text: string, isPickup: boolean) => {
    if (text.length > 2) {
      try {
        const results = await GoogleMapsService.getAutocompleteSuggestions(text);
        setSuggestions(results);
      } catch (error) {
        console.error('Search error:', error);
      }
    } else {
      setSuggestions([]);
    }
  };

  // Handle location selection from search - auto-confirm pickup location
  const handleLocationSelection = (location: LocationSuggestion, isPickup: boolean) => {
    if (isPickup) {
      setPickupLocation(location);
      // Update global delivery location when pickup changes
      setDeliveryLocation(location);
      // Auto-confirm pickup location selection
      setTimeout(() => {
        onLocationSelect(location);
      }, 300);
    } else {
      setDropoffLocation(location);
    }

    if (location.coordinate) {
      setMapRegion({
        latitude: location.coordinate.latitude,
        longitude: location.coordinate.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }

    setSearchMode(false);
    animateSearchBar(false);
  };

  // Handle confirmation - now automatically confirms when location is selected
  const handleConfirmLocation = () => {
    // Use pickup location as the main delivery location for this context
    const locationToConfirm = pickupLocation || deliveryLocation;
    if (locationToConfirm) {
      // Update global delivery location
      setDeliveryLocation(locationToConfirm);
      // Call parent callback immediately
      onLocationSelect(locationToConfirm);
    }
  };

  // Get current location
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const location = await GoogleMapsService.getCurrentLocation();
        if (location) {
          setCurrentLocation(location);
          // If no pickup location is set, use current location
          if (!pickupLocation) {
            setPickupLocation(location);
            setDeliveryLocation(location);
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
      } catch (error) {
        console.error('Error getting current location:', error);
      }
    };

    getCurrentLocation();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <View style={[styles.header, { marginTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name={searchMode ? "close" : "chevron-back"} size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>Set location</Text>
        </View>
        <View style={styles.placeholderButton} />
      </View>
      
      {/* Search overlay */}
      <Animated.View 
        style={[
          styles.searchOverlay,
          { 
            height: searchBarHeight,
            opacity: searchBarOpacity 
          }
        ]}
        pointerEvents={searchMode ? 'auto' : 'none'}
      >
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={`${suggestion.id}-${index}`}
              style={styles.suggestionItem}
              onPress={() => handleLocationSelection(suggestion, false)}
            >
              <View style={styles.suggestionIconContainer}>
                <Ionicons name="location" size={20} color={COLORS.textSecondary} />
              </View>
              <View style={styles.suggestionTextContainer}>
                <Text style={styles.suggestionTitle} numberOfLines={1}>{suggestion.title}</Text>
                <Text style={styles.suggestionSubtitle} numberOfLines={1}>{suggestion.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
      
      {/* Map */}
      <View style={styles.mapContainer}>
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
          {/* Show delivery location marker */}
          {deliveryLocation?.coordinate && (
            <Marker
              coordinate={deliveryLocation.coordinate}
              title={deliveryLocation.title}
              description={deliveryLocation.subtitle || ''}
              pinColor="#000000"
            />
          )}
        </MapView>
        
        {/* Center pin marker */}
        <View style={styles.centerMarker}>
          <View style={styles.markerDot} />
          <View style={styles.markerShadow} />
        </View>
      </View>
      
      {/* Location card */}
      <Animated.View
        style={[
          styles.locationCard,
          {
            transform: [{ translateY: cardTranslateY }],
            paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
          },
        ]}
      >
        <View style={styles.locationCardHandle} />
        
        <View style={styles.locationInputsContainer}>
          <View style={styles.locationInputWrapper}>
            <View style={styles.locationInputDot}>
              <View style={styles.pickupDot} />
            </View>
            <TextInput
              style={styles.locationInput}
              placeholder="Current location"
              placeholderTextColor={COLORS.textSecondary}
              value={pickupLocation?.title || ''}
              onFocus={handleInputFocus}
              onChangeText={(text) => handleSearchInput(text, true)}
            />
          </View>
          
          <View style={styles.locationDivider} />
          
          <View style={styles.locationInputWrapper}>
            <View style={styles.locationInputDot}>
              <View style={styles.dropoffDot} />
            </View>
            <TextInput
              style={styles.locationInput}
              placeholder="Where to?"
              placeholderTextColor={COLORS.textSecondary}
              value={dropoffLocation?.title || ''}
              onFocus={handleInputFocus}
              onChangeText={(text) => handleSearchInput(text, false)}
            />
          </View>
        </View>
        
        {/* Auto-confirm enabled - no manual confirm button needed */}
        {(!pickupLocation && !deliveryLocation) && (
          <View style={styles.instructionText}>
            <Text style={styles.instructionTextContent}>
              Search for your location above or use current location
            </Text>
          </View>
        )}
      </Animated.View>
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
  locationCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingHorizontal: 16,
    ...SHADOWS.large,
  },
  locationCardHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 16,
  },
  locationInputsContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 16,
    ...SHADOWS.light,
  },
  locationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  locationInputDot: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  dropoffDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'black',
  },
  locationDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 48,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    padding: 0,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmButtonText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: '600',
  },
  searchOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 70,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    zIndex: 20,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  suggestionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
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
  instructionText: {
    padding: 16,
    alignItems: 'center',
  },
  instructionTextContent: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default UberStyleLocationPicker; 