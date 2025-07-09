import React, { useEffect, useRef } from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  View,
  Text
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../../utils/theme';
import { HapticFeedback } from '../../utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BackToTopButtonProps {
  visible: boolean;
  onPress: () => void;
}

export default function BackToTopButton({ visible, onPress }: BackToTopButtonProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handlePress = () => {
    HapticFeedback.light();
    onPress();
  };

  if (!visible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          bottom: 120 + insets.bottom, // Position safely above tab bar + safe area
        }
      ]}
    >
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.8}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Back to top"
        accessibilityHint="Scrolls to the top of the page"
      >
        <Ionicons 
          name="chevron-up" 
          size={18} 
          color={COLORS.card} 
          style={styles.icon}
        />
        <Text style={styles.buttonText}>Back to Top</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 24,
    minWidth: 120,
    ...SHADOWS.medium,
  },
  icon: {
    marginRight: SPACING.xs,
  },
  buttonText: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.card,
  },
}); 