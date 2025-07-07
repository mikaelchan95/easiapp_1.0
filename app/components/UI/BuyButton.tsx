import React, { useRef, useState, useEffect } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import * as Animations from '../../utils/animations';

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
  onCartAnimationComplete
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowCartNotification, setShouldShowCartNotification] = useState(false);
  
  const navigation = useNavigation();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bgColorAnim = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  
  // Handle press animation
  const handlePressIn = () => {
    setIsPressing(true);
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
      easing: Animations.TIMING.easeOut
    }).start();
  };
  
  const handlePressOut = () => {
    setIsPressing(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 300,
      useNativeDriver: true
    }).start();
  };
  
  // Handle add to cart
  const handleAddToCart = () => {
    if (inStock && !isAdding && !isSuccess) {
      // Start loading animation
      setIsAdding(true);
      
      // Trigger pulse animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 150,
          easing: Animations.TIMING.easeOut,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          easing: Animations.TIMING.easeInOut,
          useNativeDriver: true
        })
      ]).start();
      
      // Call the provided onAddToCart callback
      onAddToCart();
      
      // Simulate API call delay
      setTimeout(() => {
        // Show success state
        setIsAdding(false);
        setIsSuccess(true);
        
        // Show cart notification
        setShouldShowCartNotification(true);
        
        // Success opacity animation
        Animated.timing(successOpacity, {
          toValue: 1,
          duration: 300,
          easing: Animations.TIMING.easeOut,
          useNativeDriver: true
        }).start();
        
        // Reset after delay
        setTimeout(() => {
          setIsSuccess(false);
          Animated.timing(successOpacity, {
            toValue: 0,
            duration: 300,
            easing: Animations.TIMING.easeInOut,
            useNativeDriver: true
          }).start();
        }, 1500);
      }, 600);
    }
  };
  
  // Handle buy now
  const handleBuyNow = () => {
    if (inStock && !isAdding && onBuyNow) {
      // Trigger pulse animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 150,
          easing: Animations.TIMING.easeOut,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          easing: Animations.TIMING.easeInOut,
          useNativeDriver: true
        })
      ]).start();
      
      onBuyNow();
    }
  };
  
  // Toggle expanded state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    Animated.timing(expandAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      easing: isExpanded ? Animations.TIMING.easeIn : Animations.TIMING.easeOut,
      useNativeDriver: false
    }).start();
  };
  
  // Handle quantity changes
  const incrementQuantity = () => {
    if (onQuantityChange) {
      onQuantityChange(quantity + 1);
    }
  };
  
  const decrementQuantity = () => {
    if (onQuantityChange && quantity > 1) {
      onQuantityChange(quantity - 1);
    }
  };
  
  // Handle cart notification hide
  const handleCartNotificationHide = () => {
    setShouldShowCartNotification(false);
    if (onCartAnimationComplete) {
      onCartAnimationComplete();
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
          <ActivityIndicator size="small" color={COLORS.accent} style={styles.loadingIndicator} />
          <Text style={[styles.buttonText, textStyle]}>Adding...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.buttonContent}>
        <Ionicons name="cart-outline" size={20} color={COLORS.accent} />
        <Text style={[styles.buttonText, textStyle]}>Add to Cart • ${(price * quantity).toFixed(0)}</Text>
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
            transform: [{ translateY: expandAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0]
            })}]
          }
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
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Quantity</Text>
          <View style={styles.quantityControls}>
            <TouchableWithoutFeedback onPress={decrementQuantity}>
              <Animated.View 
                style={[
                  styles.quantityButton,
                  quantity <= 1 && styles.quantityButtonDisabled
                ]}
              >
                <Ionicons 
                  name="remove" 
                  size={18} 
                  color={quantity <= 1 ? COLORS.inactive : COLORS.text} 
                />
              </Animated.View>
            </TouchableWithoutFeedback>
            
            <Text style={styles.quantityValue}>{quantity}</Text>
            
            <TouchableWithoutFeedback onPress={incrementQuantity}>
              <Animated.View style={styles.quantityButton}>
                <Ionicons name="add" size={18} color={COLORS.text} />
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </View>
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
              transform: [
                { scale: Animated.multiply(scaleAnim, pulseAnim) }
              ],
              opacity: isSuccess ? successOpacity : 1
            },
            !inStock && styles.buttonDisabled,
            buttonStyle
          ]}
        >
          {renderButtonContent()}
        </Animated.View>
      </TouchableWithoutFeedback>
      
      {/* Expanded Actions (Buy Now) */}
      {renderExpandedButtons()}
      
      {/* Cart Notification */}
      {productName && (
        <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          {shouldShowCartNotification && (
            <View style={{ position: 'relative' }}>
              <CartNotification
                visible={shouldShowCartNotification}
                itemName={productName}
                onHide={handleCartNotificationHide}
              />
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  quantityContainer: {
    marginBottom: 16,
  },
  quantityLabel: {
    ...TYPOGRAPHY.caption,
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 120,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'center',
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

// Import at the bottom to avoid circular dependency
import CartNotification from './CartNotification';

export default BuyButton; 