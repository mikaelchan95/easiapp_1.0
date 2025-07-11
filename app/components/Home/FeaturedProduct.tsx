import React, { useRef, useContext, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Dimensions,
  ImageSourcePropType,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../utils/pricing';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { AppContext } from '../../context/AppContext';
import { CartNotificationContext } from '../../context/CartNotificationContext';
import { HapticFeedback } from '../../utils/haptics';
import * as Animations from '../../utils/animations';

interface FeaturedProductProps {
  product: Product;
  onPress: (product: Product) => void;
}

const FeaturedProduct: React.FC<FeaturedProductProps> = ({ product, onPress }) => {
  const { dispatch } = useContext(AppContext);
  const { showCartNotification } = useContext(CartNotificationContext);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const addButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  
  const {
    id,
    name,
    price,
    originalPrice,
    imageUrl,
    category,
    rating,
    inStock,
    description
  } = product;

  const handlePress = () => {
    HapticFeedback.selection();
    onPress(product);
  };

  const handleAddToCart = async () => {
    if (!inStock || isAdding) return;
    
    HapticFeedback.medium();
    Animations.heartbeatAnimation(addButtonScaleAnim);
    
    setIsAdding(true);
  
    // Immediate feedback - show loading state
    setTimeout(() => {
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

      // Show success state
      setIsAdding(false);
      setJustAdded(true);
      
      // Success animation
      Animated.sequence([
        Animated.spring(successAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        }),
        Animated.delay(1500),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setJustAdded(false);
      });

      showCartNotification(name, 1);
      HapticFeedback.success();
    }, 300); // Realistic loading time
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const formattedPrice = `$${price.toFixed(2)}`;
  const formattedOriginalPrice = originalPrice ? `$${originalPrice.toFixed(2)}` : null;
  const hasDiscount = originalPrice !== undefined && originalPrice > price;
  const discountPercentage = hasDiscount ? Math.round(((originalPrice! - price) / originalPrice!) * 100) : 0;
  
  const imageSource: ImageSourcePropType = imageUrl;

  // Enhanced button messaging
  const getButtonText = () => {
    if (isAdding) return 'Adding...';
    if (justAdded) return 'Added to Cart!';
    if (!inStock) return 'Sold Out';
    return 'Add to Cart';
  };

  const getButtonIcon = () => {
    if (isAdding) return null;
    if (justAdded) return 'checkmark-circle';
    if (!inStock) return 'close-circle';
    return 'add-circle';
  };
  
  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity 
        style={styles.touchableContainer}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
    >
      <View style={styles.content}>
          {/* Product Image */}
          <View style={styles.imageContainer}>
            <Image
              source={imageSource}
              style={styles.image}
              resizeMode="contain"
            />
            
            {/* Discount Badge */}
            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
              </View>
            )}
            
            {/* Stock Indicator */}
            <View style={[
              styles.stockIndicator,
              { backgroundColor: inStock ? COLORS.success : COLORS.error }
            ]} />

            {/* Featured Badge */}
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={10} color="#FFD700" />
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          </View>

          {/* Product Info */}
          <View style={styles.infoContainer}>
            <View style={styles.header}>
              <Text style={styles.category}>{category}</Text>
              
              {/* Rating */}
              {rating && (
            <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
          )}
            </View>

            <Text style={styles.name} numberOfLines={2}>
              {name}
            </Text>

            {description && (
              <Text style={styles.description} numberOfLines={2}>
                {description}
              </Text>
            )}

            <View style={styles.footer}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formattedPrice}</Text>
                {hasDiscount && (
                  <Text style={styles.originalPrice}>{formattedOriginalPrice}</Text>
            )}
          </View>

              <Animated.View style={{ 
                transform: [
                  { scale: addButtonScaleAnim },
                  { scale: successAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1]
                  })}
                ] 
              }}>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    isAdding && styles.addButtonLoading,
                    justAdded && styles.addButtonSuccess,
                    !inStock && styles.addButtonDisabled
                  ]}
                  onPress={handleAddToCart}
                  disabled={!inStock || isAdding}
                >
                  {isAdding ? (
                    <ActivityIndicator size="small" color={COLORS.accent} />
                  ) : (
                    <Ionicons
                      name={getButtonIcon() as any}
                      size={20}
                      color={!inStock ? COLORS.inactive : justAdded ? COLORS.accent : COLORS.accent}
                    />
                  )}
                  <Text style={[
                    styles.addButtonText,
                    !inStock && styles.addButtonTextDisabled,
                    justAdded && styles.addButtonTextSuccess
                  ]}>
                    {getButtonText()}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
        </View>
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.medium,
    marginHorizontal: SPACING.md,
  },
  touchableContainer: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    padding: SPACING.lg,
  },
  imageContainer: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: SPACING.md,
  },
  image: {
    width: '85%',
    height: '85%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.error,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  stockIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  featuredText: {
    ...TYPOGRAPHY.tiny,
    color: '#FFD700',
    fontWeight: '600',
    marginLeft: 2,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  category: {
    ...TYPOGRAPHY.label,
    color: COLORS.secondary,
    textTransform: 'capitalize',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...TYPOGRAPHY.label,
    marginLeft: 2,
    fontWeight: '600',
  },
  name: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    color: COLORS.primary,
  },
  description: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  price: {
    ...TYPOGRAPHY.h3,
    fontWeight: '800',
    color: COLORS.primary,
  },
  originalPrice: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.inactive,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    ...SHADOWS.light,
    minWidth: 120,
    justifyContent: 'center',
  },
  addButtonLoading: {
    backgroundColor: COLORS.secondary,
  },
  addButtonSuccess: {
    backgroundColor: COLORS.success,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  addButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.accent,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  addButtonTextDisabled: {
    color: COLORS.inactive,
  },
  addButtonTextSuccess: {
    color: COLORS.accent,
  },
});

export default FeaturedProduct; 