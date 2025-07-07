import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import MapView, { Marker, Region, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
  const handleZoomToLocation = useCallback((coordinate: LocationCoordinate) => {
    const newRegion: Region = {
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };

    if (mapRef.current) {
      mapRef.current.animateToRegion(newRegion, 1000);
    }
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        region={currentRegion}
        onRegionChange={handleRegionChange}
        onPress={handleMapPress}
        provider="google"
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
      >
        {/* Delivery zones as circles */}
        {GOOGLE_MAPS_CONFIG.deliveryZones.map((zone, index) => (
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
        <View style={styles.myLocationButton}>
          <Ionicons name="locate" size={24} color={COLORS.primary} />
        </View>
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
    backgroundColor: COLORS.background,
  },
  map: {
    width: width,
    height: height * 0.6, // 60% of screen height
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