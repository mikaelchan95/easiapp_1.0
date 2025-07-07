import React, { useRef, useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  StyleProp,
  ViewStyle,
  ImageSourcePropType,
  Animated,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../data/mockProducts';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import * as Animations from '../../utils/animations';
import { AppContext } from '../../context/AppContext';
import { CartNotificationContext } from '../../context/CartNotificationContext';
import ProgressBar from '../UI/ProgressBar';
import { HapticFeedback, HapticPatterns } from '../../utils/haptics';

interface EnhancedProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  isCompact?: boolean;
  style?: StyleProp<ViewStyle>;
  animationDelay?: number;
}

const EnhancedProductCard: React.FC<EnhancedProductCardProps> = ({
  product,
  onPress,
  isCompact = false,
  style,
  animationDelay = 0
}) => {
  const {
    id, 
    name, 
    price, 
    originalPrice,
    imageUrl, 
    category,
    rating,
    inStock
  } = product;

  // Get app context for cart functionality
  const { state, dispatch } = useContext(AppContext);
  
  // Get cart notification context
  const { showCartNotification } = useContext(CartNotificationContext);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(10)).current;
  const addButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const addProgressAnim = useRef(new Animated.Value(0)).current;
  const streakAnim = useRef(new Animated.Value(0)).current;
  
  // State variables
  const [isAdding, setIsAdding] = useState(false);
  const [showAddProgress, setShowAddProgress] = useState(false);
  const [purchaseCount, setPurchaseCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  
  // Check if this product is in the cart and its quantity
  useEffect(() => {
    const cartItem = state.cart.find(item => item.product.id === id);
    if (cartItem) {
      setPurchaseCount(cartItem.quantity);
    }
  }, [state.cart, id]);
  
  // Increment streak count when purchase count changes
  useEffect(() => {
    if (purchaseCount > 0 && purchaseCount % 3 === 0) {
      // Every 3 purchases, increment streak
      setStreakCount(prevStreak => prevStreak + 1);
      setShowStreakAnimation(true);
      
      // Hide streak animation after delay
      setTimeout(() => {
        setShowStreakAnimation(false);
      }, 3000);
    }
  }, [purchaseCount]);
  
  // Start entrance animation
  useEffect(() => {
    // Delay based on provided prop
    const delay = animationDelay;
    
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 300,
        delay,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        delay,
        useNativeDriver: true
      })
    ]).start();
  }, []);
  
  // Handle press animation
  const handlePressIn = () => {
    HapticFeedback.light();
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 150,
      useNativeDriver: true,
      easing: Animations.TIMING.easeOut
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true
    }).start();
  };
  
  // Handle add button animation
  const handleAddButtonPress = () => {
    // Only proceed if the product is in stock
    if (!inStock) return;
    
    // Haptic feedback for add to cart
    HapticPatterns.addToCart();
    
    // Show progress UI
    setShowAddProgress(true);
    setIsAdding(true);
    
    // Animate add button
    Animations.heartbeatAnimation(addButtonScaleAnim);
    
    // Animate progress bar
    addProgressAnim.setValue(0);
    Animated.timing(addProgressAnim, {
      toValue: 1,
      duration: 800,
      easing: Animations.TIMING.easeOut,
      useNativeDriver: false
    }).start(({ finished }) => {
      if (finished) {
        // Add to cart after progress completes
        dispatch({ 
          type: 'ADD_TO_CART', 
          payload: { 
            product: {
              id: product.id,
              name: product.name,
              price: product.price,
              image: product.imageUrl,
              stock: product.inStock ? 10 : 0,
              category: product.category || '',
              description: product.description || '',
              sku: product.id,
              retailPrice: product.price,
              tradePrice: product.price * 0.9,
            }, 
            quantity: 1 
          } 
        });
        
        // Show cart notification
        showCartNotification(name);
        
        // Reset UI state
        setTimeout(() => {
          setIsAdding(false);
          setShowAddProgress(false);
        }, 500);
      }
    });
  };

  const formattedPrice = `$${price.toFixed(2)}`;
  const formattedOriginalPrice = originalPrice ? `$${originalPrice.toFixed(2)}` : null;
  
  // Calculate discount logic
  const hasDiscount = originalPrice !== undefined && originalPrice > price;
  
  // Progress calculations
  const nextStreakProgress = purchaseCount % 3 / 3;
  
  // The imageUrl is already an ImageSourcePropType when using require()
  const imageSource: ImageSourcePropType = imageUrl;

  return (
    <Animated.View
      style={[
        styles.container, 
        isCompact ? styles.compactContainer : null,
        style,
        {
          opacity: opacityAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: translateYAnim }
          ]
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.touchableContainer}
        onPress={() => onPress(product)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={imageSource}
            style={styles.image}
            resizeMode="contain"
          />
          
          {/* Stock indicator dot */}
          <View style={[
            styles.stockIndicator, 
            { backgroundColor: inStock ? COLORS.success : COLORS.error }
          ]} />
          
          {/* Purchase count badge */}
          {purchaseCount > 0 && (
            <View style={styles.purchaseCountBadge}>
              <Text style={styles.purchaseCountText}>{purchaseCount}</Text>
            </View>
          )}
        </View>
        
        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.category} numberOfLines={1}>{category}</Text>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
          
          {/* Streak Progress Bar */}
          {purchaseCount > 0 && (
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={nextStreakProgress}
                height={4}
                fillColor={COLORS.success}
                backgroundColor="#E0E0E0"
                animated={true}
                streakCount={streakCount}
                streakEnabled={true}
                showStreakAnimation={showStreakAnimation}
              />
              {nextStreakProgress < 1 && (
                <Text style={styles.progressText}>
                  {3 - (purchaseCount % 3)} more to streak!
                </Text>
              )}
            </View>
          )}
          
          <View style={styles.footer}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{formattedPrice}</Text>
              {hasDiscount && (
                <Text style={styles.originalPrice}>{formattedOriginalPrice}</Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={[
                styles.addButton,
                isAdding && styles.addButtonActive,
                !inStock && styles.addButtonDisabled
              ]}
              onPress={handleAddButtonPress}
              disabled={!inStock || isAdding}
            >
              {isAdding ? (
                <Ionicons name="checkmark" size={18} color={COLORS.accent} />
              ) : (
                <Animated.View style={{ transform: [{ scale: addButtonScaleAnim }] }}>
                  <Ionicons name="add" size={18} color={COLORS.accent} />
                </Animated.View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Add to cart progress overlay */}
        {showAddProgress && (
          <View style={styles.progressOverlay}>
            <ProgressBar
              progress={addProgressAnim}
              height={8}
              width="80%"
              fillColor={COLORS.success}
              backgroundColor="rgba(255,255,255,0.3)"
              animated={false}
              showLabel={true}
              labelPosition="bottom"
              labelStyle={styles.progressLabel}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');
const cardWidth = (width - (SPACING.md * 3)) / 2; // 2 cards per row with margins

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 0,
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: SPACING.md,
    height: 350, // Fixed height for standard card
  },
  touchableContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  compactContainer: {
    width: 160,
    height: 250, // Fixed height for compact card
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    padding: 4,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 8,
  },
  stockIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  purchaseCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  purchaseCountText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    padding: 12,
    backgroundColor: COLORS.card,
    justifyContent: 'space-between',
  },
  category: {
    fontSize: 12,
    color: COLORS.inactive,
    marginBottom: 4,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    lineHeight: 20,
    // Truncate to 2 lines
    flexShrink: 1,
  },
  progressContainer: {
    marginTop: 4,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 10,
    color: COLORS.inactive,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 22,
  },
  originalPrice: {
    fontSize: 13,
    color: COLORS.inactive,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonActive: {
    backgroundColor: COLORS.success,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.inactive,
    opacity: 0.5,
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  progressLabel: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  }
});

export default EnhancedProductCard; 