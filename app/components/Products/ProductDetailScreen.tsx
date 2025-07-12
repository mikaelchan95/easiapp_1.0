import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  ImageSourcePropType,
  FlatList,
  StatusBar,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import { Product } from '../../utils/pricing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppContext, getUserRole } from '../../context/AppContext';
import BuyButton from '../UI/BuyButton';
import AnimatedFeedback from '../UI/AnimatedFeedback';
import { CartNotificationContext } from '../../context/CartNotificationContext';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { 
  getProductPrice, 
  formatPrice,
  UserRole
} from '../../utils/pricing';
import { formatFinancialAmount } from '../../utils/formatting';

const { width } = Dimensions.get('window');

// Cart Badge Component
const CartBadge: React.FC = () => {
  const { state } = useContext(AppContext);
  const cartItemCount = state.cart.reduce((total, item) => total + item.quantity, 0);
  
  if (cartItemCount === 0) return null;
  
  return (
    <View style={styles.cartBadge}>
      <Text style={styles.cartBadgeText}>
        {cartItemCount > 99 ? '99+' : cartItemCount.toString()}
      </Text>
    </View>
  );
};

// Define the volume option type for the component
interface VolumeOption {
  size: string;
  price: number;
}

// Extended product type for the UI
interface ExtendedProduct extends Product {
  volumeOptions?: VolumeOption[];
  tastingNotes?: string;
  sameDayEligible?: boolean;
  sku: string;
}

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'ProductDetail'>>();
  const { id } = route.params || {};
  
  if (!id) {
    return null; // or return an error screen
  }
  
  // Use AppContext
  const { dispatch, state } = useContext(AppContext);
  const baseProduct = state.products.find(p => p.id === id);
  const insets = useSafeAreaInsets();
  
  // Enhanced product with additional UI properties
  const product: ExtendedProduct | undefined = baseProduct ? {
    ...baseProduct,
    sku: baseProduct.sku || `SKU-${baseProduct.id}`,
    volumeOptions: [
      { size: baseProduct.volume || '700ml', price: baseProduct.retailPrice || baseProduct.price || 0 },
      { size: '1L', price: (baseProduct.retailPrice || baseProduct.price || 0) * 1.4 },
      { size: '1.75L', price: (baseProduct.retailPrice || baseProduct.price || 0) * 2.2 }
    ],
    tastingNotes: baseProduct.description || 'A premium product with exceptional quality and craftsmanship.',
    sameDayEligible: (baseProduct.retailPrice || baseProduct.price || 0) < 300
  } : undefined;
  const { showCartNotification } = useContext(CartNotificationContext);
  
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [addProgress, setAddProgress] = useState(0);
  const [showProgressAnimation, setShowProgressAnimation] = useState(false);
  
  // Collapsible widget state
  const [isBusinessInfoExpanded, setIsBusinessInfoExpanded] = useState(false);
  
  // Feedback state for errors and messages
  const [feedback, setFeedback] = useState({
    visible: false,
    type: 'success' as 'success' | 'error' | 'info' | 'loading',
    message: ''
  });
  const [selectedVolume, setSelectedVolume] = useState<VolumeOption | null>(
    product?.volumeOptions && product.volumeOptions.length > 0 
      ? product.volumeOptions[0] 
      : null
  );

  // Use centralized pricing for current product
  const currentProductForPricing = product ? {
    ...product,
    retailPrice: selectedVolume ? selectedVolume.price : product.price,
    tradePrice: selectedVolume ? selectedVolume.price * 0.85 : product.price * 0.85,
    image: product.imageUrl,
    sku: `SKU-${product.id}`,
  } : null;

  const userRole = getUserRole(state.user);
  
  // Get current price and remove GST
  const currentPriceWithGST = currentProductForPricing ? getProductPrice(currentProductForPricing, userRole) : 0;
  const currentPrice = currentPriceWithGST / 1.09;
  
  // Since stock management was removed, always show as in stock
  const currentInStock = true;

  if (!product) return null;

  const handleSelectVolume = (volumeOption: VolumeOption) => {
    setSelectedVolume(volumeOption);
  };

  const handleAddToCart = () => {
    if (!currentProductForPricing || isAdding) return; // Prevent multiple clicks
    
    // Set loading state
    setIsAdding(true);
    
    // Add to cart immediately (optimistic update)
    dispatch({ 
      type: 'ADD_TO_CART', 
      payload: { 
        product: currentProductForPricing, 
        quantity: quantity 
      } 
    });
    
    // Show success feedback
    setJustAdded(true);
    showCartNotification(product.name, quantity);
    
    // Reset states after animation
    setTimeout(() => {
      setIsAdding(false);
      setJustAdded(false);
    }, 1500);
  };


  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <StatusBar barStyle="dark-content" />
      
      {/* Enhanced Header with Safe Area */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Go back"
              accessibilityHint="Double tap to go back to previous screen"
              accessibilityRole="button"
            >
              <Ionicons name="chevron-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Product Details
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => {/* Add share functionality */}}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="share-outline" size={22} color={COLORS.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cartButton}
              onPress={() => navigation.navigate('Main', { screen: 'Cart' })}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="View cart"
              accessibilityHint="Double tap to view your shopping cart"
              accessibilityRole="button"
            >
              <Ionicons name="cart-outline" size={24} color={COLORS.text} />
              <CartBadge />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        style={[styles.scroll, { backgroundColor: COLORS.card }]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={typeof product.imageUrl === 'string' ? { uri: product.imageUrl } : product.imageUrl} style={styles.image} resizeMode="cover" />
        </View>

        {/* Continuous Content Section */}
        <View style={styles.contentSection}>
          {/* Category */}
          <View style={styles.categoryRow}>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>
          
          {/* Product Name */}
          <Text style={styles.productName}>{product.name}</Text>
          
          {/* Price */}
          <View style={styles.priceSection}>
            <Text style={styles.mainPrice}>{formatFinancialAmount(currentPrice)}</Text>
            <Text style={styles.priceSubtext}>
              {userRole === 'trade' ? 'Trade Price (excl. GST)' : 'Retail Price (excl. GST)'}
            </Text>
          </View>

          {/* Product Details */}
          <View style={styles.sectionDivider} />
          <Text style={styles.sectionTitle}>Product Details</Text>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <View style={styles.detailLeft}>
                <Ionicons name="barcode-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.detailLabel}>SKU</Text>
              </View>
              <Text style={styles.detailValue}>{product.sku}</Text>
            </View>
            <View style={styles.detailItem}>
              <View style={styles.detailLeft}>
                <Ionicons name="cube-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.detailLabel}>Volume</Text>
              </View>
              <Text style={styles.detailValue}>{product.volume || '700ml'}</Text>
            </View>
            <View style={styles.detailItem}>
              <View style={styles.detailLeft}>
                <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.success} />
                <Text style={styles.detailLabel}>Stock</Text>
              </View>
              <Text style={styles.detailValue}>In Stock</Text>
            </View>
            <View style={styles.detailItem}>
              <View style={styles.detailLeft}>
                <Ionicons name="pricetag-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.detailLabel}>Unit Price</Text>
              </View>
              <Text style={styles.detailValue}>{formatFinancialAmount(currentPrice)}</Text>
            </View>
          </View>

          {/* Volume Options if available */}
          {product.volumeOptions && product.volumeOptions.length > 1 && (
            <>
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionTitle}>Select Size</Text>
              <View style={styles.volumeOptions}>
                {product.volumeOptions.map((option) => (
                  <TouchableOpacity
                    key={option.size}
                    style={[
                      styles.volumeOption,
                      selectedVolume?.size === option.size && styles.selectedVolumeOption
                    ]}
                    onPress={() => handleSelectVolume(option)}
                  >
                    <Text 
                      style={[
                        styles.volumeText,
                        selectedVolume?.size === option.size && styles.selectedVolumeText
                      ]}
                    >
                      {option.size}
                    </Text>
                    <Text 
                      style={[
                        styles.volumePrice,
                        selectedVolume?.size === option.size && styles.selectedVolumeText
                      ]}
                    >
                      {formatFinancialAmount(option.price)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          
          {/* Business Information */}
          <View style={styles.sectionDivider} />
          <TouchableOpacity 
            style={styles.businessHeader}
            onPress={() => setIsBusinessInfoExpanded(!isBusinessInfoExpanded)}
          >
            <View style={styles.businessHeaderLeft}>
              <Ionicons name="information-circle-outline" size={22} color={COLORS.text} />
              <Text style={styles.businessTitle}>Delivery, Return & Security</Text>
            </View>
            <Ionicons 
              name={isBusinessInfoExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={COLORS.textSecondary} 
            />
          </TouchableOpacity>
          
          {isBusinessInfoExpanded && (
            <View style={styles.businessContent}>
              <View style={styles.businessSection}>
                <View style={styles.businessSectionHeader}>
                  <Ionicons name="car-outline" size={18} color={COLORS.text} />
                  <Text style={styles.businessSectionTitle}>Delivery (Singapore Only)</Text>
                </View>
                <View style={styles.businessItems}>
                  <View style={styles.businessItem}>
                    <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.businessPoint}>Standard: 2-3 business days</Text>
                  </View>
                  <View style={styles.businessItem}>
                    <Ionicons name="flash-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.businessPoint}>Express: Next business day</Text>
                  </View>
                  <View style={styles.businessItem}>
                    <Ionicons name="gift-outline" size={14} color={COLORS.success} />
                    <Text style={styles.businessPoint}>Free delivery on orders over $500</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.businessSection}>
                <View style={styles.businessSectionHeader}>
                  <Ionicons name="return-up-back-outline" size={18} color={COLORS.text} />
                  <Text style={styles.businessSectionTitle}>Returns</Text>
                </View>
                <View style={styles.businessItems}>
                  <View style={styles.businessItem}>
                    <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.businessPoint}>30-day return window from delivery</Text>
                  </View>
                  <View style={styles.businessItem}>
                    <Ionicons name="cube-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.businessPoint}>Original packaging required</Text>
                  </View>
                  <View style={styles.businessItem}>
                    <Ionicons name="chatbox-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.businessPoint}>Contact support for RMA number</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.businessSection}>
                <View style={styles.businessSectionHeader}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.text} />
                  <Text style={styles.businessSectionTitle}>Security</Text>
                </View>
                <View style={styles.businessItems}>
                  <View style={styles.businessItem}>
                    <Ionicons name="lock-closed-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.businessPoint}>SSL encrypted transactions</Text>
                  </View>
                  <View style={styles.businessItem}>
                    <Ionicons name="card-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.businessPoint}>Business credit terms available</Text>
                  </View>
                  <View style={styles.businessItem}>
                    <Ionicons name="people-outline" size={14} color={COLORS.textSecondary} />
                    <Text style={styles.businessPoint}>Dedicated account support</Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Enhanced Bottom Actions */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomContent}>
          {/* Price Summary Row */}
          <View style={styles.priceSummaryRow}>
            <View style={styles.totalPriceSection}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalPrice}>{formatFinancialAmount(currentPrice * quantity)}</Text>
            </View>
            
            {/* Quantity Selector */}
            <View style={styles.qtySelector}>
              <TouchableOpacity
                style={[styles.qtyButton, quantity <= 1 && styles.qtyButtonDisabled]}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                activeOpacity={0.7}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons name="remove" size={20} color={quantity <= 1 ? COLORS.inactive : COLORS.text} />
              </TouchableOpacity>
              <View style={styles.qtyValueContainer}>
                <Text style={styles.qtyValue}>{quantity}</Text>
              </View>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => setQuantity(quantity + 1)}
                activeOpacity={0.7}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons name="add" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={styles.addToCartButton}
              onPress={handleAddToCart}
              disabled={isAdding}
            >
              {isAdding ? (
                <View style={styles.buttonContent}>
                  <Ionicons name="hourglass-outline" size={20} color={COLORS.accent} />
                  <Text style={styles.addToCartText}>Adding...</Text>
                </View>
              ) : justAdded ? (
                <View style={styles.buttonContent}>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                  <Text style={styles.addToCartText}>Added!</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="cart-outline" size={20} color={COLORS.accent} />
                  <Text style={styles.addToCartText}>Add to Cart</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.buyNowButton}
              onPress={() => {
                handleAddToCart();
                setTimeout(() => {
                  navigation.navigate('Main', { screen: 'Cart' });
                }, 700);
              }}
            >
              <View style={styles.buttonContent}>
                <Ionicons name="flash" size={20} color={COLORS.primary} />
                <Text style={styles.buyNowText}>Buy Now</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Feedback notification */}
      <AnimatedFeedback
        type={justAdded ? 'success' : isAdding ? 'loading' : 'info'}
        message={
          justAdded 
            ? `Added to cart!`
            : isAdding 
              ? 'Adding to cart...' 
              : ''
        }
        visible={isAdding || justAdded}
        position="bottom"
        showCartAnimation={justAdded}
        streakCount={0}
        progressValue={showProgressAnimation ? addProgress : 0}
      />
      
      {/* Error feedback */}
      <AnimatedFeedback
        type={feedback.type}
        message={feedback.message}
        visible={feedback.visible}
        onHide={() => setFeedback(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    width: '100%',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    zIndex: 10,
    ...SHADOWS.medium,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 70,
    marginTop: SPACING.sm,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: SPACING.xs,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  scroll: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  
  // Continuous Content Section
  contentSection: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  categoryRow: {
    marginBottom: SPACING.xs,
  },
  categoryText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  productName: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.sm,
    lineHeight: 32,
  },
  priceSection: {
    marginBottom: SPACING.md,
    paddingTop: 0,
  },
  mainPrice: {
    ...TYPOGRAPHY.h1,
    fontSize: 36,
    marginBottom: 4,
    fontWeight: '700',
    lineHeight: 40,
  },
  priceSubtext: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },

  // Section Divider
  sectionDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  
  // Section Title
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  
  // Product Details
  detailsGrid: {
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginLeft: SPACING.xs,
  },
  detailValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // Volume Options
  volumeOptions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  volumeOption: {
    flex: 1,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  selectedVolumeOption: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.card,
  },
  volumeText: {
    ...TYPOGRAPHY.h5,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedVolumeText: {
    color: COLORS.primary,
  },
  volumePrice: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },

  // Business Information
  businessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  businessHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  businessTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  businessContent: {
    paddingTop: 0,
  },
  businessSection: {
    marginBottom: SPACING.md,
  },
  businessSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  businessSectionTitle: {
    ...TYPOGRAPHY.h5,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  businessItems: {
    gap: SPACING.xs,
  },
  businessItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessPoint: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 20,
    ...SHADOWS.large,
    elevation: 8,
  },
  bottomContent: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  
  // Price Summary Row
  priceSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  totalPriceSection: {
    flex: 1,
  },
  totalLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  totalPrice: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.text,
  },
  
  // Enhanced Quantity Selector
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  qtyButton: {
    width: 44, // Increased for better touch target
    height: 44, // Increased for better touch target
    borderRadius: 22,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyButtonDisabled: {
    backgroundColor: COLORS.background,
    opacity: 0.5,
  },
  qtyValueContainer: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
    textAlign: 'center',
  },
  
  // Action Buttons Row
  actionButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  addToCartButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18, // Increased for better touch target
    paddingHorizontal: SPACING.md,
    minHeight: 56, // Ensure minimum touch target
    ...SHADOWS.medium,
    elevation: 3,
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    paddingVertical: 18, // Increased for better touch target
    paddingHorizontal: SPACING.md,
    minHeight: 56, // Ensure minimum touch target
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.light,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  addToCartText: {
    ...TYPOGRAPHY.h5,
    color: COLORS.accent,
    fontWeight: '600',
  },
  buyNowText: {
    ...TYPOGRAPHY.h6,
    color: COLORS.primary,
    fontWeight: '600',
  },
  addToCart: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  addToCartDisabled: {
    backgroundColor: '#ccc',
  },
  addToCartText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  addedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addedText: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  loadingIndicator: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderTopColor: COLORS.accent,
    marginRight: 8,
  },
  outOfStockText: {
    fontSize: 11,
    color: '#D32F2F',
    marginTop: 4,
  },
  tastingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  cartBadgeText: {
    color: COLORS.card,
    fontSize: 12,
    fontWeight: '700',
  },
}); 