import React, { useRef, useState, useContext } from 'react';
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

export interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  isCompact?: boolean;
  style?: StyleProp<ViewStyle>;
  animationDelay?: number;
  variant?: 'default' | 'featured' | 'minimal';
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  isCompact = false,
  style,
  animationDelay = 0,
  variant = 'default'
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
  const { dispatch } = useContext(AppContext);
  // Get cart notification context
  const { showCartNotification } = useContext(CartNotificationContext);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(10)).current;
  
  // Additional animation for the add button
  const addButtonScaleAnim = useRef(new Animated.Value(1)).current;
  
  // State for loading feedback
  const [isAdding, setIsAdding] = useState(false);
  
  // Start entrance animation
  React.useEffect(() => {
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
    // Animate the button
    Animations.heartbeatAnimation(addButtonScaleAnim);
    
    // Show adding state
    setIsAdding(true);
    
    // Add to cart
    dispatch({ 
      type: 'ADD_TO_CART', 
      payload: { 
        product: {
          id: product.id,
          name: product.name,
          image: product.imageUrl,
          stock: product.inStock ? 10 : 0,
          category: product.category || '',
          description: product.description || '',
          sku: product.sku,
          retailPrice: product.price,
          tradePrice: product.tradePrice,
        }, 
        quantity: 1 
      } 
    });
    
    // After a short delay, show success and cart notification
    setTimeout(() => {
      setIsAdding(false);
      // Show global cart notification with quantity
      showCartNotification(name, 1);
    }, 500);
  };

  const formattedPrice = `$${price.toFixed(2)}`;
  const formattedOriginalPrice = originalPrice ? `$${originalPrice.toFixed(2)}` : null;
  
  // Calculate discount logic
  const hasDiscount = originalPrice !== undefined && originalPrice > price;
  
  // The imageUrl is already an ImageSourcePropType when using require()
  const imageSource: ImageSourcePropType = imageUrl;

  // Get variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'featured':
        return {
          container: styles.featuredContainer,
          image: styles.featuredImage,
          info: styles.featuredInfo
        };
      case 'minimal':
        return {
          container: styles.minimalContainer,
          image: styles.minimalImage,
          info: styles.minimalInfo
        };
      default:
        return {
          container: null,
          image: null,
          info: null
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <Animated.View
      style={[
        styles.container, 
        variantStyles.container,
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
        <View style={[styles.imageContainer, variantStyles.image]}>
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

          {/* Discount badge */}
          {hasDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {Math.round(((originalPrice! - price) / originalPrice!) * 100)}% OFF
              </Text>
            </View>
          )}
        </View>
        
        {/* Product Info */}
        <View style={[styles.infoContainer, variantStyles.info]}>
          <Text style={styles.category} numberOfLines={1}>{category}</Text>
          <Text 
            style={[styles.name, isCompact && styles.compactName]} 
            numberOfLines={isCompact ? 1 : 2}
          >
            {name}
          </Text>
          
          {/* Rating */}
          {rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          )}
          
          <View style={styles.footer}>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>{formattedPrice}</Text>
              {hasDiscount && (
                <Text style={styles.originalPrice}>{formattedOriginalPrice}</Text>
              )}
            </View>
            
<<<<<<< HEAD:app/components/Products/ProductCard.tsx
            <TouchableOpacity 
              style={[
                styles.addButton,
                isAdding && styles.addButtonActive
              ]}
              onPress={handleAddButtonPress}
            >
              <Ionicons 
                name={isAdding ? "checkmark" : "add"} 
                size={18} 
                color={COLORS.buttonText} 
              />
            </TouchableOpacity>
=======
            <Animated.View style={{ transform: [{ scale: addButtonScaleAnim }] }}>
              <TouchableOpacity 
                style={[
                  styles.addButton,
                  isAdding && styles.addButtonActive,
                  !inStock && styles.addButtonDisabled
                ]}
                onPress={handleAddButtonPress}
                disabled={!inStock}
              >
                <Ionicons 
                  name={isAdding ? "checkmark" : !inStock ? "close" : "add"} 
                  size={18} 
                  color={!inStock ? COLORS.inactive : COLORS.accent} 
                />
              </TouchableOpacity>
            </Animated.View>
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance):app/components/UI/ProductCard.tsx
          </View>
        </View>
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
<<<<<<< HEAD:app/components/Products/ProductCard.tsx
    ...SHADOWS.medium,
=======
    ...SHADOWS.light,
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance):app/components/UI/ProductCard.tsx
    marginBottom: SPACING.md,
    // Dynamic height based on content instead of fixed
    minHeight: 320,
  },
  touchableContainer: {
    width: '100%',
    flex: 1,
  },
  compactContainer: {
    width: 160,
    minHeight: 240,
  },
  
  // Featured variant
  featuredContainer: {
    width: cardWidth * 1.2,
    height: 380,
    ...SHADOWS.medium,
  },
  featuredImage: {
    height: '60%',
  },
  featuredInfo: {
    padding: SPACING.md,
  },
  
  // Minimal variant
  minimalContainer: {
    width: 140,
    height: 200,
    borderRadius: 12,
  },
  minimalImage: {
    height: '65%',
  },
  minimalInfo: {
    padding: SPACING.sm,
  },
  
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    padding: SPACING.element,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
  },
  stockIndicator: {
    position: 'absolute',
    bottom: SPACING.element,
    right: SPACING.element,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    padding: SPACING.card,
    backgroundColor: COLORS.card,
    justifyContent: 'space-between',
    minHeight: 100, // Ensure consistent spacing
  },
  category: {
<<<<<<< HEAD:app/components/Products/ProductCard.tsx
    ...TYPOGRAPHY.small,
    color: COLORS.inactive,
    marginBottom: SPACING.xs,
=======
    ...TYPOGRAPHY.label,
    marginBottom: 4,
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance):app/components/UI/ProductCard.tsx
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  name: {
<<<<<<< HEAD:app/components/Products/ProductCard.tsx
    ...TYPOGRAPHY.h4,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.element,
    flexShrink: 1,
  },
  compactName: {
    fontSize: 13,
    marginBottom: SPACING.xs,
=======
    ...TYPOGRAPHY.h5,
    fontWeight: '700',
    marginBottom: 8,
    // Truncate to 2 lines
    flexShrink: 1,
  },
  compactName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    ...TYPOGRAPHY.label,
    marginLeft: 2,
    fontWeight: '600',
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance):app/components/UI/ProductCard.tsx
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: SPACING.element,
    paddingTop: SPACING.xs,
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
  },
  price: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
  },
  originalPrice: {
<<<<<<< HEAD:app/components/Products/ProductCard.tsx
    ...TYPOGRAPHY.small,
=======
    ...TYPOGRAPHY.bodySmall,
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance):app/components/UI/ProductCard.tsx
    color: COLORS.inactive,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.buttonBg,
    justifyContent: 'center',
    alignItems: 'center',
<<<<<<< HEAD:app/components/Products/ProductCard.tsx
    marginLeft: SPACING.element,
=======
>>>>>>> 4938d2d (✨ refactor(home): simplify HomeScreen UI and optimize performance):app/components/UI/ProductCard.tsx
    ...SHADOWS.light,
  },
  addButtonActive: {
    backgroundColor: COLORS.success,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.border,
  }
});

export default ProductCard; 