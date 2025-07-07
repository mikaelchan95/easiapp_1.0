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
import { products, Product } from '../../data/mockProducts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppContext } from '../../context/AppContext';
import BuyButton from '../UI/BuyButton';
import AnimatedFeedback from '../UI/AnimatedFeedback';
import { CartNotificationContext } from '../../context/CartNotificationContext';
import { COLORS, SHADOWS } from '../../utils/theme';

const { width } = Dimensions.get('window');

// Define the volume option type for the component
interface VolumeOption {
  size: string;
  price: number;
  inStock: boolean;
}

// Extended product type for the UI
interface ExtendedProduct extends Product {
  volumeOptions?: VolumeOption[];
  tastingNotes?: string;
  sameDayEligible?: boolean;
  stockStatus?: string;
  sku?: string;
}

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'ProductDetail'>>();
  const { id } = route.params;
  const baseProduct = products.find(p => p.id === id);
  const insets = useSafeAreaInsets();
  
  // Enhanced product with additional UI properties
  const product: ExtendedProduct | undefined = baseProduct ? {
    ...baseProduct,
    stockStatus: baseProduct.inStock ? 'In Stock' : 'Out of Stock',
    sku: `SKU-${baseProduct.id}`,
    volumeOptions: [
      { size: baseProduct.volume || '700ml', price: baseProduct.price, inStock: baseProduct.inStock },
      { size: '1L', price: baseProduct.price * 1.4, inStock: Math.random() > 0.3 },
      { size: '1.75L', price: baseProduct.price * 2.2, inStock: Math.random() > 0.5 }
    ],
    tastingNotes: 'Rich and complex with notes of dried fruits, vanilla, and spice.',
    sameDayEligible: baseProduct.inStock && baseProduct.price < 300
  } : undefined;
  
  // Use AppContext
  const { dispatch } = useContext(AppContext);
  const { showCartNotification, purchaseStreak, animationType } = useContext(CartNotificationContext);
  
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [addProgress, setAddProgress] = useState(0);
  const [showProgressAnimation, setShowProgressAnimation] = useState(false);
  const [selectedVolume, setSelectedVolume] = useState<VolumeOption | null>(
    product?.volumeOptions && product.volumeOptions.length > 0 
      ? product.volumeOptions[0] 
      : null
  );
  const [currentPrice, setCurrentPrice] = useState(product?.price || 0);
  const [currentInStock, setCurrentInStock] = useState(product?.inStock || false);

  // Update price and stock status when volume selection changes
  useEffect(() => {
    if (selectedVolume) {
      setCurrentPrice(selectedVolume.price);
      setCurrentInStock(selectedVolume.inStock);
    } else if (product) {
      setCurrentPrice(product.price);
      setCurrentInStock(product.inStock);
    }
  }, [selectedVolume, product]);

  if (!product) return null;

  const handleSelectVolume = (volumeOption: VolumeOption) => {
    setSelectedVolume(volumeOption);
  };

  const handleAddToCart = () => {
    // Set loading state
    setIsAdding(true);
    setShowProgressAnimation(true);
    
    // Animate progress to simulate processing
    let progress = 0;
    const animateProgress = () => {
      progress += 0.05;
      setAddProgress(progress);
      
      if (progress < 1) {
        setTimeout(animateProgress, 50);
      } else {
        // Add to cart using context after progress completes
        dispatch({ 
          type: 'ADD_TO_CART', 
          payload: { 
            product: {
              id: product.id,
              name: product.name,
              price: currentPrice,
              image: product.imageUrl,
              stock: currentInStock ? 10 : 0,
              // Add other required product properties
              category: product.category || '',
              description: product.description || '',
              sku: product.id, // Use id as sku
              retailPrice: currentPrice,
              tradePrice: currentPrice * 0.9,
            }, 
            quantity: quantity 
          } 
        });
        
        // After progress completes, show success
        setIsAdding(false);
        setJustAdded(true);
        
        // Show global cart notification
        showCartNotification(product.name);
        
        // Hide success after delay
        setTimeout(() => {
          setJustAdded(false);
          setShowProgressAnimation(false);
          setAddProgress(0);
        }, 2000);
      }
    };
    
    // Start progress animation
    animateProgress();
  };

  const getStockStatusColor = () => {
    switch (product.stockStatus) {
      case 'In Stock':
        return { bg: '#E8F5E9', text: '#388E3C' };
      case 'Low Stock':
        return { bg: '#FFF8E1', text: '#FFA000' };
      case 'Out of Stock':
      default:
        return { bg: '#FFEBEE', text: '#D32F2F' };
    }
  };

  const stockColors = getStockStatusColor();

  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <StatusBar barStyle="dark-content" />
      
      {/* Safe Area Spacer for iOS Notch */}
      <View style={{ height: insets.top, backgroundColor: COLORS.card }} />
      
      {/* Sticky Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle} numberOfLines={1}>
            {product.name}
          </Text>
          
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => navigation.navigate('Main', { screen: 'Cart' })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="cart-outline" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={[styles.scroll, { backgroundColor: COLORS.background }]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={product.imageUrl} style={styles.image} resizeMode="cover" />
        </View>

        {/* Category & Stock */}
        <View style={styles.row}>
          <Text style={styles.category}>{product.category}</Text>
          <View style={[styles.stockBadge, { backgroundColor: stockColors.bg }]}>
            <Text style={[styles.stockText, { color: stockColors.text }]}>
              {product.stockStatus}
            </Text>
          </View>
        </View>

        {/* Name */}
        <Text style={styles.name}>{product.name}</Text>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>${currentPrice.toFixed(0)}</Text>
        </View>

        {/* Volume Options if available */}
        {product.volumeOptions && product.volumeOptions.length > 1 && (
          <View style={styles.volumeSection}>
            <Text style={styles.volumeTitle}>Select Size</Text>
            <View style={styles.volumeOptions}>
              {product.volumeOptions.map((option) => (
                <TouchableOpacity
                  key={option.size}
                  style={[
                    styles.volumeOption,
                    selectedVolume?.size === option.size && styles.selectedVolumeOption,
                    !option.inStock && styles.disabledVolumeOption
                  ]}
                  onPress={() => option.inStock && handleSelectVolume(option)}
                  disabled={!option.inStock}
                >
                  <Text 
                    style={[
                      styles.volumeText,
                      selectedVolume?.size === option.size && styles.selectedVolumeText,
                      !option.inStock && styles.disabledVolumeText
                    ]}
                  >
                    {option.size}
                  </Text>
                  <Text 
                    style={[
                      styles.volumePrice,
                      selectedVolume?.size === option.size && styles.selectedVolumeText,
                      !option.inStock && styles.disabledVolumeText
                    ]}
                  >
                    ${option.price.toFixed(0)}
                  </Text>
                  {!option.inStock && (
                    <Text style={styles.outOfStockText}>Out of Stock</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Description */}
        <Text style={styles.description}>{product.description}</Text>
        
        {/* Tasting Notes */}
        {product.tastingNotes && (
          <View style={styles.tastingSection}>
            <Text style={styles.sectionTitle}>Tasting Notes</Text>
            <Text style={styles.tastingText}>{product.tastingNotes}</Text>
          </View>
        )}

        {/* Same Day Delivery Badge */}
        {product.sameDayEligible && (
          <View style={styles.sameDayBadge}>
            <Ionicons name="flash" size={16} color="#FF9800" />
            <Text style={styles.sameDayText}>Eligible for Same-Day Delivery</Text>
          </View>
        )}

        {/* Trust Signals */}
        <View style={styles.trustSection}>
          <Text style={styles.trustTitle}>Product Details</Text>
          <View style={styles.trustRow}>
            <View style={styles.trustIconBox}><Ionicons name="shield-checkmark" size={20} color="#4CAF50" /></View>
            <View style={styles.trustTextBox}>
              <Text style={styles.trustLabel}>Authentic</Text>
              <Text style={styles.trustDesc}>Verified source with certificate</Text>
            </View>
          </View>
          <View style={styles.trustRow}>
            <View style={styles.trustIconBox}><Ionicons name="medal-outline" size={20} color="#2196F3" /></View>
            <View style={styles.trustTextBox}>
              <Text style={styles.trustLabel}>Premium Quality</Text>
              <Text style={styles.trustDesc}>Temperature controlled storage</Text>
            </View>
          </View>
          <View style={styles.trustRow}>
            <View style={styles.trustIconBox}><Ionicons name="rocket-outline" size={20} color="#9C27B0" /></View>
            <View style={styles.trustTextBox}>
              <Text style={styles.trustLabel}>Fast Delivery</Text>
              <Text style={styles.trustDesc}>Same-day delivery available</Text>
            </View>
          </View>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.qtyRow}>
          <Text style={styles.qtyLabel}>Quantity</Text>
          <View style={styles.qtySelector}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Ionicons name="remove" size={18} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => setQuantity(quantity + 1)}
              disabled={!currentInStock}
            >
              <Ionicons name="add" size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        <BuyButton
          price={currentPrice}
          quantity={quantity}
          inStock={currentInStock}
          onAddToCart={handleAddToCart}
          onBuyNow={() => {
            handleAddToCart();
            setTimeout(() => {
              navigation.navigate('Main', { screen: 'Cart' });
            }, 700);
          }}
          showQuantity={false}
          productName={product.name}
        />
      </View>
      
      {/* Feedback notification */}
      <AnimatedFeedback
        type={justAdded ? (animationType === 'streak' ? 'streak' : 'success') : isAdding ? 'loading' : 'info'}
        message={
          justAdded 
            ? (animationType === 'streak' 
                ? `🔥 Streak ${Math.floor(purchaseStreak / 3)}! Added ${product.name}` 
                : `Added to cart!`)
            : isAdding 
              ? 'Adding to cart...' 
              : ''
        }
        visible={isAdding || justAdded}
        position="bottom"
        showCartAnimation={justAdded}
        streakCount={Math.floor(purchaseStreak / 3)}
        progressValue={showProgressAnimation ? addProgress : 0}
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
    borderBottomWidth: 0,
    height: 60,
    width: '100%',
    paddingHorizontal: 16,
    // Remove backdropFilter as it's not supported in all React Native environments
    zIndex: 10,
    ...SHADOWS.light,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: COLORS.background,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  category: {
    fontSize: 14,
    color: COLORS.textSecondary,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: '600',
    textTransform: 'capitalize',
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
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  trustSection: {
    marginTop: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  trustTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trustIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trustTextBox: {
    flex: 1,
  },
  trustLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  trustDesc: {
    fontSize: 13,
    color: '#666',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
    zIndex: 20,
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  qtyLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    width: 32,
    textAlign: 'center',
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
  volumeSection: {
    marginTop: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  volumeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  volumeOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  volumeOption: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
  },
  selectedVolumeOption: {
    borderColor: '#4CAF50',
  },
  disabledVolumeOption: {
    borderColor: '#ccc',
  },
  volumeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  selectedVolumeText: {
    color: '#4CAF50',
  },
  disabledVolumeText: {
    color: '#ccc',
  },
  volumePrice: {
    fontSize: 13,
    color: '#666',
  },
  outOfStockText: {
    fontSize: 11,
    color: '#D32F2F',
    marginTop: 4,
  },
  tastingSection: {
    marginTop: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  tastingText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  sameDayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: 8,
    marginTop: 8,
  },
  sameDayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 8,
  },
}); 