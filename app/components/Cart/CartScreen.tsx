import React, { useState, useRef, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Animated, 
  Platform,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CartItem from './CartItem';
import EmptyCart from './EmptyCart';
import SuggestedAddons from './SuggestedAddons';
import { products, Product as MockProduct } from '../../data/mockProducts';

// Import app context
import { AppContext } from '../../context/AppContext';
import { CartNotificationContext } from '../../context/CartNotificationContext';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Animations from '../../utils/animations';
import AnimatedButton from '../UI/AnimatedButton';
import AnimatedFeedback from '../UI/AnimatedFeedback';
import { HapticFeedback } from '../../utils/haptics';
import { 
  calculateCartTotals, 
  formatPrice, 
  getProductPrice,
  getStockStatus,
  isProductInStock,
  Product as PricingProduct
} from '../../utils/pricing';

interface CartItemType {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: any;
  quantity: number;
  inStock: boolean;
  stockStatus?: string;
}

interface DeletedItemType {
  item: any | null;
  timeout: NodeJS.Timeout | null;
}

export default function CartScreen() {
  const navigation = useNavigation();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Use the AppContext instead of local state
  const { state, dispatch } = useContext(AppContext);
  const { showCartNotification } = useContext(CartNotificationContext);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const summarySlideAnim = useRef(new Animated.Value(100)).current;
  const headerScaleAnim = useRef(new Animated.Value(1)).current;
  
  // Feedback state
  const [feedback, setFeedback] = useState({
    visible: false,
    type: 'success' as 'success' | 'error' | 'info' | 'loading',
    message: ''
  });
  
  // Undo state for deleted items
  const [deletedItem, setDeletedItem] = useState<DeletedItemType>({
    item: null,
    timeout: null
  });
  
  // Track active swipeable item to prevent multiple swipes
  const [activeSwipe, setActiveSwipe] = useState<string | null>(null);
  
  // Calculate totals using centralized pricing utility
  const cartTotals = calculateCartTotals(state.cart, state.user?.role || 'retail');
  
  // Calculate summary bar height dynamically: padding + content + bottom safe area + tab bar
  const SUMMARY_BAR_HEIGHT = SPACING.md * 2 + 80 + insets.bottom + 80; // padding + content height + safe area + tab bar
  
  // Improved product image lookup with fallback
  const getProductImageById = (productId: string) => {
    const foundProduct = products.find(p => p.id === productId);
    if (foundProduct?.imageUrl) {
      return foundProduct.imageUrl;
    }
    
    // Fallback to a default image or return null
    console.warn(`No image found for product ${productId}`);
    return null;
  };
  
  // Enhanced cart items mapping with better error handling
  const cartItems: CartItemType[] = state.cart.map(item => {
    const stockStatus = getStockStatus(item.product);
    const priceWithGST = getProductPrice(item.product, state.user?.role || 'retail');
    
    // Get proper image from products array with fallback
    const productImage = getProductImageById(item.product.id);
    
    return {
      id: item.product.id,
      productId: item.product.id,
      name: item.product.name,
      price: priceWithGST,
      imageUrl: productImage || item.product.image, // Use product image from products list or fallback
      quantity: item.quantity,
      inStock: isProductInStock(item.product, item.quantity),
      stockStatus: stockStatus?.status || 'in_stock'
    };
  }).filter(item => item.imageUrl !== null); // Filter out items without images
  
  const cartProductIds = cartItems.map(item => item.productId);
  
  // Animation values for list items
  const itemAnimations = useRef<Animated.Value[]>([]).current;
  
  // Ensure we have enough animation values
  useEffect(() => {
    // Create animation values for each item if needed
    while (itemAnimations.length < cartItems.length) {
      itemAnimations.push(new Animated.Value(0));
    }
    
    // Remove excess animation values
    if (itemAnimations.length > cartItems.length) {
      itemAnimations.splice(cartItems.length);
    }
  }, [cartItems.length]);
  
  // Enhanced mount animations
  useEffect(() => {
    // Reset all animations
    fadeAnim.setValue(0);
    summarySlideAnim.setValue(100);
    headerScaleAnim.setValue(0.95);
    
    // Animate the main container
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true
    }).start();
    
    // Animate header with scale
    Animated.timing(headerScaleAnim, {
      toValue: 1,
      duration: 300,
      delay: 100,
      easing: Animations.TIMING.easeOut,
      useNativeDriver: true
    }).start();
    
    // Animate the summary bar with a slight delay
    Animated.timing(summarySlideAnim, {
      toValue: 0,
      duration: 400,
      delay: 200,
      easing: Animations.TIMING.easeOut,
      useNativeDriver: true
    }).start();
    
    // Animate each item with staggered timing
    const animations = itemAnimations.slice(0, cartItems.length).map((anim, index) => {
      anim.setValue(0);
      return Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 75,
        easing: Animations.TIMING.easeOut,
        useNativeDriver: true
      });
    });
    
    if (animations.length > 0) {
      Animated.stagger(75, animations).start();
    }
  }, [cartItems.length]);

  // Enhanced quantity change handler
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    HapticFeedback.light();
    
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
        setDeletedItem({ item: null, timeout: null });
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
      HapticFeedback.success();
      
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
      setDeletedItem({ item: null, timeout: null });
      
      // Show success feedback
      setFeedback({
        visible: true,
        type: 'success',
        message: 'Item restored'
      });
    }
  };

  // Enhanced add suggested product handler
  const handleAddSuggested = (product: MockProduct) => {
    setIsAddingProduct(true);
    HapticFeedback.success();
    
    // Convert MockProduct to PricingProduct format
    const pricingProduct: PricingProduct = {
      id: product.id,
      name: product.name,
      retailPrice: product.retailPrice,
      tradePrice: product.tradePrice,
      stock: product.inStock ? 10 : 0,
      category: product.category || '',
      description: product.description || '',
      sku: product.sku,
      image: product.imageUrl,
    };
    
    // Add to cart using context
    dispatch({ 
      type: 'ADD_TO_CART', 
      payload: { 
        product: pricingProduct,
        quantity: 1 
      } 
    });
    
    // Show global cart notification
    showCartNotification(product.name, 1);
    
    // Show local feedback
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

  // Handle save for later
  const handleSaveForLater = (productId: string) => {
    const itemToSave = state.cart.find(item => item.product.id === productId);
    if (!itemToSave) return;

    HapticFeedback.light();
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
    
    setFeedback({
      visible: true,
      type: 'info',
      message: 'Saved for later'
    });
  };

  // Handle add to favorites
  const handleAddToFavorites = (productId: string) => {
    const itemToFavorite = state.cart.find(item => item.product.id === productId);
    if (!itemToFavorite) return;

    HapticFeedback.success();
    
    setFeedback({
      visible: true,
      type: 'success',
      message: 'Added to favorites'
    });
  };

  // Enhanced checkout handler
  const handleCheckout = () => {
    HapticFeedback.success();
    
    // Animation for checkout button press
    Animated.sequence([
      Animated.timing(headerScaleAnim, {
        toValue: 1.02,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(headerScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
    
    // Navigate to checkout
    navigation.navigate('Checkout');
  };

  // Pull to refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    HapticFeedback.light();
    
    // Simulate refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // Enhanced render item with better animations
  const renderItem = ({ item, index }: { item: CartItemType, index: number }) => {
    // Get the animation value for this item
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
                outputRange: [30, 0]
              }) 
            },
            {
              scale: itemAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1]
              }) 
            }
          ]
        }}
      >
        <CartItem 
          item={item} 
          onQuantityChange={(quantity) => handleQuantityChange(item.productId, quantity)}
          onDelete={() => handleQuantityChange(item.productId, 0)}
          onSaveForLater={() => handleSaveForLater(item.productId)}
          onAddToFavorites={() => handleAddToFavorites(item.productId)}
          onSwipeStart={() => setActiveSwipe(item.id)}
          onSwipeEnd={() => setActiveSwipe(null)}
        />
      </Animated.View>
    );
  };

  if (cartItems.length === 0) {
    return <EmptyCart />;
  }

  return (
    <View style={styles.container}>
      {/* Status Bar Spacer */}
      <View style={[styles.statusBarSpacer, { height: insets.top }]} />
      
      {/* Enhanced Header */}
      <Animated.View 
        style={[
          styles.headerContainer,
          { 
            opacity: fadeAnim,
            transform: [{ scale: headerScaleAnim }]
          }
        ]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            HapticFeedback.light();
            navigation.goBack();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Cart</Text>
          <Text style={styles.headerSubtitle}>
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={() => {
            HapticFeedback.warning();
            dispatch({ type: 'CLEAR_CART' });
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </Animated.View>
      
      <FlatList
        data={cartItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          ...styles.listContent,
          paddingBottom: SUMMARY_BAR_HEIGHT + insets.bottom + 24, // 24 for extra breathing room
        }}
        style={styles.listContainer}
        ListFooterComponent={
          <SuggestedAddons 
            cartProductIds={cartProductIds}
            onAddToCart={handleAddSuggested}
          />
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      />
      
      {/* Enhanced Sticky Summary Bar */}
      <Animated.View 
        style={[
          styles.summaryBar,
          { 
            transform: [{ translateY: summarySlideAnim }],
            opacity: fadeAnim,
            paddingBottom: SPACING.md + insets.bottom + 80 // Dynamic bottom padding based on safe area + tab bar height
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
            <Text style={styles.totalValue}>
              {formatPrice(cartTotals.total)}
            </Text>
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
      
      {/* Enhanced Feedback */}
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
  statusBarSpacer: {
    backgroundColor: COLORS.card,
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
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: 2,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  listContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingTop: SPACING.lg,
    paddingBottom: 180,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  summaryBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  summaryValue: {
    ...TYPOGRAPHY.caption,
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
    ...TYPOGRAPHY.h5,
    fontWeight: '700',
  },
  totalValue: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
  },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  checkoutText: {
    ...TYPOGRAPHY.button,
    color: COLORS.accent,
    fontWeight: '700',
  },
}); 