import React, { useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { LocationSearchFieldProps } from '../../types/location';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import * as Animations from '../../utils/animations';

const LocationSearchField: React.FC<LocationSearchFieldProps> = ({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search address or place',
  autoFocus = false,
}) => {
  // Refs
  const inputRef = useRef<TextInput>(null);
  const clearButtonScale = useRef(new Animated.Value(1)).current;
  const clearButtonOpacity = useRef(new Animated.Value(0)).current;
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  // Auto-focus effect
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      // Small delay to ensure the bottom sheet is fully rendered
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Clear button visibility effect
  useEffect(() => {
    if (value.length > 0) {
      Animated.timing(clearButtonOpacity, {
        toValue: 1,
        duration: Animations.DURATION.short,
        easing: Animations.TIMING.easeOut,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(clearButtonOpacity, {
        toValue: 0,
        duration: Animations.DURATION.short,
        easing: Animations.TIMING.easeIn,
        useNativeDriver: true,
      }).start();
    }
  }, [value, clearButtonOpacity]);

  // Handle clear button press
  const handleClearPress = async () => {
    // Provide haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics might not be available on all devices
    }

    // Start ripple animation
    rippleScale.setValue(0);
    rippleOpacity.setValue(0.3);

    Animated.parallel([
      Animated.timing(rippleScale, {
        toValue: 1,
        duration: 200,
        easing: Animations.TIMING.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: 200,
        easing: Animations.TIMING.easeOut,
        useNativeDriver: true,
      }),
    ]).start();

    // Text fade-out animation
    Animated.timing(clearButtonOpacity, {
      toValue: 0,
      duration: 150,
      easing: Animations.TIMING.easeOut,
      useNativeDriver: true,
    }).start(() => {
      onClear();
      // Focus back on input after clearing
      inputRef.current?.focus();
    });
  };

  // Handle clear button press in/out for scale feedback
  const handleClearPressIn = () => {
    Animated.timing(clearButtonScale, {
      toValue: 0.9,
      duration: Animations.DURATION.short,
      easing: Animations.TIMING.easeOut,
      useNativeDriver: true,
    }).start();
  };

  const handleClearPressOut = () => {
    Animated.spring(clearButtonScale, {
      toValue: 1,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        {/* Search icon */}
        <View style={styles.searchIcon}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} />
        </View>

        {/* Text input */}
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="search"
          clearButtonMode="never" // We'll handle this with our custom button
          accessibilityLabel="Search for location"
          accessibilityHint="Type to search for addresses and places"
        />

        {/* Clear button with ripple effect */}
        {value.length > 0 && (
          <View style={styles.clearButtonContainer}>
            {/* Ripple effect background */}
            <Animated.View
              style={[
                styles.ripple,
                {
                  transform: [{ scale: rippleScale }],
                  opacity: rippleOpacity,
                },
              ]}
            />

            {/* Clear button */}
            <Animated.View
              style={[
                {
                  opacity: clearButtonOpacity,
                  transform: [{ scale: clearButtonScale }],
                },
              ]}
            >
              <Pressable
                onPress={handleClearPress}
                onPressIn={handleClearPressIn}
                onPressOut={handleClearPressOut}
                style={styles.clearButton}
                accessibilityLabel="Clear search"
                accessibilityRole="button"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} // Expand hit area
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={COLORS.textSecondary}
                />
              </Pressable>
            </Animated.View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 48, // Ensuring accessibility tap target
    position: 'relative',
  },
  searchIcon: {
    marginRight: SPACING.sm,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    paddingVertical: 0, // Remove default padding to maintain height control
    minHeight: 24, // Ensure input has minimum height for touch targets
  },
  clearButtonContainer: {
    position: 'relative',
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  ripple: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  clearButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
});

export default LocationSearchField;
