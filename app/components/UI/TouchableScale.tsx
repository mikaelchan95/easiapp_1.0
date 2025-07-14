import React, { useRef } from 'react';
import {
  TouchableWithoutFeedback,
  Animated,
  ViewStyle,
  GestureResponderEvent,
  Platform,
} from 'react-native';
import { HapticFeedback } from '../../utils/haptics';

interface TouchableScaleProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: ViewStyle | ViewStyle[];
  activeScale?: number;
  tension?: number;
  friction?: number;
  pressInTension?: number;
  pressInFriction?: number;
  pressOutTension?: number;
  pressOutFriction?: number;
  useNativeDriver?: boolean;
  defaultScale?: number;
  haptic?: boolean;
  hapticType?: 'light' | 'medium' | 'heavy';
}

const TouchableScale: React.FC<TouchableScaleProps> = ({
  children,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disabled = false,
  style,
  activeScale = 0.95,
  tension = 100,
  friction = 3,
  pressInTension,
  pressInFriction,
  pressOutTension,
  pressOutFriction,
  useNativeDriver = true,
  defaultScale = 1,
  haptic = true,
  hapticType = 'light',
}) => {
  const scaleValue = useRef(new Animated.Value(defaultScale)).current;

  const handlePressIn = (event: GestureResponderEvent) => {
    if (haptic) {
      switch (hapticType) {
        case 'medium':
          HapticFeedback.medium();
          break;
        case 'heavy':
          HapticFeedback.heavy();
          break;
        default:
          HapticFeedback.light();
      }
    }

    Animated.spring(scaleValue, {
      toValue: activeScale,
      tension: pressInTension || tension,
      friction: pressInFriction || friction,
      useNativeDriver,
    }).start();

    if (onPressIn) {
      onPressIn(event);
    }
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    Animated.spring(scaleValue, {
      toValue: defaultScale,
      tension: pressOutTension || tension,
      friction: pressOutFriction || friction,
      useNativeDriver,
    }).start();

    if (onPressOut) {
      onPressOut(event);
    }
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleValue }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

export default TouchableScale;
