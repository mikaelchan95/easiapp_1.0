import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { RectButton } from 'react-native-gesture-handler';
import { COLORS, SHADOWS, SPACING } from '../../utils/theme';
import * as Animations from '../../utils/animations';
import { HapticFeedback, HapticPatterns } from '../../utils/haptics';

interface CartItemProps {
  item: {
    id: string;
    productId: string;
    name: string;
    price: number;
    imageUrl: any;
    quantity: number;
    inStock: boolean;
  };
  onQuantityChange: (quantity: number) => void;
  onDelete?: () => void;
  onSaveForLater?: () => void;
  onAddToFavorites?: () => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

const { width } = Dimensions.get('window');
const ACTION_WIDTH = 80;

const SwipeableCartItem: React.FC<CartItemProps> = ({
  item,
  onQuantityChange,
  onDelete,
  onSaveForLater,
  onAddToFavorites,
  onSwipeStart,
  onSwipeEnd
}) => {
  // Animation values
  const itemScale = useRef(new Animated.Value(1)).current;
  const itemOpacity = useRef(new Animated.Value(1)).current;
  const deleteAnimation = useRef(new Animated.Value(0)).current;
  const quantityBounce = useRef(new Animated.Value(1)).current;
  
  // State
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  
  // Refs
  const swipeableRef = useRef<Swipeable>(null);
  
  // Handle quantity changes with animation
  const incrementQuantity = () => {
    if (item.inStock && !isDeleting) {
      HapticFeedback.light();
      
      // Bounce animation for feedback
      Animations.bounceAnimation(quantityBounce);
      
      onQuantityChange(item.quantity + 1);
    }
  };
  
  const decrementQuantity = () => {
    if (item.quantity > 1 && !isDeleting) {
      HapticFeedback.light();
      
      // Bounce animation for feedback
      Animations.bounceAnimation(quantityBounce);
      
      onQuantityChange(item.quantity - 1);
    } else if (item.quantity === 1) {
      // Show quick delete confirmation
      confirmQuickDelete();
    }
  };
  
  // Quick delete confirmation with haptic
  const confirmQuickDelete = () => {
    HapticFeedback.warning();
    
    Alert.alert(
      'Remove Item',
      `Remove ${item.name} from your cart?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => HapticFeedback.light()
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: handleDelete
        }
      ]
    );
  };
  
  // Handle delete with smooth animation
  const handleDelete = () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    HapticPatterns.delete();
    
    // Close swipeable first
    swipeableRef.current?.close();
    
    // Animate deletion
    Animated.parallel([
      Animated.timing(itemOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(itemScale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(deleteAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false
      })
    ]).start(() => {
      if (onDelete) {
        onDelete();
      }
    });
  };
  
  // Handle save for later
  const handleSaveForLater = () => {
    HapticFeedback.medium();
    swipeableRef.current?.close();
    
    if (onSaveForLater) {
      onSaveForLater();
    }
  };
  
  // Handle add to favorites
  const handleAddToFavorites = () => {
    HapticFeedback.medium();
    swipeableRef.current?.close();
    
    if (onAddToFavorites) {
      onAddToFavorites();
    }
  };
  
  // Render right actions (swipe left to reveal)
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    return (
      <View style={styles.rightActionsContainer}>
        {/* Save for Later Action */}
        {onSaveForLater && (
          <Animated.View
            style={[
              styles.actionContainer,
              {
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [ACTION_WIDTH, 0],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          >
            <RectButton
              style={[styles.action, styles.saveAction]}
              onPress={handleSaveForLater}
            >
              <Ionicons name="bookmark-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionText}>Save</Text>
            </RectButton>
          </Animated.View>
        )}
        
        {/* Favorite Action */}
        {onAddToFavorites && (
          <Animated.View
            style={[
              styles.actionContainer,
              {
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [ACTION_WIDTH, 0],
                      extrapolate: 'clamp',
                    }),
                  },
                ],
              },
            ]}
          >
            <RectButton
              style={[styles.action, styles.favoriteAction]}
              onPress={handleAddToFavorites}
            >
              <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
              <Text style={styles.actionText}>Like</Text>
            </RectButton>
          </Animated.View>
        )}
        
        {/* Delete Action */}
        <Animated.View
          style={[
            styles.actionContainer,
            {
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [ACTION_WIDTH, 0],
                    extrapolate: 'clamp',
                  }),
                },
                {
                  scale: dragX.interpolate({
                    inputRange: [-200, -100, 0],
                    outputRange: [1.1, 1, 0.9],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}
        >
          <RectButton
            style={[styles.action, styles.deleteAction]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionText}>Remove</Text>
          </RectButton>
        </Animated.View>
      </View>
    );
  };
  
  // Handle swipe events
  const onSwipeableWillOpen = (direction: 'left' | 'right') => {
    HapticFeedback.light();
    setIsSwipeOpen(true);
    if (onSwipeStart) {
      onSwipeStart();
    }
  };
  
  const onSwipeableWillClose = () => {
    setIsSwipeOpen(false);
    if (onSwipeEnd) {
      onSwipeEnd();
    }
  };
  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: itemOpacity,
          transform: [{ scale: itemScale }],
          height: deleteAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [90, 0]
          }),
          marginVertical: deleteAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [8, 0]
          })
        }
      ]}
    >
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        onSwipeableWillOpen={onSwipeableWillOpen}
        onSwipeableWillClose={onSwipeableWillClose}
        rightThreshold={40}
        friction={2}
        overshootRight={false}
        enabled={!isDeleting}
      >
        <Animated.View 
          style={[
            styles.card,
            isSwipeOpen && styles.cardSwiped
          ]}
        >
          <View style={styles.contentContainer}>
            {/* Product Image */}
            <TouchableOpacity style={styles.imageContainer} activeOpacity={0.8}>
              <Image source={item.imageUrl} style={styles.image} resizeMode="cover" />
              {!item.inStock && (
                <View style={styles.outOfStockOverlay}>
                  <Text style={styles.outOfStockText}>Out of Stock</Text>
                </View>
              )}
            </TouchableOpacity>
            
            {/* Product Details */}
            <View style={styles.detailsContainer}>
              <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>${item.price.toFixed(0)}</Text>
              
              {/* Quantity Selector */}
              <Animated.View 
                style={[
                  styles.quantityContainer,
                  { transform: [{ scale: quantityBounce }] }
                ]}
              >
                <TouchableOpacity
                  onPress={decrementQuantity}
                  style={[styles.quantityButton, styles.decrementButton]}
                  disabled={isDeleting}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={16} color={COLORS.text} />
                </TouchableOpacity>
                
                <View style={styles.quantityDisplay}>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                </View>
                
                <TouchableOpacity
                  onPress={incrementQuantity}
                  style={[
                    styles.quantityButton, 
                    styles.incrementButton,
                    !item.inStock && styles.disabledButton
                  ]}
                  disabled={!item.inStock || isDeleting}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="add" 
                    size={16} 
                    color={item.inStock ? COLORS.text : COLORS.inactive} 
                  />
                </TouchableOpacity>
              </Animated.View>
            </View>
            
            {/* Total Price */}
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>${(item.price * item.quantity).toFixed(0)}</Text>
              {!item.inStock && (
                <Text style={styles.unavailableText}>Unavailable</Text>
              )}
            </View>
          </View>
        </Animated.View>
      </Swipeable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    ...SHADOWS.light,
    overflow: 'hidden',
  },
  cardSwiped: {
    shadowOpacity: 0.15,
    shadowOffset: { width: -2, height: 2 },
  },
  contentContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 65,
    height: 65,
    borderRadius: 12,
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'hsl(0, 0%, 96%)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  quantityButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  decrementButton: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  incrementButton: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  disabledButton: {
    opacity: 0.4,
  },
  quantityDisplay: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.card,
    marginHorizontal: 1,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    minWidth: 20,
  },
  totalContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 16,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  unavailableText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 2,
    fontWeight: '500',
  },
  rightActionsContainer: {
    flexDirection: 'row',
  },
  actionContainer: {
    width: ACTION_WIDTH,
  },
  action: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  saveAction: {
    backgroundColor: '#2196F3',
  },
  favoriteAction: {
    backgroundColor: '#FF6B6B',
  },
  deleteAction: {
    backgroundColor: '#FF3B30',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

export default SwipeableCartItem; 