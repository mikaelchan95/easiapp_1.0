import React from 'react';
import { View, StyleSheet, Text, Animated } from 'react-native';

interface ActivityRingProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0-100
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
}

const ActivityRing: React.FC<ActivityRingProps> = ({
  size = 60,
  strokeWidth = 5,
  progress,
  color = '#4CAF50',
  backgroundColor = '#E5E5E5',
  showPercentage = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Create multiple segments to simulate a smooth ring
  const segments = 12; // 12 segments for smooth appearance
  const segmentAngle = 360 / segments;
  const filledSegments = Math.round((progress / 100) * segments);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background ring */}
      <View
        style={[
          styles.backgroundRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          },
        ]}
      />

      {/* Progress segments */}
      {Array.from({ length: segments }, (_, index) => {
        const isActive = index < filledSegments;
        const rotation = index * segmentAngle - 90; // Start from top

        return (
          <View
            key={index}
            style={[
              styles.segment,
              {
                width: size,
                height: size,
                transform: [{ rotate: `${rotation}deg` }],
              },
            ]}
          >
            <View
              style={[
                styles.segmentDot,
                {
                  width: strokeWidth * 1.2,
                  height: strokeWidth * 1.2,
                  borderRadius: (strokeWidth * 1.2) / 2,
                  backgroundColor: isActive ? color : 'transparent',
                  top: strokeWidth / 2,
                  left: (size - strokeWidth * 1.2) / 2,
                },
              ]}
            />
          </View>
        );
      })}

      {/* Center content */}
      {showPercentage && (
        <View style={styles.centerContent}>
          <Text style={[styles.percentageText, { color: color }]}>
            {Math.round(progress)}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  backgroundRing: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  segment: {
    position: 'absolute',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  segmentDot: {
    position: 'absolute',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ActivityRing;
