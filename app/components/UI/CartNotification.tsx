import React, { useEffect, useRef, useContext, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING } from '../../utils/theme';
import * as Animations from '../../utils/animations';
import { CartNotificationContext } from '../../context/CartNotificationContext';

interface CartNotificationProps {
  visible: boolean;
  itemName?: string;
  onHide: () => void;
  duration?: number;
  onViewCart?: () => void;
}

const { width } = Dimensions.get('window');

// Separate progress bar component that handles its own animations
const ProgressBar = React.memo(({ value, total }: { value: number; total: number }) => {
  // For layout animations only (not using native driver)
  const widthAnim = useRef(new Animated.Value(0)).current;
  // For opacity/transform animations (using native driver)
  const nativeOpacityAnim = useRef(new Animated.Value(1)).current;
  
  // Calculate percentage
  const percentage = Math.min(Math.max(value / total, 0), 1);
  
  // Handle value changes
  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: percentage,
      duration: 800,
      easing: Animations.TIMING.easeOut,
      useNativeDriver: false // Must be false for layout properties
    }).start();
  }, [percentage, widthAnim]);
  
  // Create interpolated width string
  const progressWidth = widthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });
  
  return (
    <View style={styles.progressTrack}>
      <Animated.View 
        style={[
          styles.progressFill,
          { width: progressWidth }
        ]} 
      />
      
      {/* Milestone markers */}
      <View style={[styles.milestone, { left: '33%' }]} />
      <View style={[styles.milestone, { left: '66%' }]} />
    </View>
  );
});

// Give the component a display name for debugging
ProgressBar.displayName = 'ProgressBar';

// Badge animation component
const AnimatedBadge = React.memo(({ showStreak, streakCount }: { showStreak: boolean; streakCount: number }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Pre-compute rotation for better performance
  const rotation = useMemo(() => {
    return rotateAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
    });
  }, [rotateAnim]);
  
  // Start animation when visible
  useEffect(() => {
    if (showStreak) {
      // Scale animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: 300,
          easing: Animations.TIMING.emphatic,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Animations.TIMING.easeOut,
          useNativeDriver: true
        })
      ]).start();
      
      // Rotation animation
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 600,
        easing: Animations.TIMING.easeInOut,
        useNativeDriver: true
      }).start();
    } else {
      // Reset animations
      scaleAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [showStreak, scaleAnim, rotateAnim]);
  
  if (!showStreak) return null;
  
  return (
    <Animated.View style={[
      styles.streakBadgeContainer,
      {
        transform: [
          { scale: scaleAnim },
          { rotate: rotation }
        ]
      }
    ]}>
      <View style={styles.streakBadge}>
        <Text style={styles.streakText}>🔥</Text>
        <Text style={styles.streakText}>{streakCount / 3}x</Text>
      </View>
    </Animated.View>
  );
});

// Give the component a display name for debugging
AnimatedBadge.displayName = 'AnimatedBadge';

// Main cart notification component
const CartNotification: React.FC<CartNotificationProps> = React.memo(({
  visible,
  itemName,
  onHide,
  duration = 3000,
  onViewCart
}) => {
  // Get streak count from context
  const { purchaseStreak } = useContext(CartNotificationContext);
  
  // Calculate streak progress
  const showStreak = purchaseStreak > 0 && purchaseStreak % 3 === 0;
  const nextStreakValue = purchaseStreak % 3;
  const nextStreakGoal = 3 - nextStreakValue;
  
  // Animation values for the container
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  
  // Animation value for the icon bounce
  const bounceAnim = useRef(new Animated.Value(1)).current;
  
  // Hide timer ref
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Memoize the view cart handler
  const handleViewCart = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    
    // Hide first, then navigate
    hideAnimation(() => {
      if (onViewCart) {
        onViewCart();
      }
    });
  }, [onViewCart]);
  
  // Hide animation function - memoize to prevent recreation
  const hideAnimation = useCallback((callback?: () => void) => {
    // Only run if the component is mounted and visible
    if (translateY) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -100,
          duration: 200,
          easing: Animations.TIMING.easeIn,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          easing: Animations.TIMING.easeIn,
          useNativeDriver: true
        })
      ]).start(({ finished }) => {
        if (finished) {
          if (onHide) {
            onHide();
          }
          if (callback) {
            callback();
          }
        }
      });
    }
  }, [translateY, opacity, onHide]);
  
  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      // Clear any existing hide timer
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      
      // Initial bounce animation for the icon
      if (Platform.OS === 'ios') {
        Animations.heartbeatAnimation(bounceAnim);
      } else {
        // Simpler animation for Android to avoid potential issues
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.2,
            duration: 150,
            useNativeDriver: true
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true
          })
        ]).start();
      }
      
      // Show animation (with native driver)
      translateY.setValue(-100);
      opacity.setValue(0);
      scale.setValue(0.9);
      
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          easing: Animations.TIMING.easeOut,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          easing: Animations.TIMING.easeOut,
          useNativeDriver: true
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 300,
          easing: Animations.TIMING.easeOut,
          useNativeDriver: true
        })
      ]).start();
      
      // Set hide timer
      hideTimerRef.current = setTimeout(() => {
        hideAnimation();
        hideTimerRef.current = null;
      }, duration);
    }
    
    // Cleanup function
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, [visible, hideAnimation, duration, bounceAnim]);
  
  // Don't render anything if not visible
  if (!visible) {
    return null;
  }
  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [
            { translateY: translateY },
            { scale: scale }
          ],
          opacity: opacity
        }
      ]}
    >
      <View style={[
        styles.content,
        showStreak && styles.streakContent
      ]}>
        <Animated.View style={[
          styles.iconContainer, 
          { transform: [{ scale: bounceAnim }] }
        ]}>
          <Ionicons name="cart" size={24} color={COLORS.accent} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>1</Text>
          </View>
        </Animated.View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>Added to Cart</Text>
          {itemName && <Text style={styles.subtitle} numberOfLines={1}>{itemName}</Text>}
          
          {/* Progress bar towards next streak */}
          <View style={styles.progressContainer}>
            <ProgressBar value={nextStreakValue} total={3} />
            
            {/* Display message about streak progress */}
            {!showStreak && (
              <Text style={styles.progressText}>
                {nextStreakGoal} more to streak!
              </Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.viewButton} 
          onPress={handleViewCart}
          activeOpacity={0.7}
        >
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>
      
      {/* Streak badge for animation */}
      <AnimatedBadge showStreak={showStreak} streakCount={purchaseStreak} />
    </Animated.View>
  );
});

// Give the component a display name for debugging
CartNotification.displayName = 'CartNotification';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: StatusBar.currentHeight || SPACING.xl,
    paddingHorizontal: SPACING.md
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOWS.medium
  },
  streakContent: {
    backgroundColor: '#8424BC', // Special purple color for streaks
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    position: 'relative'
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.success,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary
  },
  badgeText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: 'bold'
  },
  textContainer: {
    flex: 1,
    marginRight: SPACING.sm
  },
  title: {
    color: COLORS.accent,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 6
  },
  progressContainer: {
    marginTop: 4
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1.5,
    overflow: 'hidden',
    position: 'relative'
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: COLORS.accent,
    borderRadius: 1.5
  },
  progressText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 2
  },
  milestone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.5)'
  },
  viewButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  viewButtonText: {
    color: COLORS.accent,
    fontWeight: '600',
    fontSize: 12
  },
  streakBadgeContainer: {
    position: 'absolute',
    top: StatusBar.currentHeight || SPACING.xl + 10,
    right: SPACING.md + 16,
    zIndex: 10000
  },
  streakBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFD700', // Gold color
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium
  },
  streakText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14
  }
});

export default CartNotification; 