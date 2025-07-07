import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StyleProp,
  ViewStyle,
  AccessibilityInfo
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, SHADOWS } from '../../utils/theme';
import * as Animations from '../../utils/animations';
import { HapticFeedback } from '../../utils/haptics';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
  showLabel?: boolean;
  productName?: string;
}

const BUTTON_SIZES = {
  small: { width: 32, height: 32, iconSize: 14 },
  medium: { width: 40, height: 40, iconSize: 16 },
  large: { width: 44, height: 44, iconSize: 18 },
};

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  size = 'medium',
  style,
  showLabel = false,
  productName = 'item'
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  
  const buttonSize = BUTTON_SIZES[size];
  
  // Handle increment with proper validation and feedback
  const handleIncrement = () => {
    if (disabled || value >= max) return;
    
    HapticFeedback.light();
    
    // Bounce animation for feedback
    Animations.bounceAnimation(bounceAnim);
    
    onChange(value + 1);
    
    // Accessibility announcement
    AccessibilityInfo.announceForAccessibility(
      `Quantity increased to ${value + 1} for ${productName}`
    );
  };
  
  // Handle decrement with proper validation and feedback
  const handleDecrement = () => {
    if (disabled || value <= min) return;
    
    HapticFeedback.light();
    
    // Bounce animation for feedback
    Animations.bounceAnimation(bounceAnim);
    
    onChange(value - 1);
    
    // Accessibility announcement
    AccessibilityInfo.announceForAccessibility(
      `Quantity decreased to ${value - 1} for ${productName}`
    );
  };
  
  // Handle button press animation
  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true
    }).start();
  };
  
  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && value < max;
  
  return (
    <View style={[styles.container, style]}>
      {showLabel && (
        <Text style={styles.label}>Quantity</Text>
      )}
      
      <Animated.View 
        style={[
          styles.quantityContainer,
          { transform: [{ scale: bounceAnim }] }
        ]}
      >
        {/* Decrement Button */}
        <TouchableOpacity
          onPress={handleDecrement}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!canDecrement}
          style={[
            styles.quantityButton,
            styles.decrementButton,
            {
              width: buttonSize.width,
              height: buttonSize.height,
            },
            !canDecrement && styles.disabledButton
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Decrease quantity of ${productName}`}
          accessibilityHint={`Current quantity is ${value}. Double tap to decrease.`}
          accessibilityState={{ disabled: !canDecrement }}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons 
              name="remove" 
              size={buttonSize.iconSize} 
              color={canDecrement ? COLORS.text : COLORS.inactive} 
            />
          </Animated.View>
        </TouchableOpacity>
        
        {/* Quantity Display */}
        <View style={styles.quantityDisplay}>
          <Text 
            style={[
              styles.quantityText,
              disabled && styles.disabledText
            ]}
            accessibilityRole="text"
            accessibilityLabel={`Quantity: ${value}`}
          >
            {value}
          </Text>
        </View>
        
        {/* Increment Button */}
        <TouchableOpacity
          onPress={handleIncrement}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={!canIncrement}
          style={[
            styles.quantityButton,
            styles.incrementButton,
            {
              width: buttonSize.width,
              height: buttonSize.height,
            },
            !canIncrement && styles.disabledButton
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Increase quantity of ${productName}`}
          accessibilityHint={`Current quantity is ${value}. Double tap to increase.`}
          accessibilityState={{ disabled: !canIncrement }}
        >
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Ionicons 
              name="add" 
              size={buttonSize.iconSize} 
              color={canIncrement ? COLORS.text : COLORS.inactive} 
            />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 2,
    ...SHADOWS.light,
  },
  quantityButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 10,
  },
  decrementButton: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  incrementButton: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  disabledButton: {
    opacity: 0.4,
  },
  quantityDisplay: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.card,
    minWidth: 40,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  disabledText: {
    color: COLORS.inactive,
  },
});

export default QuantitySelector;