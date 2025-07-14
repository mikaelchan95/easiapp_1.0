import { Animated, Easing } from 'react-native';

/**
 * Animation timing presets for consistent motion design
 */
export const TIMING = {
  // Easing functions for natural motion
  easeInOut: Easing.bezier(0.4, 0.0, 0.2, 1), // Standard curve for most UI animations
  easeOut: Easing.bezier(0.0, 0.0, 0.2, 1), // Quick acceleration, gentle slowdown
  easeIn: Easing.bezier(0.4, 0.0, 1, 1), // Starts slow, ends at full velocity
  emphatic: Easing.bezier(0.175, 0.885, 0.32, 1.275), // More dramatic curve for attention-grabbing animations
  bounce: Easing.bounce,

  // Apple-like spring presets
  spring: {
    stiff: { friction: 8, tension: 100 },
    gentle: { friction: 7, tension: 40 },
    wobbly: { friction: 3, tension: 40 },
  },
};

/**
 * Standard durations for animations
 */
export const DURATION = {
  short: 150, // For micro-feedback (button presses)
  medium: 300, // Standard transitions
  long: 500, // Complex or multi-stage transitions

  // Legacy naming for backward compatibility
  quick: 200,
  slow: 400,
};

/**
 * Creates a button scale animation with tactile feedback
 * @param scaleValue Animated.Value to animate
 * @returns Object with pressIn and pressOut functions
 */
export const buttonPress = (scaleValue: Animated.Value) => {
  // Scale down on press
  const pressIn = () => {
    Animated.timing(scaleValue, {
      toValue: 0.96,
      duration: DURATION.short,
      easing: TIMING.easeOut,
      useNativeDriver: true,
    }).start();
  };

  // Scale back up on release
  const pressOut = () => {
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: DURATION.short,
      easing: TIMING.easeOut,
      useNativeDriver: true,
    }).start();
  };

  return { pressIn, pressOut };
};

/**
 * Creates a press feedback animation
 * @param value Animated.Value to animate
 * @returns The animation object
 */
export const pressFeedback = (
  value: Animated.Value
): Animated.CompositeAnimation => {
  return Animated.timing(value, {
    toValue: 0.95,
    duration: DURATION.short,
    easing: TIMING.easeOut,
    useNativeDriver: true,
  });
};

/**
 * Creates a release feedback animation using spring physics
 * @param value Animated.Value to animate
 * @returns The animation object
 */
export const releaseFeedback = (
  value: Animated.Value
): Animated.CompositeAnimation => {
  return Animated.spring(value, {
    toValue: 1,
    friction: 5,
    tension: 300,
    useNativeDriver: true,
  });
};

/**
 * Creates a success animation with scale and opacity
 * @param value Animated.Value to animate
 * @param callback Optional callback function to run after animation completes
 * @returns The animation object
 */
export const successAnimation = (
  value: Animated.Value,
  callback?: () => void
): Animated.CompositeAnimation => {
  const animation = Animated.sequence([
    Animated.timing(value, {
      toValue: 1.2,
      duration: DURATION.short,
      easing: TIMING.easeOut,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 0.9,
      duration: DURATION.short,
      easing: TIMING.easeInOut,
      useNativeDriver: true,
    }),
    Animated.spring(value, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }),
  ]);

  if (callback) {
    animation.start(callback);
  }

  return animation;
};

/**
 * Creates a fade in animation
 * @param value Animated.Value to animate
 * @param duration Duration of the animation
 * @param callback Optional callback function to run after animation completes
 * @returns The animation object
 */
export const fadeIn = (
  value: Animated.Value,
  duration: number = DURATION.medium,
  callback?: () => void
): Animated.CompositeAnimation => {
  const animation = Animated.timing(value, {
    toValue: 1,
    duration,
    easing: TIMING.easeOut,
    useNativeDriver: true,
  });

  if (callback) {
    animation.start(callback);
  }

  return animation;
};

/**
 * Creates a fade out animation
 * @param value Animated.Value to animate
 * @param duration Duration of the animation
 * @param callback Optional callback function to run after animation completes
 * @returns The animation object
 */
export const fadeOut = (
  value: Animated.Value,
  duration: number = DURATION.medium,
  callback?: () => void
): Animated.CompositeAnimation => {
  const animation = Animated.timing(value, {
    toValue: 0,
    duration,
    easing: TIMING.easeIn,
    useNativeDriver: true,
  });

  if (callback) {
    animation.start(callback);
  }

  return animation;
};

/**
 * Creates a sliding animation from a position to another
 * @param value Animated.Value to animate
 * @param from Starting position
 * @param to Ending position
 * @param duration Duration of the animation
 * @param callback Optional callback function to run after animation completes
 * @returns The animation object
 */
export const slideAnimation = (
  value: Animated.Value,
  from: number,
  to: number,
  duration: number = DURATION.medium,
  callback?: () => void
): Animated.CompositeAnimation => {
  // Reset the value to the starting position
  value.setValue(from);

  const animation = Animated.timing(value, {
    toValue: to,
    duration,
    easing: TIMING.easeInOut,
    useNativeDriver: true,
  });

  if (callback) {
    animation.start(callback);
  }

  return animation;
};

/**
 * Creates a slide up animation from bottom
 * @param value Animated.Value to animate
 * @param distance Starting distance from target position
 * @param callback Optional callback function
 */
export const slideUp = (
  value: Animated.Value,
  distance: number = 50,
  callback?: () => void
) => {
  return slideAnimation(value, distance, 0, DURATION.medium, callback);
};

/**
 * Creates a slide down animation
 * @param value Animated.Value to animate
 * @param distance Target distance from starting position
 * @param callback Optional callback function
 */
export const slideDown = (
  value: Animated.Value,
  distance: number = 50,
  callback?: () => void
) => {
  return slideAnimation(value, 0, distance, DURATION.medium, callback);
};

/**
 * Creates a spring animation for bouncy effects
 * @param value Animated.Value to animate
 * @param toValue Target value
 * @param preset Spring preset to use
 * @param callback Optional callback function
 */
export const springAnimation = (
  value: Animated.Value,
  toValue: number = 1,
  preset: 'stiff' | 'gentle' | 'wobbly' = 'gentle',
  callback?: () => void
) => {
  const animation = Animated.spring(value, {
    toValue,
    friction: TIMING.spring[preset].friction,
    tension: TIMING.spring[preset].tension,
    useNativeDriver: true,
  });

  if (callback) {
    animation.start(callback);
  }

  return animation;
};

/**
 * Creates a pulse animation for attracting attention
 * @param value Animated.Value to animate
 * @param intense Whether to use a more pronounced pulse effect
 * @param repeat Whether to repeat the animation indefinitely
 * @returns The animation object
 */
export const pulseAnimation = (
  value: Animated.Value,
  intense: boolean = false,
  repeat: boolean = false
): Animated.CompositeAnimation => {
  const animation = Animated.sequence([
    Animated.timing(value, {
      toValue: intense ? 1.2 : 1.05,
      duration: DURATION.short,
      easing: TIMING.easeOut,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 1,
      duration: DURATION.short,
      easing: TIMING.easeInOut,
      useNativeDriver: true,
    }),
  ]);

  if (repeat) {
    animation.start(({ finished }) => {
      if (finished && repeat) {
        pulseAnimation(value, intense, repeat);
      }
    });
  }

  return animation;
};

/**
 * Creates a heartbeat animation for celebration moments
 * @param value Animated.Value to animate
 * @param callback Optional callback function
 */
export const heartbeatAnimation = (
  value: Animated.Value,
  callback?: () => void
) => {
  const animation = Animated.sequence([
    Animated.timing(value, {
      toValue: 1.2,
      duration: 150,
      easing: TIMING.easeOut,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 1,
      duration: 100,
      easing: TIMING.easeIn,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 1.1,
      duration: 150,
      easing: TIMING.easeOut,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 1,
      duration: 100,
      easing: TIMING.easeIn,
      useNativeDriver: true,
    }),
  ]);

  if (callback) {
    animation.start(callback);
  }

  return animation;
};

/**
 * Creates a staggered animation sequence for multiple elements
 * @param values Array of Animated.Value to animate
 * @param animationCreator Function that creates an animation for each value
 * @param staggerDelay Delay between each animation start
 * @returns The staggered animation object
 */
export const staggered = (
  values: Animated.Value[],
  animationCreator: (
    value: Animated.Value,
    index: number
  ) => Animated.CompositeAnimation,
  staggerDelay: number = 50
): Animated.CompositeAnimation => {
  const animations = values.map((value, index) =>
    animationCreator(value, index)
  );
  return Animated.stagger(staggerDelay, animations);
};

/**
 * Creates a staggered animation for list items
 * @param values Array of Animated.Value to animate
 * @param stagger Delay between each animation
 */
export const staggeredAnimations = (
  values: Animated.Value[],
  stagger: number = 50
) => {
  return staggered(
    values,
    value =>
      Animated.timing(value, {
        toValue: 1,
        duration: DURATION.medium,
        easing: TIMING.easeOut,
        useNativeDriver: true,
      }),
    stagger
  );
};

/**
 * Creates a shimmer loading effect
 * @param value Animated.Value to animate
 * @param duration Duration of one shimmer cycle
 */
export const shimmerAnimation = (
  value: Animated.Value,
  duration: number = 1500
) => {
  value.setValue(0);
  Animated.loop(
    Animated.timing(value, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: false, // Shimmer uses interpolation for backgroundColor
    })
  ).start();
};

/**
 * Creates a progress bar animation
 * @param value Animated.Value to animate
 * @param toValue Target value (typically 1 for 100%)
 * @param duration Duration of the animation
 * @param callback Optional callback function
 */
export const progressAnimation = (
  value: Animated.Value,
  toValue: number = 1,
  duration: number = 1000,
  callback?: () => void
) => {
  const animation = Animated.timing(value, {
    toValue,
    duration,
    easing: TIMING.easeOut,
    useNativeDriver: false, // Progress bar uses layout properties
  });

  if (callback) {
    animation.start(callback);
  }

  return animation;
};

/**
 * Creates a shake animation for error feedback
 * @param value Animated.Value to animate
 * @returns The animation object
 */
export const shakeAnimation = (
  value: Animated.Value
): Animated.CompositeAnimation => {
  // Reset the value
  value.setValue(0);

  return Animated.sequence([
    Animated.timing(value, {
      toValue: 10,
      duration: 100,
      easing: TIMING.easeInOut,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: -10,
      duration: 100,
      easing: TIMING.easeInOut,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 6,
      duration: 100,
      easing: TIMING.easeInOut,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: -6,
      duration: 100,
      easing: TIMING.easeInOut,
      useNativeDriver: true,
    }),
    Animated.timing(value, {
      toValue: 0,
      duration: 100,
      easing: TIMING.easeInOut,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Creates a bounce animation for tactile feedback
 * @param value Animated.Value to animate
 * @param callback Optional callback function
 * @returns The animation object
 */
export const bounceAnimation = (
  value: Animated.Value,
  callback?: () => void
): Animated.CompositeAnimation => {
  const animation = Animated.sequence([
    Animated.timing(value, {
      toValue: 1.1,
      duration: 100,
      easing: TIMING.easeOut,
      useNativeDriver: true,
    }),
    Animated.spring(value, {
      toValue: 1,
      friction: 4,
      tension: 300,
      useNativeDriver: true,
    }),
  ]);

  if (callback) {
    animation.start(callback);
  }

  return animation;
};
