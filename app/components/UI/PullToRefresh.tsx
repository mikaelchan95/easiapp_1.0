import React, { useRef, useState, useCallback } from 'react';
import {
  RefreshControl,
  ScrollView,
  FlatList,
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HapticFeedback } from '../../utils/haptics';
import { COLORS } from '../../utils/theme';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  scrollComponent?: 'ScrollView' | 'FlatList';
  tintColor?: string;
  title?: string;
  titleColor?: string;
  colors?: string[];
  progressBackgroundColor?: string;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  scrollComponent = 'ScrollView',
  tintColor = COLORS.primary,
  title,
  titleColor = COLORS.text,
  colors = [COLORS.primary],
  progressBackgroundColor = '#ffffff',
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleRefresh = useCallback(async () => {
    // Haptic feedback when refresh starts
    HapticFeedback.medium();

    setRefreshing(true);

    // Start rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    try {
      await onRefresh();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      // Success haptic when refresh completes
      HapticFeedback.success();
      setRefreshing(false);

      // Reset animations
      rotateAnim.setValue(0);
      rotateAnim.stopAnimation();
    }
  }, [onRefresh, rotateAnim]);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    if (offsetY < 0) {
      const distance = Math.abs(offsetY);
      setPullDistance(distance);

      // Update animations based on pull distance
      const progress = Math.min(distance / 100, 1);

      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.8 + 0.2 * progress,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: progress,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start();

      // Haptic feedback at threshold
      if (distance > 80 && distance < 85) {
        HapticFeedback.light();
      }
    }
  };

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor={tintColor}
      title={title}
      titleColor={titleColor}
      colors={colors}
      progressBackgroundColor={progressBackgroundColor}
      progressViewOffset={Platform.OS === 'android' ? 0 : undefined}
    />
  );

  // Custom iOS refresh indicator
  const customRefreshIndicator = Platform.OS === 'ios' &&
    pullDistance > 0 &&
    !refreshing && (
      <Animated.View
        style={[
          styles.customIndicator,
          {
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              {
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}
      >
        <Ionicons name="refresh" size={24} color={tintColor} />
      </Animated.View>
    );

  if (scrollComponent === 'FlatList') {
    return (
      <View style={styles.container}>
        {customRefreshIndicator}
        {React.cloneElement(children as React.ReactElement<any>, {
          refreshControl,
          onScroll: handleScroll,
          scrollEventThrottle: 16,
        })}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {customRefreshIndicator}
      <ScrollView
        refreshControl={refreshControl}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  customIndicator: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    zIndex: 1000,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default PullToRefresh;
