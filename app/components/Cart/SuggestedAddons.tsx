import React, { useState, useRef, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Animated,
  Image,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { products, Product } from '../../data/mockProducts';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../utils/theme';
import { CartNotificationContext } from '../../context/CartNotificationContext';
import { HapticFeedback } from '../../utils/haptics';
import * as Animations from '../../utils/animations';

interface SuggestedAddonsProps {
  cartProductIds: string[];
  onAddToCart: (product: Product) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = 140;
const CARD_SPACING = 12;

const SuggestedAddons: React.FC<SuggestedAddonsProps> = ({ 
  cartProductIds,
  onAddToCart
}) => {
  const [adding, setAdding] = useState<string | null>(null);
  const [addedProduct, setAddedProduct] = useState<string | null>(null);
  const { showCartNotification } = useContext(CartNotificationContext);
  
  // Animation references
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Filter and enhance product suggestions
  const suggestedProducts = products
    .filter(p => !cartProductIds.includes(p.id))
    .filter(p => p.inStock)
    .slice(0, 6) // Show more suggestions
    .map(product => ({
      ...product,
      // Add some mock "customers also bought" logic
      popularity: Math.floor(Math.random() * 100) + 50,
      discount: product.retailPrice > product.tradePrice ? 
        Math.round(((product.retailPrice - product.tradePrice) / product.retailPrice) * 100) : 0
    }))
    .sort((a, b) => b.popularity - a.popularity);
  
  // Animate on mount
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: 200,
      useNativeDriver: true
    }).start();
  }, []);
  
  if (suggestedProducts.length === 0) {
    return null;
  }
  
  const handleAddProduct = (product: Product) => {
    if (adding) return; // Prevent double-tap
    
    HapticFeedback.success();
    setAdding(product.id);
    
    // Animate header to draw attention
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1.03,
        duration: 150,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut
      }),
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
        easing: Animations.TIMING.easeInOut
      })
    ]).start();
    
    // Add to cart with delay for visual feedback
    setTimeout(() => {
      onAddToCart(product);
      setAdding(null);
      setAddedProduct(product.id);
      
      // Show global notification
      showCartNotification(product.name, 1);
      
      // Clear added state after delay
      setTimeout(() => {
        setAddedProduct(null);
      }, 2000);
    }, 400);
  };

  const renderProductCard = (product: Product & { popularity: number; discount: number }, index: number) => {
    const isAdding = adding === product.id;
    const isAdded = addedProduct === product.id;
    
    // Create parallax effect based on scroll position
    const inputRange = [
      (index - 1) * (CARD_WIDTH + CARD_SPACING),
      index * (CARD_WIDTH + CARD_SPACING),
      (index + 1) * (CARD_WIDTH + CARD_SPACING)
    ];
    
    const scale = scrollAnim.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp'
    });
    
    const opacity = scrollAnim.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
      extrapolate: 'clamp'
    });

    return (
      <Animated.View 
        key={product.id}
        style={[
          styles.productCard,
          {
            transform: [{ scale }],
            opacity,
          }
        ]}
      >
        <TouchableOpacity 
          onPress={() => handleAddProduct(product)}
          activeOpacity={0.8}
          disabled={isAdding}
          style={[
            styles.cardContent,
            isAdding && styles.cardAdding,
            isAdded && styles.cardAdded
          ]}
        >
          {/* Product Image */}
          <View style={styles.imageContainer}>
            <Image 
              source={product.imageUrl} 
              style={styles.productImage}
              resizeMode="contain"
            />
            
            {/* Discount Badge */}
            {product.discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{product.discount}% OFF</Text>
              </View>
            )}
            
            {/* Adding Overlay */}
            {isAdding && (
              <View style={styles.addingOverlay}>
                <Animated.View style={styles.addingSpinner}>
                  <Ionicons name="checkmark" size={20} color={COLORS.success} />
                </Animated.View>
              </View>
            )}
          </View>
          
          {/* Product Info */}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {product.name}
            </Text>
            
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>
                ${product.tradePrice.toFixed(0)}
              </Text>
              {product.discount > 0 && (
                <Text style={styles.originalPrice}>
                  ${product.retailPrice.toFixed(0)}
                </Text>
              )}
            </View>
            
            {/* Popularity Indicator */}
            <View style={styles.popularityContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.popularityText}>
                {product.popularity}% bought this
              </Text>
            </View>
          </View>
          
          {/* Add Button */}
          <View style={styles.addButtonContainer}>
            <View style={[
              styles.addButton,
              isAdding && styles.addButtonAdding,
              isAdded && styles.addButtonAdded
            ]}>
              {isAdding ? (
                <Ionicons name="hourglass" size={16} color={COLORS.accent} />
              ) : isAdded ? (
                <Ionicons name="checkmark" size={16} color={COLORS.success} />
              ) : (
                <Ionicons name="add" size={16} color={COLORS.accent} />
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Enhanced Header */}
      <Animated.View 
        style={[
          styles.header,
          { transform: [{ scale: headerAnim }] }
        ]}
      >
        <View style={styles.titleContainer}>
          <Ionicons name="people" size={20} color={COLORS.primary} style={styles.icon} />
          <Text style={styles.title}>Customers Also Bought</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.viewAllButton}
          activeOpacity={0.7}
          onPress={() => {
            HapticFeedback.light();
            Animations.pulseAnimation(headerAnim).start();
          }}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Product Carousel */}
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollAnim } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        snapToAlignment="start"
      >
        {suggestedProducts.map(renderProductCard)}
      </Animated.ScrollView>
      
      {/* Subtle divider */}
      <View style={styles.divider} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  title: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.card,
  },
  viewAllText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
  },
  productCard: {
    width: CARD_WIDTH,
    marginRight: CARD_SPACING,
  },
  cardContent: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    ...SHADOWS.light,
  },
  cardAdding: {
    backgroundColor: '#f8f8f8',
    transform: [{ scale: 0.98 }],
  },
  cardAdded: {
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    marginBottom: 8,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.accent,
    fontWeight: '700',
  },
  addingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addingSpinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  productInfo: {
    flex: 1,
    marginBottom: 8,
  },
  productName: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    ...TYPOGRAPHY.h5,
    fontWeight: '700',
    marginRight: 6,
  },
  originalPrice: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  popularityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popularityText: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  addButtonContainer: {
    alignItems: 'center',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  addButtonAdding: {
    backgroundColor: COLORS.textSecondary,
  },
  addButtonAdded: {
    backgroundColor: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    opacity: 0.5,
  },
});

export default SuggestedAddons; 