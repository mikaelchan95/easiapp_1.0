import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  DimensionValue
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import * as Animations from '../../utils/animations';

interface LevelIndicatorProps {
  currentLevel: number;
  nextLevelThreshold: number;
  currentPoints: number;
  style?: StyleProp<ViewStyle>;
  width?: DimensionValue;
  height?: number;
  showAnimation?: boolean;
  onLevelUp?: (newLevel: number) => void;
  progressColor?: string;
  backgroundColor?: string;
  levelUpColor?: string;
  showLabel?: boolean;
  compact?: boolean;
  pointsLabel?: string;
  levelLabel?: string;
}

const ProgressIndicator: React.FC<LevelIndicatorProps> = ({
  currentLevel,
  nextLevelThreshold,
  currentPoints,
  style,
  width = '100%',
  height = 12,
  showAnimation = true,
  onLevelUp,
  progressColor = COLORS.primary,
  backgroundColor = COLORS.border,
  levelUpColor = '#FFD700', // Gold color
  showLabel = true,
  compact = false,
  pointsLabel = 'points',
  levelLabel = 'Level'
}) => {
  // Animation refs
  const progressAnim = useRef(new Animated.Value(0)).current;
  const levelUpAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Separate animated values for native driver animations
  const nativeLevelUpAnim = useRef(new Animated.Value(0)).current;
  
  // State for tracking level change animation
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [prevPoints, setPrevPoints] = useState(currentPoints);
  const [showLevelUpEffect, setShowLevelUpEffect] = useState(false);
  
  // Calculate progress percentage
  const progress = Math.min(currentPoints / nextLevelThreshold, 1);
  
  // Animate progress bar when points change
  useEffect(() => {
    // If first render, set without animation
    if (prevPoints === currentPoints && !isLevelingUp) {
      progressAnim.setValue(progress);
      return;
    }
    
    // Check if leveling up
    if (prevPoints < nextLevelThreshold && currentPoints >= nextLevelThreshold) {
      // Start level up sequence
      setIsLevelingUp(true);
      setShowLevelUpEffect(true);
      
      // First animate to full
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 800,
        easing: Animations.TIMING.emphatic,
        useNativeDriver: false
      }).start(() => {
        // Show level up animation
        Animated.sequence([
          Animated.timing(levelUpAnim, {
            toValue: 1,
            duration: 500,
            easing: Animations.TIMING.easeOut,
            useNativeDriver: true
          }),
          Animated.delay(1000),
          Animated.timing(levelUpAnim, {
            toValue: 0,
            duration: 300,
            easing: Animations.TIMING.easeIn,
            useNativeDriver: true
          })
        ]).start(() => {
          // Reset to new level progress
          progressAnim.setValue(0);
          setIsLevelingUp(false);
          setShowLevelUpEffect(false);
          
          // Call level up callback
          if (onLevelUp) {
            onLevelUp(currentLevel + 1);
          }
        });
      });
    } else if (!isLevelingUp) {
      // Normal progress update
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 800,
        easing: Animations.TIMING.easeOut,
        useNativeDriver: false
      }).start();
      
      // Pulse animation if close to level up
      if (progress > 0.9 && progress < 1) {
        startPulseAnimation();
      }
    }
    
    // Update previous points
    setPrevPoints(currentPoints);
  }, [currentPoints, nextLevelThreshold, progress]);
  
  // Pulse animation when close to level up
  const startPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: 500,
        easing: Easing.out(Easing.sin),
        useNativeDriver: true
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.in(Easing.sin),
        useNativeDriver: true
      })
    ]).start(() => {
      if (progress > 0.9 && progress < 1) {
        startPulseAnimation();
      }
    });
  };
  
  // Calculate points to next level
  const pointsToNextLevel = nextLevelThreshold - currentPoints;
  
  // Interpolate progress width
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });
  
  // Render level up effect
  const renderLevelUpEffect = () => {
    if (!showLevelUpEffect) return null;
    
    return (
      <Animated.View
        style={[
          styles.levelUpContainer,
          {
            opacity: levelUpAnim,
            transform: [
              { scale: levelUpAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.5, 1.2, 1]
              })}
            ]
          }
        ]}
      >
        <View style={[styles.levelUpBadge, { backgroundColor: levelUpColor }]}>
          <Text style={styles.levelUpText}>Level Up!</Text>
          <Text style={styles.newLevelText}>{levelLabel} {currentLevel + 1}</Text>
        </View>
      </Animated.View>
    );
  };
  
  return (
    <View style={[styles.container, style]}>
      {/* Level and points indicator */}
      {showLabel && !compact && (
        <View style={styles.labelContainer}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{levelLabel} {currentLevel}</Text>
          </View>
          
          <Text style={styles.pointsText}>
            {currentPoints} {pointsLabel}
            {pointsToNextLevel > 0 && (
              <Text style={styles.nextLevelText}>
                {' • '}{pointsToNextLevel} to {levelLabel} {currentLevel + 1}
              </Text>
            )}
          </Text>
        </View>
      )}
      
      {/* Compact indicator for small spaces */}
      {showLabel && compact && (
        <View style={styles.compactLabelContainer}>
          <Text style={styles.compactLevelText}>{levelLabel} {currentLevel}</Text>
          <Text style={styles.compactPointsText}>
            {currentPoints}/{nextLevelThreshold}
          </Text>
        </View>
      )}
      
      {/* Progress bar */}
      <Animated.View 
        style={[
          styles.progressContainer, 
          { 
            height, 
            width,
            backgroundColor,
            transform: [{ scale: progress > 0.9 ? pulseAnim : 1 }] 
          }
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressWidth,
              backgroundColor: isLevelingUp ? levelUpColor : progressColor
            }
          ]}
        />
        
        {/* Milestone markers */}
        <View style={[styles.milestone, { left: '25%' }]} />
        <View style={[styles.milestone, { left: '50%' }]} />
        <View style={[styles.milestone, { left: '75%' }]} />
      </Animated.View>
      
      {/* Render level up effect */}
      {renderLevelUpEffect()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  levelBadgeText: {
    color: COLORS.accent,
    fontWeight: 'bold',
    fontSize: 12,
  },
  pointsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
  },
  nextLevelText: {
    color: COLORS.inactive,
  },
  progressContainer: {
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 6,
  },
  milestone: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    zIndex: 1,
  },
  levelUpContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  levelUpBadge: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  levelUpText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  newLevelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  compactLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  compactLevelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  compactPointsText: {
    fontSize: 12,
    color: COLORS.inactive,
  }
});

export default ProgressIndicator; 