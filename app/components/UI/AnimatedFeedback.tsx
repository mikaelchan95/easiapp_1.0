import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../utils/theme';
import * as Animations from '../../utils/animations';

interface AnimatedFeedbackProps {
  visible: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'loading' | 'streak' | 'levelUp';
  duration?: number;
  position?: 'top' | 'bottom';
  onHide?: () => void;
  showCartAnimation?: boolean;
  streakCount?: number;
  progressValue?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

const { width } = Dimensions.get('window');

const AnimatedFeedback: React.FC<AnimatedFeedbackProps> = ({
  visible,
  message,
  type,
  duration = 2000,
  position = 'bottom',
  onHide,
  showCartAnimation = false,
  streakCount = 0,
  progressValue = 0,
  action,
}) => {
  // Animation values
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const cartBounce = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  // Create a separate animated value for JS-driven animations
  const jsProgressAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Track actual visibility state
  const [isVisible, setIsVisible] = useState(false);

  // Hide timer ref
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      setIsVisible(true);

      // Clear any existing hide timer
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          easing: Animations.TIMING.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          easing: Animations.TIMING.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 300,
          easing: Animations.TIMING.easeOut,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate cart bounce if this is a success type and cart animation is enabled
      if ((type === 'success' || type === 'streak') && showCartAnimation) {
        Animations.heartbeatAnimation(cartBounce);
      }

      // Animate progress bar if available
      if (progressValue > 0) {
        jsProgressAnim.setValue(0);
        Animated.timing(jsProgressAnim, {
          toValue: Math.min(progressValue, 1),
          duration: 800,
          easing: Animations.TIMING.easeOut,
          useNativeDriver: false,
        }).start();
      }

      // Animate rotation for streak/level up
      if (type === 'streak' || type === 'levelUp') {
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          easing: Animations.TIMING.easeInOut,
          useNativeDriver: true,
        }).start();
      }

      // Set hide timer (not for loading type)
      if (type !== 'loading') {
        hideTimerRef.current = setTimeout(() => {
          hideAnimation();
        }, duration);
      }
    } else {
      // Hide animation
      hideAnimation();
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [visible, type, showCartAnimation, progressValue]);

  // Hide animation function
  const hideAnimation = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 200,
        easing: Animations.TIMING.easeIn,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        easing: Animations.TIMING.easeIn,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsVisible(false);
        if (onHide) {
          onHide();
        }
      }
    });
  };

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'success':
        if (showCartAnimation) {
          return (
            <Animated.View style={{ transform: [{ scale: cartBounce }] }}>
              <Ionicons name="cart" size={24} color="#4CAF50" />
            </Animated.View>
          );
        }
        return <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />;
      case 'error':
        return <Ionicons name="alert-circle" size={24} color="#D32F2F" />;
      case 'info':
        return <Ionicons name="information-circle" size={24} color="#2196F3" />;
      case 'loading':
        return <AnimatedLoader />;
      case 'streak':
        return (
          <Animated.View
            style={{
              transform: [
                { scale: cartBounce },
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            }}
          >
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥</Text>
            </View>
          </Animated.View>
        );
      case 'levelUp':
        return (
          <Animated.View
            style={{
              transform: [
                { scale: cartBounce },
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            }}
          >
            <View style={styles.levelUpBadge}>
              <Ionicons name="star" size={20} color="#FFFFFF" />
            </View>
          </Animated.View>
        );
    }
  };

  // Get background color based on type
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#E8F5E9';
      case 'error':
        return '#FFEBEE';
      case 'info':
        return '#E3F2FD';
      case 'loading':
        return '#F5F5F5';
      case 'streak':
        return '#8C0044'; // Deep pink for streaks
      case 'levelUp':
        return '#4A148C'; // Deep purple for level ups
    }
  };

  // Animated loading spinner
  const AnimatedLoader = () => {
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Animations.TIMING.easeInOut,
          useNativeDriver: true,
        })
      ).start();
    }, []);

    const spin = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <View style={styles.loaderCircle} />
      </Animated.View>
    );
  };

  if (!visible && !isVisible) {
    return null;
  }

  const isSpecialType = type === 'streak' || type === 'levelUp';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          transform: [{ translateY: translateY }, { scale: scale }],
          opacity: opacity,
          ...(position === 'top' ? styles.topPosition : styles.bottomPosition),
        },
        isSpecialType && styles.specialContainer,
      ]}
    >
      <View style={styles.iconContainer}>{getIcon()}</View>
      <View style={styles.contentContainer}>
        <Text style={[styles.message, isSpecialType && styles.specialMessage]}>
          {message}
        </Text>

        {/* Progress bar if needed */}
        {progressValue > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: jsProgressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                  isSpecialType && styles.specialProgressFill,
                ]}
              />
            </View>
            {streakCount > 0 && (
              <Text
                style={[
                  styles.progressText,
                  isSpecialType && styles.specialProgressText,
                ]}
              >
                Streak: {streakCount}x
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Action button if provided */}
      {action && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={action.onPress}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.actionText,
              isSpecialType && styles.specialActionText,
            ]}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    maxWidth: width - 32,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
    zIndex: 9999,
  },
  specialContainer: {
    paddingVertical: 20,
  },
  topPosition: {
    top: 20,
  },
  bottomPosition: {
    bottom: 20,
  },
  iconContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  specialMessage: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  loaderCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderTopColor: '#2196F3',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  specialProgressFill: {
    backgroundColor: '#FFFFFF',
  },
  progressText: {
    fontSize: 12,
    color: COLORS.inactive,
    marginTop: 4,
  },
  specialProgressText: {
    color: 'rgba(255,255,255,0.8)',
  },
  streakBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 16,
  },
  levelUpBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#673AB7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#007AFF',
  },
  specialActionText: {
    color: '#FFFFFF',
  },
});

export default AnimatedFeedback;
