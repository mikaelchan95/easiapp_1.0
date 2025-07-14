import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, {
  Marker,
  Region,
  Circle,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocationSuggestion, LocationCoordinate } from '../../types/location';
import { COLORS, SHADOWS, SPACING } from '../../utils/theme';
import { GOOGLE_MAPS_CONFIG } from '../../config/googleMaps';
import LocationHeader from './LocationHeader';
import { GoogleMapsService } from '../../services/googleMapsService';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';

const { width, height } = Dimensions.get('window');

interface LocationPickerScreenProps {
  onLocationSelect?: (location: LocationSuggestion) => void;
}

const LocationPickerScreen: React.FC<LocationPickerScreenProps> = ({
  onLocationSelect,
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { deliveryLocation, setDeliveryLocation } = useDeliveryLocation();
  const [mapRegion, setMapRegion] = useState<Region>(
    GOOGLE_MAPS_CONFIG.marinaBayRegion
  );
  const [mapReady, setMapReady] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Initialize map region based on current delivery location
  useEffect(() => {
    if (deliveryLocation?.coordinate) {
      setMapRegion({
        latitude: deliveryLocation.coordinate.latitude,
        longitude: deliveryLocation.coordinate.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }, [deliveryLocation]);

  // Handle location selection
  const handleLocationSelect = useCallback(
    (location: LocationSuggestion) => {
      console.log('Location selected:', location);

      // Update global delivery location
      setDeliveryLocation(location);

      // If coordinate available, center map on it
      if (location.coordinate) {
        setMapRegion({
          latitude: location.coordinate.latitude,
          longitude: location.coordinate.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      }

      // Pass to parent callback if provided
      if (onLocationSelect) {
        onLocationSelect(location);
      }

      // Go back if we're in a navigation stack
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    [navigation, onLocationSelect, setDeliveryLocation]
  );

  // Handle back button
  const handleBackPress = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  // Open location search
  const handleOpenLocationSearch = useCallback(() => {
    // This would open a modal or navigate to a search screen
    console.log('Open location search');
  }, []);

  return (
    <View style={styles.container}>
      {/* Status bar spacing */}
      <View style={[styles.statusBarSpacer, { height: insets.top }]} />
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <SafeAreaView style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Select Location</Text>

          <TouchableOpacity
            style={styles.searchBar}
            onPress={handleOpenLocationSearch}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={18} color={COLORS.textSecondary} />
            <Text style={styles.searchBarText}>Search for a location...</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Full screen map */}
      <MapView
        style={styles.map}
        initialRegion={mapRegion}
        region={mapRegion}
        provider="google"
        customMapStyle={GOOGLE_MAPS_CONFIG.mapStyle}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        pitchEnabled={true}
        rotateEnabled={true}
        zoomEnabled={true}
        scrollEnabled={true}
        mapType="standard"
        loadingEnabled={true}
        loadingIndicatorColor={COLORS.primary}
        moveOnMarkerPress={false}
        onMapReady={() => {
          console.log('Map is ready');
          setMapReady(true);
        }}
      >
        {/* Delivery zones as circles */}
        {mapReady &&
          GOOGLE_MAPS_CONFIG.deliveryZones.map((zone, index) => (
            <React.Fragment key={`zone_${index}`}>
              {/* Zone circle overlay */}
              <Circle
                center={zone.center}
                radius={zone.radius * 1000} // Convert km to meters
                strokeColor={zone.specialPricing ? '#000000' : '#333333'}
                strokeWidth={1}
                fillColor={
                  zone.specialPricing
                    ? 'rgba(0, 0, 0, 0.05)'
                    : 'rgba(0, 0, 0, 0.03)'
                }
              />

              {/* Zone center marker */}
              <Marker
                coordinate={zone.center}
                title={zone.name}
                description={
                  zone.specialPricing
                    ? 'Special delivery area'
                    : 'Delivery available'
                }
                pinColor="#000000"
              />
            </React.Fragment>
          ))}

        {/* Current delivery location marker */}
        {deliveryLocation?.coordinate && (
          <Marker
            coordinate={deliveryLocation.coordinate}
            title={deliveryLocation.title}
            description={deliveryLocation.subtitle || ''}
            pinColor="#000000"
          >
            <View style={styles.markerContainer}>
              <Ionicons name="location" size={32} color="#000000" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Bottom action bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 },
        ]}
      >
        <TouchableOpacity
          style={styles.useLocationButton}
          onPress={() => {
            const selectedLocation = deliveryLocation || {
              id: 'current_map_location',
              title: 'Selected Location',
              coordinate: {
                latitude: mapRegion.latitude,
                longitude: mapRegion.longitude,
              },
            };
            handleLocationSelect(selectedLocation);
          }}
        >
          <Text style={styles.useLocationButtonText}>Use This Location</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={async () => {
            const currentLocation =
              await GoogleMapsService.getCurrentLocation();
            if (currentLocation?.coordinate) {
              setMapRegion({
                latitude: currentLocation.coordinate.latitude,
                longitude: currentLocation.coordinate.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              });
              handleLocationSelect(currentLocation);
            }
          }}
        >
          <Ionicons name="locate" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  statusBarSpacer: {
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  headerContainer: {
    backgroundColor: COLORS.card,
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    ...SHADOWS.light,
  },
  headerContent: {
    marginTop: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'left',
    paddingLeft: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchBarText: {
    fontSize: 16,
    color: COLORS.placeholder,
    marginLeft: 8,
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    top: Platform.OS === 'ios' ? 140 : 160, // Adjust for header height
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
    marginBottom: 8,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    paddingTop: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.medium,
  },
  useLocationButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  useLocationButtonText: {
    color: COLORS.card,
    fontSize: 16,
    fontWeight: '600',
  },
  currentLocationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LocationPickerScreen;
