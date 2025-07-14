import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { formatStatNumber } from '../../utils/formatting';

interface PointsEarnedToastProps {
  visible: boolean;
  points: number;
  tier?: string;
  message?: string;
  duration?: number;
  onHide?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PointsEarnedToast({
  visible,
  points,
  tier,
  message,
  duration = 3000,
  onHide,
}: PointsEarnedToastProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 10,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + SPACING.md,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="trophy" size={24} color={COLORS.accent} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            +{formatStatNumber(points)} points earned!
          </Text>
          {message ? (
            <Text style={styles.message}>{message}</Text>
          ) : tier ? (
            <Text style={styles.message}>{tier} member</Text>
          ) : null}
        </View>

        <View style={styles.celebration}>
          <Ionicons name="sparkles" size={20} color="#FFD700" />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 1000,
  },
  content: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.large,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.h4,
    color: COLORS.accent,
    marginBottom: 2,
  },
  message: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    opacity: 0.9,
  },
  celebration: {
    marginLeft: SPACING.sm,
  },
});
