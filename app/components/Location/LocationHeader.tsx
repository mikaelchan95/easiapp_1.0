import React, { useRef, useReducer, useState } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  StyleSheet, 
  Animated,
  ActivityIndicator,
  AccessibilityInfo
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { LocationHeaderProps } from '../../types/location';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import * as Animations from '../../utils/animations';

// Component for reduced motion accessibility
const useReducedMotion = () => {
  const [reducedMotion, setReducedMotion] = useReducer(() => {
    // In a real app, this would check the OS accessibility settings
    return false; // For now, defaulting to false
  }, false);
  
  return reducedMotion;
};

const LocationHeader: React.FC<LocationHeaderProps> = ({
  currentLocation,
  onPress,
  isLoading = false,
  inHeaderNav = false
}) => {
  // Animation values
  const scaleValue = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const arrowRotation = useRef(new Animated.Value(0)).current;
  const [arrowFlipped, setArrowFlipped] = useState(false);
  
  const reducedMotion = useReducedMotion();

  // Handle press in - apply dark overlay and scale down
  const handlePressIn = async () => {
    try {
      // Provide immediate haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics might not be available on all devices
    }

    if (reducedMotion) {
      // Simple fade for reduced motion
      Animated.timing(overlayOpacity, {
        toValue: 0.15,
        duration: 200,
        useNativeDriver: true
      }).start();
    } else {
      // Full animation with scale and overlay
      Animated.parallel([
        Animated.timing(scaleValue, {
          toValue: 0.98,
          duration: Animations.DURATION.short,
          easing: Animations.TIMING.easeOut,
          useNativeDriver: true
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.15,
          duration: Animations.DURATION.short,
          easing: Animations.TIMING.easeOut,
          useNativeDriver: true
        })
      ]).start();
    }
  };

  // Handle press out - remove overlay and scale back
  const handlePressOut = () => {
    if (reducedMotion) {
      // Simple fade for reduced motion
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    } else {
      // Full animation
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 5,
          tension: 300,
          useNativeDriver: true
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 100,
          easing: Animations.TIMING.easeOut,
          useNativeDriver: true
        })
      ]).start();
    }
  };

  // Handle the actual press event
  const handlePress = () => {
    // Animate arrow flip
    if (!reducedMotion) {
      setArrowFlipped(!arrowFlipped);
      Animated.spring(arrowRotation, {
        toValue: arrowFlipped ? 0 : 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true
      }).start();
    }
    
    // Call the onPress handler
    onPress();
    
    // Announce to screen readers
    AccessibilityInfo.announceForAccessibility('Opening location picker');
  };

  // Calculate arrow rotation interpolation
  const arrowRotationInterpolation = arrowRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  return (
    <Animated.View 
      style={[
        styles.container,
        inHeaderNav ? styles.inHeaderContainer : null,
        {
          transform: [{ scale: scaleValue }]
        }
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[styles.pressable, inHeaderNav ? styles.inHeaderPressable : null]}
        accessibilityRole="button"
        accessibilityLabel={`Current delivery location: ${currentLocation}. Tap to change location.`}
        accessibilityHint="Opens location picker to select a new delivery address"
        accessible={true}
      >
        <View style={[styles.content, inHeaderNav ? styles.inHeaderContent : null]}>
          {/* Location icon */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name="location" 
              size={inHeaderNav ? 18 : 20} 
              color={COLORS.primary} 
            />
          </View>
          
          {/* Location text */}
          <View style={styles.textContainer}>
            <Text style={[styles.label, inHeaderNav ? styles.inHeaderLabel : null]}>Deliver to</Text>
            <Text style={[styles.location, inHeaderNav ? styles.inHeaderLocation : null]} numberOfLines={1}>
              {currentLocation}
            </Text>
          </View>
          
          {/* Right side - loading or arrow */}
          <View style={styles.rightContainer}>
            {isLoading ? (
              <ActivityIndicator 
                size="small" 
                color={COLORS.primary}
                accessibilityLabel="Loading current location"
              />
            ) : (
              <Animated.View
                style={{
                  transform: [{ rotate: arrowRotationInterpolation }]
                }}
              >
                <Ionicons 
                  name="chevron-down" 
                  size={inHeaderNav ? 18 : 20} 
                  color={COLORS.textSecondary}
                />
              </Animated.View>
            )}
          </View>
        </View>
        
        {/* Touch feedback overlay */}
        <Animated.View 
          style={[
            styles.overlay,
            {
              opacity: overlayOpacity
            }
          ]}
          pointerEvents="none"
        />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    ...SHADOWS.light,
    marginBottom: SPACING.sm
  },
  inHeaderContainer: {
    marginBottom: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0
  },
  pressable: {
    minHeight: 56, // Increased height for better visibility
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative'
  },
  inHeaderPressable: {
    minHeight: 40
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4, // Increased padding for better visibility
    minHeight: 56 // Ensuring minimum height
  },
  inHeaderContent: {
    paddingVertical: SPACING.xs,
    minHeight: 40
  },
  iconContainer: {
    marginRight: SPACING.sm,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  textContainer: {
    flex: 1,
    marginRight: SPACING.sm
  },
  label: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
    fontSize: 13, // Slightly larger
    fontWeight: '500' // Medium weight for better visibility
  },
  inHeaderLabel: {
    fontSize: 11
  },
  location: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    fontSize: 16 // Slightly larger
  },
  inHeaderLocation: {
    fontSize: 14
  },
  rightContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 12
  }
});

export default LocationHeader;