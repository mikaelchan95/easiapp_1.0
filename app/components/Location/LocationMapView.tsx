import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, Region, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

import { LocationMapViewProps, LocationCoordinate } from '../../types/location';
import { COLORS, SHADOWS } from '../../utils/theme';
import { GOOGLE_MAPS_CONFIG } from '../../config/googleMaps';

const { width, height } = Dimensions.get('window');

const LocationMapView: React.FC<LocationMapViewProps> = ({
  region,
  onRegionChange,
  onPinDrop,
  selectedCoordinate
}) => {
  const mapRef = useRef<MapView>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>(region);
  const [mapError, setMapError] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationCoordinate | null>(null);

  // Request location permissions and get user location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions to use the map.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  // Handle region change
  const handleRegionChange = useCallback((newRegion: Region) => {
    setCurrentRegion(newRegion);
    if (onRegionChange) {
      onRegionChange(newRegion);
    }
  }, [onRegionChange]);

  // Handle map press to drop pin
  const handleMapPress = useCallback(async (event: any) => {
    const coordinate: LocationCoordinate = {
      latitude: event.nativeEvent.coordinate.latitude,
      longitude: event.nativeEvent.coordinate.longitude,
    };

    // Provide haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptics might not be available on all devices
    }

    if (onPinDrop) {
      onPinDrop(coordinate);
    }
  }, [onPinDrop]);

  // Handle zoom to current location
  const handleZoomToLocation = useCallback(() => {
    if (userLocation && mapRef.current) {
      const newRegion: Region = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  }, [userLocation]);

  // Handle map error
  const handleMapError = useCallback((error: any) => {
    console.error('Map error:', error);
    setMapError(true);
  }, []);

  // Fallback UI when map fails to load
  if (mapError) {
    return (
      <View style={styles.fallbackContainer}>
        <Ionicons name="map-outline" size={48} color={COLORS.textSecondary} />
        <Text style={styles.fallbackTitle}>Map Unavailable</Text>
        <Text style={styles.fallbackText}>
          Unable to load the map. Please check your internet connection and try again.
        </Text>
        <TouchableOpacity 
          style={styles.fallbackButton}
          onPress={() => setMapError(false)}
        >
          <Text style={styles.fallbackButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isMapReady && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}
      
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        region={currentRegion}
        onRegionChange={handleRegionChange}
        onPress={handleMapPress}
        provider={PROVIDER_GOOGLE}
        customMapStyle={GOOGLE_MAPS_CONFIG.mapStyle}
        showsUserLocation={true}
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
          setIsMapReady(true);
        }}
        onError={handleMapError}
      >
        {/* Delivery zones as circles */}
        {isMapReady && GOOGLE_MAPS_CONFIG.deliveryZones.map((zone, index) => (
          <React.Fragment key={`zone_${index}`}>
            {/* Zone circle overlay */}
            <Circle
              center={zone.center}
              radius={zone.radius * 1000} // Convert km to meters
              strokeColor={zone.specialPricing ? '#4CAF50' : '#2196F3'}
              strokeWidth={2}
              fillColor={zone.specialPricing ? 'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)'}
            />
            
            {/* Zone center marker */}
            <Marker
              coordinate={zone.center}
              title={zone.name}
              description={zone.specialPricing ? 'Special delivery area' : 'Delivery available'}
              pinColor={zone.specialPricing ? '#4CAF50' : '#2196F3'}
            />
          </React.Fragment>
        ))}

        {/* Selected location marker */}
        {selectedCoordinate && (
          <Marker
            coordinate={selectedCoordinate}
            title="Selected Location"
            description="Tap to confirm this location"
            pinColor="#FF5722"
          >
            <View style={styles.selectedMarker}>
              <Ionicons name="location" size={32} color="#FF5722" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Map controls overlay */}
      <View style={styles.controlsOverlay}>
        {/* My Location Button */}
        <TouchableOpacity 
          style={styles.myLocationButton}
          onPress={handleZoomToLocation}
          disabled={!userLocation}
        >
          <Ionicons 
            name="locate" 
            size={24} 
            color={userLocation ? COLORS.primary : COLORS.textSecondary} 
          />
        </TouchableOpacity>
      </View>

      {/* Instructions overlay */}
      <View style={styles.instructionsOverlay}>
        <View style={styles.instructionCard}>
          <Ionicons name="information-circle" size={16} color={COLORS.primary} />
          <View style={styles.instructionText}>
            <Text style={styles.instructionTitle}>Tap anywhere to drop a pin</Text>
            <Text style={styles.instructionSubtitle}>Blue areas show delivery zones</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0', // Light gray background that won't interfere with map
  },
  map: {
    width: width,
    height: height * 0.6, // 60% of screen height
    backgroundColor: 'transparent', // Ensure map background is transparent
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  fallbackContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fallbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  fallbackText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  fallbackButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  fallbackButtonText: {
    color: COLORS.card,
    fontWeight: '600',
    fontSize: 16,
  },
  controlsOverlay: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    alignItems: 'flex-end',
  },
  myLocationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    ...SHADOWS.medium,
  },
  instructionsOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    ...SHADOWS.light,
  },
  instructionText: {
    marginLeft: 8,
    flex: 1,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  instructionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  selectedMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LocationMapView;