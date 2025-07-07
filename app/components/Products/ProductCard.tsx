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
}

const ProductCard: React.FC<ProductCardProps> = ({
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
    
    // After a short delay, show success and cart notification
    setTimeout(() => {
      setIsAdding(false);
      // Show global cart notification
      showCartNotification(name);
    }, 500);
  };

  const formattedPrice = `$${price.toFixed(2)}`;
  const formattedOriginalPrice = originalPrice ? `$${originalPrice.toFixed(2)}` : null;
  
  // Calculate discount logic
  const hasDiscount = originalPrice !== undefined && originalPrice > price;
  
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
        </View>
        
        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.category} numberOfLines={1}>{category}</Text>
          <Text 
            style={[styles.name, isCompact && styles.compactName]} 
            numberOfLines={isCompact ? 1 : 2}
          >
            {name}
          </Text>
          
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
                isAdding && styles.addButtonActive
              ]}
              onPress={handleAddButtonPress}
            >
              <Ionicons 
                name={isAdding ? "checkmark" : "add"} 
                size={18} 
                color={COLORS.accent} 
              />
            </TouchableOpacity>
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
  compactName: {
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
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
  }
});

export default ProductCard; 