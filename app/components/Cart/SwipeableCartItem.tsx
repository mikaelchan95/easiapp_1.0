import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING } from '../../utils/theme';
import * as Animations from '../../utils/animations';

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
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3;

const SwipeableCartItem: React.FC<CartItemProps> = ({
  item,
  onQuantityChange,
  onDelete,
  onSwipeStart,
  onSwipeEnd
}) => {
  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const itemHeight = useRef(new Animated.Value(90)).current;
  const itemOpacity = useRef(new Animated.Value(1)).current;
  const itemScale = useRef(new Animated.Value(1)).current;
  const itemMargin = useRef(new Animated.Value(8)).current;
  const deleteButtonOpacity = useRef(new Animated.Value(0)).current;
  
  // Track swipe state
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Handle quantity changes
  const incrementQuantity = () => {
    if (item.inStock) {
      // Add haptic feedback animation
      Animated.sequence([
        Animated.timing(itemScale, {
          toValue: 1.02,
          duration: 50,
          useNativeDriver: true,
          easing: Animations.TIMING.easeOut
        }),
        Animated.timing(itemScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
          easing: Animations.TIMING.easeInOut
        })
      ]).start();
      
      onQuantityChange(item.quantity + 1);
    }
  };
  
  const decrementQuantity = () => {
    if (item.quantity > 1) {
      // Add haptic feedback animation
      Animated.sequence([
        Animated.timing(itemScale, {
          toValue: 0.98,
          duration: 50,
          useNativeDriver: true,
          easing: Animations.TIMING.easeOut
        }),
        Animated.timing(itemScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
          easing: Animations.TIMING.easeInOut
        })
      ]).start();
      
      onQuantityChange(item.quantity - 1);
    } else {
      // Prompt to remove item
      confirmDelete();
    }
  };
  
  // Confirm delete with animation
  const confirmDelete = () => {
    Alert.alert(
      'Remove Item',
      `Remove ${item.name} from your cart?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resetPosition()
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: handleDelete
        }
      ]
    );
  };
  
  // Delete animation and callback
  const handleDelete = () => {
    setIsDeleting(true);
    
    // Animate item removal
    Animated.parallel([
      Animated.timing(itemHeight, {
        toValue: 0,
        duration: 200,
        easing: Animations.TIMING.easeInOut,
        useNativeDriver: false
      }),
      Animated.timing(itemOpacity, {
        toValue: 0,
        duration: 200,
        easing: Animations.TIMING.easeInOut,
        useNativeDriver: true
      }),
      Animated.timing(itemMargin, {
        toValue: 0,
        duration: 200,
        easing: Animations.TIMING.easeInOut,
        useNativeDriver: false
      })
    ]).start(() => {
      if (onDelete) {
        onDelete();
      }
    });
  };
  
  // Reset card position
  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      friction: 5,
      tension: 100,
      useNativeDriver: true
    }).start(() => {
      setIsSwiping(false);
      if (onSwipeEnd) {
        onSwipeEnd();
      }
    });
    
    // Hide delete button
    Animated.timing(deleteButtonOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true
    }).start();
  };
  
  // Handle swipe to delete threshold
  const completeSwipe = () => {
    Animated.timing(translateX, {
      toValue: -width,
      duration: 200,
      easing: Animations.TIMING.easeOut,
      useNativeDriver: true
    }).start(handleDelete);
  };
  
  // Configure pan responder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture horizontal movements greater than 10
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        setIsSwiping(true);
        if (onSwipeStart) {
          onSwipeStart();
        }
        
        // Show delete button with animation
        Animated.timing(deleteButtonOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow leftward swipe (negative dx)
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          completeSwipe();
        } else {
          resetPosition();
        }
      },
      onPanResponderTerminate: () => {
        resetPosition();
      }
    })
  ).current;
  
  // Background delete button position is synchronized with the card movement
  const deleteButtonPosition = translateX.interpolate({
    inputRange: [-width, 0],
    outputRange: [0, width],
    extrapolate: 'clamp'
  });
  
  return (
    <Animated.View 
      style={[
        styles.container,
        {
          height: itemHeight,
          opacity: itemOpacity,
          marginVertical: itemMargin,
          transform: [{ scale: itemScale }]
        }
      ]}
    >
      {/* Background delete button */}
      <Animated.View
        style={[
          styles.deleteButtonContainer,
          {
            transform: [{ translateX: deleteButtonPosition }],
            opacity: deleteButtonOpacity
          }
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={confirmDelete}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
          <Text style={styles.deleteText}>Remove</Text>
        </TouchableOpacity>
      </Animated.View>
      
      {/* Swipeable Card */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          {
            transform: [{ translateX }]
          }
        ]}
      >
        <View style={styles.contentContainer}>
          {/* Product Image */}
          <Image source={item.imageUrl} style={styles.image} resizeMode="cover" />
          
          {/* Product Details */}
          <View style={styles.detailsContainer}>
            <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>${item.price.toFixed(0)}</Text>
            
            {/* Quantity Selector */}
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                onPress={decrementQuantity}
                style={styles.quantityButton}
                disabled={isDeleting}
              >
                <Ionicons name="remove" size={16} color={COLORS.text} />
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{item.quantity}</Text>
              
              <TouchableOpacity
                onPress={incrementQuantity}
                style={styles.quantityButton}
                disabled={!item.inStock || isDeleting}
              >
                <Ionicons name="add" size={16} color={item.inStock ? COLORS.text : COLORS.inactive} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Total Price */}
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>${(item.price * item.quantity).toFixed(0)}</Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginVertical: 8,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    ...SHADOWS.light,
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  image: {
    width: 65,
    height: 65,
    borderRadius: 8,
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  totalContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  deleteButtonContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  }
});

export default SwipeableCartItem; 