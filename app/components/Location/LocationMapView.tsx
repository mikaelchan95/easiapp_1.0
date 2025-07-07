import React, { useRef, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated,
  Text,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, PinchGestureHandler, RotationGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { LocationMapViewProps, LocationCoordinate } from '../../types/location';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import * as Animations from '../../utils/animations';

// Mock map component (in a real app, you'd use react-native-maps or similar)
const MockMapView: React.FC<{
  region: any;
  onRegionChange: (region: any) => void;
  onPinDrop: (coordinate: LocationCoordinate) => void;
  selectedCoordinate?: LocationCoordinate;
}> = ({ region, onRegionChange, onPinDrop, selectedCoordinate }) => {
  const mapScale = useRef(new Animated.Value(1)).current;
  const mapRotation = useRef(new Animated.Value(0)).current;
  const mapTranslateX = useRef(new Animated.Value(0)).current;
  const mapTranslateY = useRef(new Animated.Value(0)).current;
  const pinScale = useRef(new Animated.Value(1)).current;
  const pinBounce = useRef(new Animated.Value(0)).current;

  // Handle pan gesture for map movement
  const onPanGestureEvent = Animated.event(
    [{ 
      nativeEvent: { 
        translationX: mapTranslateX,
        translationY: mapTranslateY
      } 
    }],
    { useNativeDriver: true }
  );

  const onPanHandlerStateChange = useCallback((event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Simulate pin drop on pan end
      const { translationX, translationY } = event.nativeEvent;
      
      // Create a coordinate based on translation (mock calculation)
      const newCoordinate: LocationCoordinate = {
        latitude: region.latitude + (translationY * 0.0001),
        longitude: region.longitude + (translationX * 0.0001)
      };

      // Provide haptic feedback for pin drop
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        // Haptics might not be available on all devices
      }

      // Animate pin bounce effect
      pinBounce.setValue(0);
      Animated.sequence([
        Animated.timing(pinBounce, {
          toValue: 1.1,
          duration: 150,
          easing: Animations.TIMING.easeOut,
          useNativeDriver: true
        }),
        Animated.timing(pinBounce, {
          toValue: 0.9,
          duration: 100,
          easing: Animations.TIMING.easeInOut,
          useNativeDriver: true
        }),
        Animated.timing(pinBounce, {
          toValue: 1,
          duration: 100,
          easing: Animations.TIMING.easeOut,
          useNativeDriver: true
        })
      ]).start();

      // Reset map position
      Animated.spring(mapTranslateX, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true
      }).start();
      
      Animated.spring(mapTranslateY, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true
      }).start();

      // Call pin drop callback
      onPinDrop(newCoordinate);
    }
  }, [mapTranslateX, mapTranslateY, pinBounce, region, onPinDrop]);

  // Handle pinch gesture for zoom
  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: mapScale } }],
    { useNativeDriver: true }
  );

  const onPinchHandlerStateChange = useCallback((event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Snap to reasonable zoom levels
      const scale = event.nativeEvent.scale;
      let targetScale = 1;
      
      if (scale > 1.5) targetScale = 2;
      else if (scale < 0.7) targetScale = 0.5;
      
      Animated.spring(mapScale, {
        toValue: targetScale,
        friction: 8,
        tension: 100,
        useNativeDriver: true
      }).start();
    }
  }, [mapScale]);

  // Handle rotation gesture
  const onRotationGestureEvent = Animated.event(
    [{ nativeEvent: { rotation: mapRotation } }],
    { useNativeDriver: true }
  );

  const onRotationHandlerStateChange = useCallback((event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // Snap to cardinal directions
      const rotation = event.nativeEvent.rotation;
      let targetRotation = 0;
      
      if (Math.abs(rotation) > Math.PI / 4) {
        targetRotation = rotation > 0 ? Math.PI / 2 : -Math.PI / 2;
      }
      
      Animated.spring(mapRotation, {
        toValue: targetRotation,
        friction: 8,
        tension: 100,
        useNativeDriver: true
      }).start();
    }
  }, [mapRotation]);

  return (
    <View style={styles.mapContainer}>
      <RotationGestureHandler
        onGestureEvent={onRotationGestureEvent}
        onHandlerStateChange={onRotationHandlerStateChange}
      >
        <PinchGestureHandler
          onGestureEvent={onPinchGestureEvent}
          onHandlerStateChange={onPinchHandlerStateChange}
        >
          <PanGestureHandler
            onGestureEvent={onPanGestureEvent}
            onHandlerStateChange={onPanHandlerStateChange}
            minPointers={1}
            maxPointers={1}
          >
            <Animated.View
              style={[
                styles.mapBackground,
                {
                  transform: [
                    { scale: mapScale },
                    { rotate: mapRotation },
                    { translateX: mapTranslateX },
                    { translateY: mapTranslateY }
                  ]
                }
              ]}
            >
              {/* Mock map grid */}
              <View style={styles.mapGrid}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <View key={`h-${i}`} style={[styles.gridLine, { top: `${i * 10}%` }]} />
                ))}
                {Array.from({ length: 10 }).map((_, i) => (
                  <View key={`v-${i}`} style={[styles.gridLine, styles.vertical, { left: `${i * 10}%` }]} />
                ))}
              </View>

              {/* Mock locations */}
              <View style={[styles.mockLocation, { top: '30%', left: '40%' }]}>
                <View style={styles.locationDot} />
                <Text style={styles.locationLabel}>Marina Bay</Text>
              </View>
              
              <View style={[styles.mockLocation, { top: '60%', left: '70%' }]}>
                <View style={styles.locationDot} />
                <Text style={styles.locationLabel}>Gardens</Text>
              </View>
            </Animated.View>
          </PanGestureHandler>
        </PinchGestureHandler>
      </RotationGestureHandler>

      {/* Center pin */}
      <Animated.View
        style={[
          styles.centerPin,
          {
            transform: [{ scale: pinBounce }]
          }
        ]}
      >
        <View style={styles.pinShadow} />
        <Ionicons name="location" size={32} color={COLORS.primary} />
      </Animated.View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsText}>Drag to move the pin</Text>
        <Text style={styles.instructionsSubtext}>Pinch to zoom • Rotate with two fingers</Text>
      </View>
    </View>
  );
};

const LocationMapView: React.FC<LocationMapViewProps> = ({
  region,
  onRegionChange,
  onPinDrop,
  selectedCoordinate
}) => {
  const resetZoom = useCallback(async () => {
    // Provide haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics might not be available on all devices
    }
    
    // In a real map implementation, this would reset the zoom level
    console.log('Reset zoom');
  }, []);

  const getCurrentLocation = useCallback(async () => {
    // Provide haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics might not be available on all devices
    }
    
    // In a real implementation, this would center on user location
    console.log('Get current location');
  }, []);

  return (
    <View style={styles.container}>
      <MockMapView
        region={region}
        onRegionChange={onRegionChange}
        onPinDrop={onPinDrop}
        selectedCoordinate={selectedCoordinate}
      />

      {/* Map controls */}
      <View style={styles.controlsContainer}>
        <Pressable
          style={styles.controlButton}
          onPress={getCurrentLocation}
          accessibilityLabel="Center on current location"
          accessibilityRole="button"
        >
          <Ionicons name="locate" size={20} color={COLORS.primary} />
        </Pressable>

        <Pressable
          style={styles.controlButton}
          onPress={resetZoom}
          accessibilityLabel="Reset zoom level"
          accessibilityRole="button"
        >
          <Ionicons name="contract" size={20} color={COLORS.primary} />
        </Pressable>
      </View>

      {/* Coordinate display */}
      {selectedCoordinate && (
        <View style={styles.coordinateContainer}>
          <Text style={styles.coordinateText}>
            {selectedCoordinate.latitude.toFixed(6)}, {selectedCoordinate.longitude.toFixed(6)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative'
  },
  mapContainer: {
    flex: 1,
    position: 'relative'
  },
  mapBackground: {
    flex: 1,
    backgroundColor: '#E8F5E8', // Light green map background
    position: 'relative'
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.1)',
    height: 1,
    width: '100%'
  },
  vertical: {
    width: 1,
    height: '100%'
  },
  mockLocation: {
    position: 'absolute',
    alignItems: 'center'
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginBottom: 4
  },
  locationLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.text,
    backgroundColor: COLORS.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 10,
    ...SHADOWS.light
  },
  centerPin: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -16,
    marginLeft: -16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pinShadow: {
    position: 'absolute',
    bottom: -8,
    width: 16,
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    transform: [{ scaleX: 0.8 }]
  },
  instructionsContainer: {
    position: 'absolute',
    top: SPACING.md,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    ...SHADOWS.light
  },
  instructionsText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center'
  },
  instructionsSubtext: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2
  },
  controlsContainer: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md,
    flexDirection: 'column'
  },
  controlButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.medium
  },
  coordinateContainer: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.md,
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 6,
    ...SHADOWS.light
  },
  coordinateText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontFamily: 'monospace'
  }
});

export default LocationMapView;