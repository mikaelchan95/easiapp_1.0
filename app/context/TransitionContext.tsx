import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from 'react';
import { Animated, Easing, ViewStyle } from 'react-native';
import * as Animations from '../utils/animations';

// Available transition types
export type TransitionType =
  | 'fade'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scale'
  | 'none';

interface TransitionContextType {
  // Animated value for transitions
  animatedValue: Animated.Value;

  // Current transition state
  isTransitioning: boolean;

  // Start a transition
  startTransition: (
    type: TransitionType,
    duration?: number,
    callback?: () => void
  ) => void;

  // Get animated style for a component based on transition type
  getTransitionStyle: (type: TransitionType) => any;
}

// Create the context
const TransitionContext = createContext<TransitionContextType>({
  animatedValue: new Animated.Value(1),
  isTransitioning: false,
  startTransition: () => {},
  getTransitionStyle: () => ({}),
});

export const useTransition = () => useContext(TransitionContext);

export const TransitionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Animation values
  const animatedValue = useRef(new Animated.Value(1)).current;

  // Transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentTransition, setCurrentTransition] =
    useState<TransitionType>('none');

  // Start a transition - use useCallback to prevent unnecessary rerenders
  const startTransition = useCallback(
    (
      type: TransitionType = 'fade',
      duration: number = 300,
      callback?: () => void
    ) => {
      if (type === 'none') {
        if (callback) callback();
        return;
      }

      setIsTransitioning(true);
      setCurrentTransition(type);

      // Reset the animated value
      animatedValue.setValue(0);

      // Animate to the end value
      Animated.timing(animatedValue, {
        toValue: 1,
        duration,
        easing: Animations.TIMING.easeOut,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          setIsTransitioning(false);
          if (callback) callback();
        }
      });
    },
    [animatedValue]
  );

  // Get the style for a specific transition - use useCallback to prevent unnecessary rerenders
  const getTransitionStyle = useCallback(
    (type: TransitionType): ViewStyle => {
      switch (type) {
        case 'fade':
          return {
            opacity: animatedValue,
          };

        case 'slideUp':
          return {
            opacity: animatedValue,
            transform: [
              {
                translateY: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          };

        case 'slideDown':
          return {
            opacity: animatedValue,
            transform: [
              {
                translateY: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
          };

        case 'slideLeft':
          return {
            opacity: animatedValue,
            transform: [
              {
                translateX: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          };

        case 'slideRight':
          return {
            opacity: animatedValue,
            transform: [
              {
                translateX: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              },
            ],
          };

        case 'scale':
          return {
            opacity: animatedValue,
            transform: [
              {
                scale: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1],
                }),
              },
            ],
          };

        case 'none':
        default:
          return {};
      }
    },
    [animatedValue]
  );

  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = React.useMemo(
    () => ({
      animatedValue,
      isTransitioning,
      startTransition,
      getTransitionStyle,
    }),
    [animatedValue, isTransitioning, startTransition, getTransitionStyle]
  );

  return (
    <TransitionContext.Provider value={contextValue}>
      {children}
    </TransitionContext.Provider>
  );
};
