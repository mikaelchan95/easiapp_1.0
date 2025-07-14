import React, { useRef, useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { CartNotificationContext } from '../../context/CartNotificationContext';
import { HapticFeedback } from '../../utils/haptics';
import QuantitySelector from './QuantitySelector';

interface BuyButtonProps {
  price: number;
  quantity: number;
  inStock: boolean;
  onAddToCart: () => void;
  style?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  showQuantity?: boolean;
  onQuantityChange?: (quantity: number) => void;
  onBuyNow?: () => void;
  productName?: string;
  onCartAnimationComplete?: () => void;
}

const BuyButton: React.FC<BuyButtonProps> = ({
  price,
  quantity,
  inStock,
  onAddToCart,
  style,
  buttonStyle,
  textStyle,
  showQuantity = true,
  onQuantityChange,
  onBuyNow,
  productName,
  onCartAnimationComplete,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const navigation = useNavigation();
  const { showCartNotification } = useContext(CartNotificationContext);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  // Handle press animation
  const handlePressIn = () => {
    setIsPressing(true);
    HapticFeedback.light();

    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();
  };

  const handlePressOut = () => {
    setIsPressing(false);

    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  // Handle add to cart with smooth animation
  const handleAddToCart = () => {
    if (inStock && !isAdding && !isSuccess) {
      // Start loading animation
      setIsAdding(true);

      // Haptic feedback
      HapticFeedback.success();

      // Trigger pulse animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      // Call the provided onAddToCart callback
      onAddToCart();

      // Simulate API call delay for smooth UX
      setTimeout(() => {
        // Show success state
        setIsAdding(false);
        setIsSuccess(true);

        // Show global cart notification with quantity
        showCartNotification(productName, quantity);

        // Success opacity animation
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();

        // Reset after delay
        setTimeout(() => {
          setIsSuccess(false);
          Animated.timing(successOpacity, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }).start();

          // Call completion callback
          if (onCartAnimationComplete) {
            onCartAnimationComplete();
          }
        }, 1500);
      }, 400);
    }
  };

  // Handle buy now
  const handleBuyNow = () => {
    if (inStock && !isAdding && onBuyNow) {
      HapticFeedback.success();

      // Trigger pulse animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      onBuyNow();
    }
  };

  // Toggle expanded state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    HapticFeedback.light();

    Animated.timing(expandAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      easing: isExpanded
        ? Easing.in(Easing.quad)
        : Easing.out(Easing.back(1.1)),
      useNativeDriver: false,
    }).start();
  };

  // Handle quantity changes
  const handleQuantityChange = (newQuantity: number) => {
    if (onQuantityChange) {
      onQuantityChange(newQuantity);
    }
  };

  // Get background color based on state
  const backgroundColor = isSuccess ? COLORS.success : COLORS.primary;

  // Render button content based on state
  const renderButtonContent = () => {
    if (isSuccess) {
      return (
        <View style={styles.buttonContent}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
          <Text style={[styles.buttonText, textStyle]}>Added to Cart</Text>
        </View>
      );
    }

    if (isAdding) {
      return (
        <View style={styles.buttonContent}>
          <ActivityIndicator
            size="small"
            color={COLORS.accent}
            style={styles.loadingIndicator}
          />
          <Text style={[styles.buttonText, textStyle]}>Adding...</Text>
        </View>
      );
    }

    return (
      <View style={styles.buttonContent}>
        <Ionicons name="cart-outline" size={20} color={COLORS.accent} />
        <Text style={[styles.buttonText, textStyle]}>
          Add to Cart • ${(price * quantity).toFixed(0)}
        </Text>
      </View>
    );
  };

  // Render expanded action buttons (Buy Now)
  const renderExpandedButtons = () => {
    if (!isExpanded) return null;

    return (
      <Animated.View
        style={[
          styles.expandedButtons,
          {
            opacity: expandAnim,
            transform: [
              {
                translateY: expandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableWithoutFeedback onPress={handleBuyNow}>
          <View style={styles.buyNowButton}>
            <Ionicons name="flash-outline" size={18} color={COLORS.accent} />
            <Text style={styles.buyNowText}>Buy Now</Text>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Quantity Selector - Shown when showQuantity is true */}
      {showQuantity && (
        <QuantitySelector
          value={quantity}
          onChange={handleQuantityChange}
          showLabel={true}
          size="large"
          style={styles.quantityContainer}
          productName={productName || 'item'}
        />
      )}

      {/* Main Buy Button */}
      <TouchableWithoutFeedback
        onPress={handleAddToCart}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLongPress={toggleExpand}
      >
        <Animated.View
          style={[
            styles.button,
            {
              backgroundColor,
              transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
              opacity: isSuccess ? successOpacity : 1,
            },
            !inStock && styles.buttonDisabled,
            buttonStyle,
          ]}
        >
          {renderButtonContent()}
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* Expanded Actions (Buy Now) */}
      {renderExpandedButtons()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  quantityContainer: {
    marginBottom: SPACING.md,
  },
  button: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  buttonDisabled: {
    backgroundColor: COLORS.inactive,
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingIndicator: {
    marginRight: 8,
  },
  expandedButtons: {
    marginTop: 12,
    width: '100%',
  },
  buyNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    height: 44,
    borderRadius: 12,
    ...SHADOWS.light,
  },
  buyNowText: {
    color: COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default BuyButton;
