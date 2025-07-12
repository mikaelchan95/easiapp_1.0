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
  Animated,
  Easing
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../utils/pricing';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import * as Animations from '../../utils/animations';
import { AppContext } from '../../context/AppContext';
import { CartNotificationContext } from '../../context/CartNotificationContext';
import { formatFinancialAmount } from '../../utils/formatting';

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
  
  // Handle press animation using existing animation utilities
  const handlePressIn = () => {
    Animations.pressFeedback(scaleAnim).start();
  };
  
  const handlePressOut = () => {
    Animations.releaseFeedback(scaleAnim).start();
  };
  
  // Handle add button animation with improved feedback
  const handleAddButtonPress = () => {
    if (!inStock || isAdding) return;
    
    // Animate the button with heartbeat effect
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
    }, 600);
  };

  const formattedPrice = formatFinancialAmount(price);
  const formattedOriginalPrice = originalPrice ? formatFinancialAmount(originalPrice) : null;
  
  // Calculate discount logic
  const hasDiscount = originalPrice !== undefined && originalPrice > price;
  
  // Helper function to generate Supabase Storage URL
  const getSupabaseStorageUrl = (path: string): string => {
    // If it's just a filename (no slashes), add the full path
    if (!path.includes('/')) {
      return `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/${path}`;
    }
    // If path already includes product-images/, use as-is
    if (path.includes('product-images/')) {
      return `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/${path}`;
    }
    // If path starts with products/, add the bucket name
    if (path.startsWith('products/')) {
      return `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/${path}`;
    }
    // Fallback - assume it's a full relative path
    return `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/${path}`;
  };

  // Helper to get image source using smart mapping
  const getImageSourceByName = (productName: string): { uri: string } => {
    const normalizedName = productName.toLowerCase().trim();
    
    // Product name to image filename mapping
    const imageMapping: Record<string, string> = {
      // Macallan products
      'macallan 12': 'macallan-12-double-cask.webp',
      'macallan 18': 'macallan-18-sherry-oak.webp',
      'macallan 25': 'macallan-25-sherry-oak.webp',
      'macallan 30': 'macallan-30-sherry-oak.webp',
      
      // Dom Pérignon
      'dom pérignon': 'dom-perignon-2013.webp',
      'dom perignon': 'dom-perignon-2013.webp',
      
      // Château Margaux
      'château margaux': 'chateau-margaux-2015-1.png',
      'chateau margaux': 'chateau-margaux-2015-1.png',
      'margaux': 'margaux-919557.webp',
      
      // Hennessy
      'hennessy': 'HENNESSY-PARADIS-70CL-CARAFE-2000x2000px.webp',
      'hennessy paradis': 'HENNESSY-PARADIS-70CL-CARAFE-2000x2000px.webp',
      
      // Johnnie Walker
      'johnnie walker': 'Johnnie-Walker-Blue-Label-750ml-600x600.webp',
      'johnnie walker blue': 'Johnnie-Walker-Blue-Label-750ml-600x600.webp',
      'blue label': 'Johnnie-Walker-Blue-Label-750ml-600x600.webp',
    };
    
    // Check for exact matches first
    if (imageMapping[normalizedName]) {
      const filename = imageMapping[normalizedName];
      return { uri: `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/${filename}` };
    }
    
    // Check for partial matches
    for (const [key, filename] of Object.entries(imageMapping)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return { uri: `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/${filename}` };
      }
    }
    
    // Default fallback
    return { uri: `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/product-images/products/placeholder-product.webp` };
  };

  // Handle both string URLs (Supabase) and require() statements with better fallback
  const getImageSource = () => {
    console.log('🖼️ ProductCard Image Debug:', { 
      productId: id,
      productName: name,
      imageUrl: imageUrl,
      imageType: typeof imageUrl 
    });

    // Use smart mapping based on product name
    const mappedSource = getImageSourceByName(name);
    console.log('🎯 Using mapped URL for', name, ':', mappedSource.uri);
    return mappedSource;
  };

  const imageSource = getImageSource();

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

  // For minimal variant, we may want a different layout for some elements
  const isMinimal = variant === 'minimal';

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
            onError={(error) => {
              console.error('❌ Image load error for product:', name, error.nativeEvent.error);
            }}
            onLoad={() => {
              console.log('✅ Image loaded successfully for product:', name);
            }}
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
          {/* Only show category in default and featured variants */}
          {!isMinimal && (
            <Text style={styles.category} numberOfLines={1}>{category}</Text>
          )}
          
          <Text 
            style={[
              styles.name, 
              isCompact && styles.compactName,
              isMinimal && styles.minimalName
            ]} 
            numberOfLines={isMinimal ? 1 : 2}
          >
            {name}
          </Text>
          
          {/* Rating - only show in default and featured variants */}
          {rating && !isMinimal && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          )}
          
          <View style={[styles.footer, isMinimal && styles.minimalFooter]}>
            <View style={styles.priceContainer}>
              <Text style={[styles.price, isMinimal && styles.minimalPrice]}>
                {formattedPrice}
              </Text>
              {hasDiscount && !isMinimal && (
                <Text style={styles.originalPrice}>{formattedOriginalPrice}</Text>
              )}
            </View>
            
            <Animated.View style={{ transform: [{ scale: addButtonScaleAnim }] }}>
              <TouchableOpacity 
                style={[
                  styles.addButton,
                  isAdding && styles.addButtonActive,
                  !inStock && styles.addButtonDisabled
                ]}
                onPress={handleAddButtonPress}
                disabled={!inStock || isAdding}
                activeOpacity={0.7}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons 
                  name={isAdding ? "checkmark" : !inStock ? "close" : "add"} 
                  size={20} 
                  color={!inStock ? COLORS.inactive : COLORS.accent} 
                />
              </TouchableOpacity>
            </Animated.View>
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
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
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
    ...TYPOGRAPHY.caption,
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
    ...TYPOGRAPHY.caption,
    color: COLORS.inactive,
    marginBottom: SPACING.xs,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  name: {
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
  },
  minimalName: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginBottom: 2,
    fontWeight: '600',
    minHeight: 32, // Smaller height for 1 line
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
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: SPACING.element,
    paddingTop: SPACING.xs,
  },
  minimalFooter: {
    marginTop: 4,
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
  minimalPrice: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 14,
    fontWeight: '700',
  },
  originalPrice: {
    ...TYPOGRAPHY.caption,
    color: COLORS.inactive,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  addButton: {
    width: 44, // Increased for better touch target
    height: 44, // Increased for better touch target
    borderRadius: 22,
    backgroundColor: COLORS.buttonBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.element,
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