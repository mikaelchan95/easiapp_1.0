import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { RectButton } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { COLORS, SHADOWS, SPACING } from '../../utils/theme';
import * as Animations from '../../utils/animations';
import { HapticFeedback, HapticPatterns } from '../../utils/haptics';
import QuantitySelector from '../UI/QuantitySelector';

interface CartItemProps {
  item: {
    id: string;
    productId: string;
    name: string;
    price: number;
    imageUrl: any;
    quantity: number;
  };
  onQuantityChange: (quantity: number) => void;
  onDelete: () => void;
  onSaveForLater?: () => void;
  onAddToFavorites?: () => void;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

type ProductNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetail'>;

const { width } = Dimensions.get('window');
const ACTION_WIDTH = 80;

const CartItem: React.FC<CartItemProps> = ({ 
  item, 
  onQuantityChange,
  onDelete,
  onSaveForLater,
  onAddToFavorites,
  onSwipeStart,
  onSwipeEnd
}) => {
  const navigation = useNavigation<ProductNavigationProp>();
  
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
  
  const handleItemPress = () => {
    navigation.navigate('ProductDetail', { id: item.productId });
  };
  
  // Format price with proper currency
  const formattedPrice = `$${(item.price * item.quantity).toFixed(2)}`;
  const formattedUnitPrice = `$${item.price.toFixed(2)}`;
  
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
      } else {
        onQuantityChange(0);
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
  
  // Handle quantity change
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity === 0) {
      confirmQuickDelete();
    } else {
      HapticFeedback.light();
      Animations.bounceAnimation(quantityBounce);
      onQuantityChange(newQuantity);
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
        <View style={[styles.card, isSwipeOpen && styles.cardSwiped]}>
          <TouchableOpacity 
            style={styles.imageContainer} 
            onPress={handleItemPress}
            activeOpacity={0.8}
          >
            <Image 
              source={typeof item.imageUrl === 'string' ? { uri: item.imageUrl } : item.imageUrl} 
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <Ionicons name="wine" size={12} color={COLORS.card} />
            </View>
          </TouchableOpacity>
          
          <View style={styles.content}>
            <TouchableOpacity onPress={handleItemPress}>
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
            </TouchableOpacity>
            
            <Text style={styles.unitPrice}>{formattedUnitPrice} each</Text>
            
            <View style={styles.actionRow}>
              <QuantitySelector
                value={item.quantity}
                onChange={handleQuantityChange}
                size="medium"
                productName={item.name}
                disabled={isDeleting}
              />
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{formattedPrice}</Text>
              </View>
            </View>
          </View>
        </View>
      </Swipeable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginBottom: SPACING.lg,
    ...SHADOWS.medium,
    minHeight: 130,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderRadius: 20,
  },
  cardSwiped: {
    shadowOpacity: 0.15,
    shadowOffset: { width: -2, height: 2 },
  },
  imageContainer: {
    width: 85,
    height: 85,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    flexShrink: 0,
    marginRight: 18,
    position: 'relative',
    ...SHADOWS.light,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  imageOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 80,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 6,
    color: COLORS.text,
    lineHeight: 22,
  },
  unitPrice: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginLeft: SPACING.md,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
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

export default CartItem; 