import React, { useState, useRef, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Animated, 
  Platform,
  RefreshControl,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import CartItem from './CartItem';
import EmptyCart from './EmptyCart';
import SuggestedAddons from './SuggestedAddons';
import { Product } from '../../utils/pricing';

// Import app context
import { AppContext } from '../../context/AppContext';
import { CartNotificationContext } from '../../context/CartNotificationContext';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { useRewards } from '../../context/RewardsContext';
import { isCompanyUser, CompanyUser, IndividualUser } from '../../types/user';
import { formatStatCurrency, formatStatNumber, formatFinancialAmount, formatPoints } from '../../utils/formatting';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Animations from '../../utils/animations';
import AnimatedButton from '../UI/AnimatedButton';
import AnimatedFeedback from '../UI/AnimatedFeedback';
import { HapticFeedback } from '../../utils/haptics';
import { 
  calculateCartTotals, 
  formatPrice, 
  getProductPrice,
  Product as PricingProduct
} from '../../utils/pricing';

interface CartItemType {
  id: string;
  productId: string;
  name: string;
  price: number;
  imageUrl: any;
  quantity: number;
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
  const { state: rewardsState } = useRewards();
  
  const user = state.user;
  
  const handleFeaturePress = (feature: string) => {
    console.log(`Pressed: ${feature}`);
    // Add navigation logic here if needed
  };

  const renderCartHeader = () => {
    const cartItemCount = state.cart.reduce((count, item) => count + item.quantity, 0);
    
    return (
      <View style={styles.simpleHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            HapticFeedback.light();
            navigation.goBack();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          {cartItemCount > 0 && (
            <Text style={styles.headerSubtitle}>
              {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
            </Text>
          )}
        </View>
        
        <View style={styles.headerSpacer} />
      </View>
    );
  };
  
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
  
  // Calculate summary bar height dynamically: padding + content + safe area + tab bar
  const SUMMARY_BAR_HEIGHT = SPACING.md * 2 + 140 + insets.bottom + 83; // padding + content height + safe area + tab bar
  
  // Helper function to generate Supabase Storage URL
  const getSupabaseStorageUrl = (bucket: string, path: string): string => {
    return `https://vqxnkxaeriizizfmqvua.supabase.co/storage/v1/object/public/${bucket}/${path}`;
  };

  // Improved product image lookup with fallback
  const getProductImageById = (productId: string) => {
    // Check if it's a live product from state with image_url
    const liveProduct = state.products.find(p => p.id === productId);
    
    // If product has an image path, convert it to full Supabase Storage URL
    if (liveProduct?.image) {
      // Check if it's already a full URL
      if (liveProduct.image.startsWith('http')) {
        return liveProduct.image;
      }
      // Convert storage path to full URL
      return getSupabaseStorageUrl('product-images', liveProduct.image);
    }
    
    if (liveProduct?.imageUrl) {
      // Check if it's already a full URL
      if (liveProduct.imageUrl.startsWith('http')) {
        return liveProduct.imageUrl;
      }
      // Convert storage path to full URL
      return getSupabaseStorageUrl('product-images', liveProduct.imageUrl);
    }
    
    // Fallback to a placeholder image with proper wine bottle image
    return 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?w=400&h=400&fit=crop';
  };
  
  // Enhanced cart items mapping with better error handling
  const cartItems: CartItemType[] = state.cart.map(item => {
    const priceWithGST = getProductPrice(item.product, state.user?.role || 'retail');
    
    // Get proper image from products array with fallback
    const productImage = getProductImageById(item.product.id);
    
    // Debug logging for image URLs
    console.log(`🖼️ Cart item ${item.product.name}:`, {
      productId: item.product.id,
      fromProductsState: productImage,
      fromCartItem: item.product.image,
      imageUrl: item.product.imageUrl,
      finalUrl: productImage || item.product.image
    });
    
    return {
      id: item.product.id,
      productId: item.product.id,
      name: item.product.name,
      price: priceWithGST,
      imageUrl: productImage || item.product.image, // Use product image from products list or fallback
      quantity: item.quantity
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

  // Enhanced checkout handler with better animation
  const handleCheckout = () => {
    HapticFeedback.success();
    
    // Use existing animation utility for better feedback
    Animations.bounceAnimation(headerScaleAnim, () => {
      // Navigate to checkout after animation completes
      navigation.navigate('Checkout');
    });
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
      {/* Header Container */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        {/* Simple Cart Header */}
        {renderCartHeader()}
      </View>
      
      <FlatList
        data={cartItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          ...styles.listContent,
          paddingBottom: SUMMARY_BAR_HEIGHT + 24, // 24 for extra breathing room
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
            paddingBottom: insets.bottom + SPACING.md + 83 // Safe area + standard padding + tab bar height
          }
        ]}
      >
        <View style={styles.summaryContent}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatFinancialAmount(cartTotals.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>GST (9%)</Text>
            <Text style={styles.summaryValue}>{formatFinancialAmount(cartTotals.gst)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatFinancialAmount(cartTotals.total)}
            </Text>
          </View>
        </View>
        
        <AnimatedButton
          label="Checkout"
          icon="arrow-forward"
          iconPosition="right"
          iconColor={COLORS.card}
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
    backgroundColor: COLORS.card,
    zIndex: 10,
    ...SHADOWS.light,
    paddingBottom: SPACING.sm,
  },

  // Simple Header Styles
  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  headerTitleContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 2,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
    height: 44,
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
    padding: SPACING.lg,
    zIndex: 20,
    ...SHADOWS.medium,
    elevation: 8,
  },
  summaryContent: {
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  summaryLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  summaryValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalRow: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  totalLabel: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    ...TYPOGRAPHY.h2,
    fontWeight: '800',
    color: COLORS.text,
  },
  checkoutButton: {
    backgroundColor: COLORS.text,
    marginTop: SPACING.xs,
    borderRadius: 16,
    ...SHADOWS.medium,
    elevation: 6,
  },
  checkoutText: {
    ...TYPOGRAPHY.h4,
    color: COLORS.card,
    fontWeight: '700',
  },
}); 