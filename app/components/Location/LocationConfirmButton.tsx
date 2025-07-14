import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import { LocationConfirmButtonProps } from '../../types/location';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import * as Animations from '../../utils/animations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUTTON_WIDTH = SCREEN_WIDTH - SPACING.md * 2; // Account for horizontal margins
const SWIPE_THRESHOLD = BUTTON_WIDTH * 0.7; // 70% swipe to confirm

const LocationConfirmButton: React.FC<LocationConfirmButtonProps> = ({
  onConfirm,
  selectedLocation,
  disabled = false,
}) => {
  // Animation values
  const slideTranslateX = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(1)).current;

  // Gesture handlers for swipe-to-confirm
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: slideTranslateX } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = useCallback(
    (event: any) => {
      if (event.nativeEvent.oldState === State.ACTIVE) {
        const { translationX, velocityX } = event.nativeEvent;

        // Check if swipe threshold is met
        const shouldConfirm =
          translationX > SWIPE_THRESHOLD ||
          (translationX > SWIPE_THRESHOLD * 0.5 && velocityX > 500);

        if (shouldConfirm && !disabled) {
          // Provide success haptic feedback
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (error) {
            // Haptics might not be available on all devices
          }

          // Animate button sliding off screen
          Animated.parallel([
            Animated.timing(slideTranslateX, {
              toValue: BUTTON_WIDTH,
              duration: Animations.DURATION.medium,
              easing: Animations.TIMING.easeIn,
              useNativeDriver: false,
            }),
            Animated.timing(backgroundOpacity, {
              toValue: 0,
              duration: Animations.DURATION.medium,
              easing: Animations.TIMING.easeIn,
              useNativeDriver: true,
            }),
            Animated.spring(successScale, {
              toValue: 1,
              friction: 6,
              tension: 100,
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Call confirm callback after animation
            setTimeout(() => {
              onConfirm();
              // Reset animation values
              slideTranslateX.setValue(0);
              backgroundOpacity.setValue(1);
              successScale.setValue(0);
            }, 100);
          });
        } else {
          // Spring back to original position
          Animated.spring(slideTranslateX, {
            toValue: 0,
            friction: 8,
            tension: 100,
            useNativeDriver: false,
          }).start();
        }
      }
    },
    [slideTranslateX, backgroundOpacity, successScale, onConfirm, disabled]
  );

  // Handle regular tap
  const handlePress = useCallback(async () => {
    if (disabled) return;

    // Provide haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptics might not be available on all devices
    }

    onConfirm();
  }, [onConfirm, disabled]);

  // Handle press in/out for scale feedback
  const handlePressIn = useCallback(() => {
    if (disabled) return;

    Animated.timing(buttonScale, {
      toValue: 0.98,
      duration: Animations.DURATION.short,
      easing: Animations.TIMING.easeOut,
      useNativeDriver: true,
    }).start();
  }, [buttonScale, disabled]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;

    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  }, [buttonScale, disabled]);

  // Calculate slider progress for visual feedback
  const sliderProgress = slideTranslateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const sliderOpacity = slideTranslateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD * 0.5, SWIPE_THRESHOLD],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp',
  });

  const arrowOpacity = slideTranslateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD * 0.3],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Success animation overlay */}
      <Animated.View
        style={[
          styles.successOverlay,
          {
            transform: [{ scale: successScale }],
            opacity: successScale,
          },
        ]}
      >
        <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
        <Text style={styles.successText}>Location Confirmed!</Text>
      </Animated.View>

      {/* Main button container */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: backgroundOpacity,
            transform: [{ scale: buttonScale }],
          },
        ]}
      >
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          enabled={!disabled}
        >
          <Animated.View
            style={[
              styles.button,
              {
                backgroundColor: disabled ? COLORS.inactive : COLORS.primary,
                transform: [{ translateX: slideTranslateX }],
              },
            ]}
          >
            <Pressable
              onPress={handlePress}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={styles.pressable}
              disabled={disabled}
              accessibilityLabel={
                selectedLocation
                  ? `Confirm location: ${selectedLocation.title}`
                  : 'Confirm location'
              }
              accessibilityHint="Tap to confirm or swipe right to confirm with gesture"
              accessibilityRole="button"
            >
              {/* Background progress indicator */}
              <Animated.View
                style={[
                  styles.progressBackground,
                  {
                    opacity: sliderProgress,
                  },
                ]}
              />

              <View style={styles.buttonContent}>
                {/* Left content */}
                <View style={styles.leftContent}>
                  <Animated.View style={{ opacity: arrowOpacity }}>
                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color={COLORS.card}
                    />
                  </Animated.View>
                </View>

                {/* Center text */}
                <Animated.View
                  style={[styles.centerContent, { opacity: sliderOpacity }]}
                >
                  <Text style={styles.buttonText}>
                    {disabled
                      ? 'Select a location'
                      : selectedLocation
                        ? `Confirm ${selectedLocation.title}`
                        : 'Confirm Location'}
                  </Text>
                  {!disabled && (
                    <Text style={styles.buttonSubtext}>
                      Tap or swipe right →
                    </Text>
                  )}
                </Animated.View>

                {/* Right content */}
                <View style={styles.rightContent}>
                  <Animated.View style={{ opacity: arrowOpacity }}>
                    <Ionicons name="checkmark" size={20} color={COLORS.card} />
                  </Animated.View>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>

      {/* Swipe instruction */}
      {!disabled && (
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            Swipe right to confirm quickly
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    zIndex: 10,
  },
  successText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.success,
    marginTop: SPACING.xs,
  },
  buttonContainer: {
    position: 'relative',
  },
  button: {
    height: 56,
    borderRadius: 28,
    ...SHADOWS.medium,
    overflow: 'hidden',
  },
  pressable: {
    flex: 1,
    position: 'relative',
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.success,
  },
  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  leftContent: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: SPACING.sm,
  },
  rightContent: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.card,
    textAlign: 'center',
  },
  buttonSubtext: {
    ...TYPOGRAPHY.small,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  instructionContainer: {
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  instructionText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default LocationConfirmButton;
