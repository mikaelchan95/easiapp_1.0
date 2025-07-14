import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Only execute haptics on iOS devices
const isIOS = Platform.OS === 'ios';

export const HapticFeedback = {
  // Light impact - for small UI interactions
  light: () => {
    if (isIOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  },

  // Medium impact - for button presses
  medium: () => {
    if (isIOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  },

  // Heavy impact - for significant actions
  heavy: () => {
    if (isIOS) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  },

  // Success notification - for completed actions
  success: () => {
    if (isIOS) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  },

  // Warning notification - for alerts
  warning: () => {
    if (isIOS) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  },

  // Error notification - for failures
  error: () => {
    if (isIOS) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  },

  // Selection changed - for picker/slider interactions
  selection: () => {
    if (isIOS) {
      Haptics.selectionAsync();
    }
  },
};

// Haptic patterns for complex interactions
export const HapticPatterns = {
  // Double tap pattern
  doubleTap: async () => {
    if (isIOS) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimeout(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }, 100);
    }
  },

  // Add to cart pattern
  addToCart: async () => {
    if (isIOS) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 300);
    }
  },

  // Delete/remove pattern
  delete: async () => {
    if (isIOS) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }, 200);
    }
  },
};
