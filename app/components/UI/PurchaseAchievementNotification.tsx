import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
  InteractionManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING } from '../../utils/theme';
import { HapticFeedback } from '../../utils/haptics';

interface PurchaseAchievementNotificationProps {
  visible: boolean;
  orderTotal: number;
  pointsEarned: number;
  savingsAmount?: number;
  onDismiss: () => void;
  onViewOrder: () => void;
}

const PurchaseAchievementNotification: React.FC<
  PurchaseAchievementNotificationProps
> = ({
  visible,
  orderTotal,
  pointsEarned,
  savingsAmount = 0,
  onDismiss,
  onViewOrder,
}) => {
  const insets = useSafeAreaInsets();

  // Animation values
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  // Timer ref
  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  // Create smooth entrance animation
  const showAnimation = useCallback(() => {
    // Haptic feedback
    HapticFeedback.success();

    // Icon bounce animation
    Animated.sequence([
      Animated.timing(iconScale, {
        toValue: 1.3,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Main entrance animation
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity, scale, iconScale]);

  // Create smooth exit animation
  const hideAnimation = useCallback(
    (callback?: () => void) => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 250,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.95,
          duration: 250,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished && callback) {
          callback();
        }
      });
    },
    [translateY, opacity, scale]
  );

  // Handle view order with smooth transition
  const handleViewOrder = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    HapticFeedback.light();

    hideAnimation(() => {
      onDismiss();
      onViewOrder();
    });
  }, [hideAnimation, onDismiss, onViewOrder]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    hideAnimation(() => {
      onDismiss();
    });
  }, [hideAnimation, onDismiss]);

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      // Reset animation values
      translateY.setValue(-100);
      opacity.setValue(0);
      scale.setValue(0.95);
      iconScale.setValue(1);

      // Use InteractionManager to ensure smooth animations
      const handle = InteractionManager.runAfterInteractions(() => {
        showAnimation();
      });

      // Set auto-hide timer
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }

      hideTimer.current = setTimeout(() => {
        handleDismiss();
      }, 4000);

      return () => {
        handle.cancel();
      };
    }

    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [visible, showAnimation, handleDismiss]);

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  // Generate message (memoized)
  const message = React.useMemo(() => {
    return `Order complete • +${pointsEarned} points`;
  }, [pointsEarned]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Icon with animated scale */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: iconScale }],
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={24} color={COLORS.text} />
        </Animated.View>

        {/* Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.message} numberOfLines={1}>
            {message}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={handleViewOrder}
            activeOpacity={0.7}
          >
            <Text style={styles.viewButtonText}>View Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10000,
    paddingHorizontal: SPACING.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messageContainer: {
    flex: 1,
    marginRight: 12,
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  viewButtonText: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(PurchaseAchievementNotification);
