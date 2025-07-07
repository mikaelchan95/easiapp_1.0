import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  ViewStyle, 
  TextStyle,
  StyleProp,
  Easing,
  DimensionValue
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import * as Animations from '../../utils/animations';

interface ProgressBarProps {
  progress: number | Animated.Value; // Can be either a static number (0 to 1) or an Animated.Value
  totalValue?: number;
  currentValue?: number;
  height?: number;
  width?: DimensionValue;
  backgroundColor?: string;
  fillColor?: string;
  animated?: boolean;
  duration?: number;
  showLabel?: boolean;
  labelPosition?: 'top' | 'bottom' | 'right';
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  valuePrefix?: string;
  valueSuffix?: string;
  initialRender?: boolean;
  streakCount?: number;
  streakEnabled?: boolean;
  streakColor?: string;
  showStreakAnimation?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  totalValue,
  currentValue,
  height = 8,
  width = '100%',
  backgroundColor = COLORS.border,
  fillColor = COLORS.primary,
  animated = true,
  duration = 800,
  showLabel = false,
  labelPosition = 'top',
  labelStyle,
  containerStyle,
  valuePrefix = '',
  valueSuffix = '',
  initialRender = false,
  streakCount = 0,
  streakEnabled = false,
  streakColor = '#FFD700', // Gold color for streaks
  showStreakAnimation = false
}) => {
  // Animation values
  const progressAnim = useRef(
    progress instanceof Animated.Value 
      ? progress 
      : new Animated.Value(initialRender ? 0 : typeof progress === 'number' ? progress : 0)
  ).current;
  
  // Separate animation value for native driver animations
  const nativeAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Format the label text
  const getLabelText = () => {
    if (totalValue !== undefined && currentValue !== undefined) {
      return `${valuePrefix}${currentValue}${valueSuffix} / ${valuePrefix}${totalValue}${valueSuffix}`;
    }
    
    // If progress is an Animated.Value, use a default percentage
    if (progress instanceof Animated.Value) {
      return '...%';
    }
    
    return `${Math.round(progress * 100)}%`;
  };
  
  // Animate progress when it changes
  useEffect(() => {
    if (animated && !(progress instanceof Animated.Value) && typeof progress === 'number') {
      Animated.timing(progressAnim, {
        toValue: progress,
        duration,
        easing: Animations.TIMING.easeOut,
        useNativeDriver: false
      }).start();
      
      // Fade in with native driver
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    } else if (!(progress instanceof Animated.Value)) {
      progressAnim.setValue(typeof progress === 'number' ? progress : 0);
      opacityAnim.setValue(1);
    } else {
      // If progress is already an Animated.Value, just fade in
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  }, [progress, animated, duration]);
  
  // Animate streaks when enabled
  useEffect(() => {
    if (streakEnabled && showStreakAnimation && streakCount > 0) {
      // Reset animation
      streakAnim.setValue(0);
      
      // Run animation
      Animated.sequence([
        Animated.timing(streakAnim, {
          toValue: 1,
          duration: 400,
          easing: Animations.TIMING.easeOut,
          useNativeDriver: true
        }),
        Animated.timing(streakAnim, {
          toValue: 0,
          duration: 300,
          delay: 1000,
          easing: Animations.TIMING.easeIn,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [streakCount, streakEnabled, showStreakAnimation]);

  // Width interpolation for the fill
  const widthInterpolation = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Render streak indicator
  const renderStreakIndicator = () => {
    if (!streakEnabled || streakCount === 0) return null;
    
    return (
      <View style={styles.streakContainer}>
        <Animated.View 
          style={[
            styles.streakBadge,
            {
              backgroundColor: streakColor,
              opacity: showStreakAnimation ? streakAnim : 1,
              transform: [
                { scale: showStreakAnimation ? 
                  streakAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 1.2, 1]
                  }) : 1 
                }
              ]
            }
          ]}
        >
          <Text style={styles.streakText}>🔥 {streakCount}</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <Animated.View style={[
      styles.container, 
      labelPosition === 'bottom' && styles.containerReverse,
      { opacity: opacityAnim },
      containerStyle
    ]}>
      {/* Label above or below */}
      {showLabel && labelPosition !== 'right' && (
        <Text style={[
          styles.label, 
          labelPosition === 'bottom' ? { marginTop: 4 } : { marginBottom: 4 },
          labelStyle
        ]}>
          {getLabelText()}
        </Text>
      )}
      
      <View style={[
        styles.progressContainer, 
        { 
          height, 
          width, 
          backgroundColor 
        }
      ]}>
        <Animated.View 
          style={[
            styles.progressFill, 
            { 
              width: widthInterpolation,
              backgroundColor: fillColor,
            }
          ]}
        />
        
        {/* Tick marks for milestones */}
        {streakEnabled && streakCount > 0 && (
          <>
            <View style={[styles.milestoneMark, { left: '25%' }]} />
            <View style={[styles.milestoneMark, { left: '50%' }]} />
            <View style={[styles.milestoneMark, { left: '75%' }]} />
          </>
        )}
      </View>
      
      {/* Label on right */}
      {showLabel && labelPosition === 'right' && (
        <Text style={[styles.label, { marginLeft: 8 }, labelStyle]}>
          {getLabelText()}
        </Text>
      )}
      
      {/* Streak indicator */}
      {renderStreakIndicator()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  containerReverse: {
    flexDirection: 'column-reverse',
  },
  progressContainer: {
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 4,
  },
  label: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
  },
  streakContainer: {
    position: 'absolute',
    top: -15,
    right: 0,
  },
  streakBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  milestoneMark: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.5)',
  }
});

export default ProgressBar; 