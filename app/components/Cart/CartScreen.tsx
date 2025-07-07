import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Animated, 
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CartItem from './CartItem';
import SwipeableCartItem from './SwipeableCartItem';
import EmptyCart from './EmptyCart';
import SuggestedAddons from './SuggestedAddons';
import { products, Product } from '../../data/mockProducts';

// Import app context
import { AppContext } from '../../context/AppContext';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Animations from '../../utils/animations';
import AnimatedButton from '../UI/AnimatedButton';
import AnimatedFeedback from '../UI/AnimatedFeedback';
import { 
  calculateCartTotals, 
  formatPrice, 
  getProductPrice,
  getStockStatus,
  isProductInStock 
} from '../../utils/pricing';

interface CartItemType {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: any;
  quantity: number;
  inStock: boolean;
}

export default function CartScreen() {
  const navigation = useNavigation();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const summarySlideAnim = useRef(new Animated.Value(100)).current;
  
  // Feedback state
  const [feedback, setFeedback] = useState({
    visible: false,
    type: 'success' as 'success' | 'error' | 'info' | 'loading',
    message: ''
  });
  
  // Undo state for deleted items
  const [deletedItem, setDeletedItem] = useState<{ item: CartItem, timeout: NodeJS.Timeout | null }>({
    item: null as any,
    timeout: null
  });
  
  // Use the AppContext instead of local state
  const { state, dispatch } = React.useContext(AppContext);
  
  // Calculate totals using centralized pricing utility
  const cartTotals = calculateCartTotals(state.cart, state.user?.role || 'retail');
  
  // Map cart items from context to the format needed by the UI
  const cartItems = state.cart.map(item => {
    const stockStatus = getStockStatus(item.product);
    const priceWithGST = getProductPrice(item.product, state.user?.role || 'retail');
    
    return {
      id: item.product.id,
      productId: item.product.id,
      name: item.product.name,
      price: priceWithGST,
      imageUrl: item.product.image,
      quantity: item.quantity,
      inStock: isProductInStock(item.product, item.quantity),
      stockStatus: stockStatus
    };
  });
  
  const cartProductIds = cartItems.map(item => item.productId);
  
  // Animation values for list items (create one per item)
  const itemAnimations = useRef<Animated.Value[]>([]).current;
  
  // Make sure we have enough animation values
  useEffect(() => {
    // Create animation values for each item if needed
    while (itemAnimations.length < cartItems.length) {
      itemAnimations.push(new Animated.Value(0));
    }
  }, [cartItems]);
  
  // Animate components when they mount
  useEffect(() => {
    // Animate the main container
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true
    }).start();
    
    // Animate the summary bar with a slight delay
    Animated.timing(summarySlideAnim, {
      toValue: 0,
      duration: 300,
      delay: 300,
      easing: Animations.TIMING.easeOut,
      useNativeDriver: true
    }).start();
    
    // Animate each item with staggered timing
    const animations = itemAnimations.slice(0, cartItems.length).map((anim, index) => {
      return Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        easing: Animations.TIMING.easeOut,
        useNativeDriver: true
      });
    });
    
    Animated.stagger(50, animations).start();
  }, []);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      // Find the item being deleted
      const itemToDelete = state.cart.find(item => item.product.id === productId);
      if (!itemToDelete) return;
      
      // Clear any existing undo timeout
      if (deletedItem.timeout) {
        clearTimeout(deletedItem.timeout);
      }
      
      // Store the deleted item for undo
      const timeout = setTimeout(() => {
        setDeletedItem({ item: null as any, timeout: null });
      }, 5000); // 5 second undo window
      
      setDeletedItem({ item: itemToDelete, timeout });
      
      // Show undo feedback
      setFeedback({
        visible: true,
        type: 'info',
        message: 'Item removed • Undo'
      });
      
      // Remove the item
      dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
    } else {
      // Update quantity
      dispatch({ 
        type: 'UPDATE_CART_QUANTITY', 
        payload: { productId, quantity: newQuantity } 
      });
    }
  };
  
  const handleUndo = () => {
    if (deletedItem.item) {
      // Clear the timeout
      if (deletedItem.timeout) {
        clearTimeout(deletedItem.timeout);
      }
      
      // Restore the item
      dispatch({ 
        type: 'ADD_TO_CART', 
        payload: deletedItem.item 
      });
      
      // Clear deleted item state
      setDeletedItem({ item: null as any, timeout: null });
      
      // Show success feedback
      setFeedback({
        visible: true,
        type: 'success',
        message: 'Item restored'
      });
    }
  };

  const handleAddSuggested = (product: Product) => {
    setIsAddingProduct(true);
    
    // Add to cart using context
    dispatch({ 
      type: 'ADD_TO_CART', 
      payload: { 
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.imageUrl, // Use imageUrl directly
          stock: product.inStock ? 10 : 0,
          // Add other required product properties
          category: product.category || '',
          description: product.description || '',
          sku: product.id, // Use id as sku
          retailPrice: product.price,
          tradePrice: product.price * 0.9,
        }, 
        quantity: 1 
      } 
    });
    
    // Show feedback
    setFeedback({
      visible: true,
      type: 'success',
      message: 'Added to cart'
    });
    
    // Reset adding state
    setTimeout(() => {
      setIsAddingProduct(false);
    }, 500);
  };

  const handleCheckout = () => {
    // Animation for checkout button press
    Animations.pulseAnimation(new Animated.Value(1), false);
    
    // Navigate to checkout
    navigation.navigate('Checkout');
  };

  if (cartItems.length === 0) {
    return <EmptyCart />;
  }

  // Track active swipeable item to prevent multiple swipes
  const [activeSwipe, setActiveSwipe] = useState<string | null>(null);
  
  // Animate list item rendering with staggered animation
  const renderItem = ({ item, index }: { item: CartItemType, index: number }) => {
    // Get the animation value for this item (or create it if needed)
    if (!itemAnimations[index]) {
      itemAnimations[index] = new Animated.Value(0);
    }
    
    return (
      <Animated.View
        style={{
          opacity: itemAnimations[index],
          transform: [
            { 
              translateY: itemAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              }) 
            }
          ]
        }}
      >
        <SwipeableCartItem 
          item={item} 
          onQuantityChange={(quantity) => handleQuantityChange(item.productId, quantity)}
          onDelete={() => handleQuantityChange(item.productId, 0)}
          onSwipeStart={() => setActiveSwipe(item.id)}
          onSwipeEnd={() => setActiveSwipe(null)}
        />
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Status Bar Spacer */}
      <View style={{ height: insets.top, backgroundColor: COLORS.card }} />
      
      {/* Header with Cart title */}
      <Animated.View 
        style={[
          styles.headerContainer,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
        <View style={styles.placeholder} />
      </Animated.View>
      
      <FlatList
        data={cartItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        style={styles.listContainer}
        ListFooterComponent={
          <SuggestedAddons 
            cartProductIds={cartProductIds}
            onAddToCart={handleAddSuggested}
          />
        }
        showsVerticalScrollIndicator={false}
      />
      
      {/* Sticky Summary Bar - Animated */}
      <Animated.View 
        style={[
          styles.summaryBar,
          { 
            transform: [{ translateY: summarySlideAnim }],
            opacity: fadeAnim 
          }
        ]}
      >
        <View style={styles.summaryContent}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(cartTotals.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST (9%)</Text>
            <Text style={styles.summaryValue}>{formatPrice(cartTotals.gst)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Animated.Text 
              style={styles.totalValue}
              {...(Platform.OS === 'ios' && { shouldRasterizeIOS: true })}
            >
              {formatPrice(cartTotals.total)}
            </Animated.Text>
          </View>
        </View>
        
        <AnimatedButton
          label="Checkout"
          icon="arrow-forward"
          iconPosition="right"
          onPress={handleCheckout}
          style={styles.checkoutButton}
          textStyle={styles.checkoutText}
        />
      </Animated.View>
      
      {/* Feedback component with undo support */}
      <AnimatedFeedback
        type={feedback.type}
        message={feedback.message}
        visible={feedback.visible}
        onHide={() => setFeedback(prev => ({ ...prev, visible: false }))}
        action={feedback.message.includes('Undo') ? {
          label: 'Undo',
          onPress: handleUndo
        } : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    ...SHADOWS.light,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 44,
  },
  listContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 120,
    backgroundColor: COLORS.background,
  },
  summaryBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.card,
    borderTopWidth: 0,
    padding: SPACING.md,
    zIndex: 20,
    ...SHADOWS.medium,
  },
  summaryContent: {
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalRow: {
    marginTop: SPACING.xs,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  checkoutText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '700',
  },
}); 