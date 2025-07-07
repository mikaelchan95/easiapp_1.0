import React, { useRef, useCallback } from 'react';
import {
  ScrollView,
  ScrollViewProps,
  Animated,
  Platform,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { HapticFeedback } from '../../utils/haptics';

interface MomentumScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  onScrollEnd?: () => void;
  onBounce?: () => void;
  enableHapticFeedback?: boolean;
  bounceIntensity?: number;
  momentumDecelerationRate?: number | 'normal' | 'fast';
  scrollIndicatorInsets?: {
    top?: number;
    left?: number;
    bottom?: number;
    right?: number;
  };
}

const MomentumScrollView: React.FC<MomentumScrollViewProps> = ({
  children,
  onScrollEnd,
  onBounce,
  enableHapticFeedback = true,
  bounceIntensity = 1,
  momentumDecelerationRate = 'normal',
  scrollIndicatorInsets,
  onScroll,
  onMomentumScrollBegin,
  onMomentumScrollEnd,
  onScrollBeginDrag,
  onScrollEndDrag,
  ...props
}) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const isScrolling = useRef(false);
  const lastScrollY = useRef(0);
  const bounceTriggered = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Enhanced bounce detection
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const currentY = contentOffset.y;
      const maxY = contentSize.height - layoutMeasurement.height;

      // Detect top bounce
      if (currentY < 0 && !bounceTriggered.current) {
        bounceTriggered.current = true;
        if (enableHapticFeedback && Platform.OS === 'ios') {
          HapticFeedback.light();
        }
        if (onBounce) {
          onBounce();
        }
      }
      
      // Detect bottom bounce
      else if (currentY > maxY && !bounceTriggered.current) {
        bounceTriggered.current = true;
        if (enableHapticFeedback && Platform.OS === 'ios') {
          HapticFeedback.light();
        }
        if (onBounce) {
          onBounce();
        }
      }
      
      // Reset bounce trigger when back in normal range
      else if (currentY >= 0 && currentY <= maxY) {
        bounceTriggered.current = false;
      }

      lastScrollY.current = currentY;

      // Call original onScroll if provided
      if (onScroll) {
        onScroll(event);
      }
    },
    [enableHapticFeedback, onBounce, onScroll]
  );

  // Handle scroll begin
  const handleScrollBeginDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isScrolling.current = true;
      if (onScrollBeginDrag) {
        onScrollBeginDrag(event);
      }
    },
    [onScrollBeginDrag]
  );

  // Handle scroll end
  const handleScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (onScrollEndDrag) {
        onScrollEndDrag(event);
      }
    },
    [onScrollEndDrag]
  );

  // Handle momentum scroll begin
  const handleMomentumScrollBegin = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (onMomentumScrollBegin) {
        onMomentumScrollBegin(event);
      }
    },
    [onMomentumScrollBegin]
  );

  // Handle momentum scroll end
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isScrolling.current = false;
      if (onMomentumScrollEnd) {
        onMomentumScrollEnd(event);
      }
      if (onScrollEnd) {
        onScrollEnd();
      }
    },
    [onMomentumScrollEnd, onScrollEnd]
  );

  // iOS-specific enhancements
  const iosProps = Platform.OS === 'ios' ? {
    // Better scroll physics
    decelerationRate: momentumDecelerationRate,
    directionalLockEnabled: true,
    
    // Visual enhancements
    indicatorStyle: 'black' as const,
    scrollIndicatorInsets: scrollIndicatorInsets || { right: 1 },
    
    // Bounce configuration
    bounces: true,
    bouncesZoom: true,
    alwaysBounceVertical: bounceIntensity > 0,
    alwaysBounceHorizontal: false,
    
    // Performance optimizations
    scrollEventThrottle: 16,
    removeClippedSubviews: true,
    
    // Keyboard handling
    keyboardDismissMode: 'interactive' as const,
    keyboardShouldPersistTaps: 'handled' as const,
  } : {};

  return (
    <Animated.ScrollView
      ref={scrollViewRef}
      {...props}
      {...iosProps}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        {
          useNativeDriver: false,
          listener: handleScroll,
        }
      )}
      onScrollBeginDrag={handleScrollBeginDrag}
      onScrollEndDrag={handleScrollEndDrag}
      onMomentumScrollBegin={handleMomentumScrollBegin}
      onMomentumScrollEnd={handleMomentumScrollEnd}
      showsVerticalScrollIndicator={Platform.OS === 'ios'}
      overScrollMode={Platform.OS === 'android' ? 'auto' : undefined}
    >
      {children}
    </Animated.ScrollView>
  );
};

export default MomentumScrollView;