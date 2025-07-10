import React, { useRef, useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  TextInput,
  Dimensions,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import * as Animations from '../../utils/animations';
import { AppContext } from '../../context/AppContext';
import { CartNotificationContext } from '../../context/CartNotificationContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 3) / 2;

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  inStock: boolean;
  rating: number;
  dateAdded: string;
  description: string;
}

const MOCK_WISHLIST: WishlistItem[] = [
  {
    id: '1',
    name: 'Macallan 18 Year Old',
    price: 145.99,
    originalPrice: 169.99,
    imageUrl: require('../../assets/MAC-2024-18YO-Sherry-Cask-BottleBox-Front-REFLECTION-5000x5000-PNG-300dpi-2xl.webp'),
    category: 'Whiskey',
    inStock: true,
    rating: 4.8,
    dateAdded: '2024-01-10',
    description: 'Aged in sherry oak casks for 18 years'
  },
  {
    id: '2',
    name: 'Dom Pérignon 2013',
    price: 189.50,
    imageUrl: require('../../assets/Dom Perignon 2013 750ml.webp'),
    category: 'Champagne',
    inStock: true,
    rating: 4.9,
    dateAdded: '2024-01-08',
    description: 'Vintage champagne from the prestigious Dom Pérignon house'
  },
  {
    id: '3',
    name: 'Macallan 25 Year Old',
    price: 299.99,
    originalPrice: 349.99,
    imageUrl: require('../../assets/MAC-2024-25YO-Sherry-Oak-BottleBox-Front-REFLECTION-5000x5000-PNG-300dpi-2xl.webp'),
    category: 'Whiskey',
    inStock: false,
    rating: 4.9,
    dateAdded: '2024-01-05',
    description: 'Premium aged whiskey with complex flavor profile'
  },
  {
    id: '4',
    name: 'Macallan 30 Year Old',
    price: 799.99,
    imageUrl: require('../../assets/MAC-2024-30YO-Sherry-Cask-BottleBox-Front-REFLECTION-5000x5000-PNG-300dpi-2xl.webp'),
    category: 'Whiskey',
    inStock: true,
    rating: 5.0,
    dateAdded: '2024-01-02',
    description: 'Ultra-premium 30-year aged single malt whiskey'
  }
];

const SORT_OPTIONS = [
  { id: 'dateAdded', label: 'Recently Added', icon: 'time-outline' },
  { id: 'priceAsc', label: 'Price: Low to High', icon: 'arrow-up-outline' },
  { id: 'priceDesc', label: 'Price: High to Low', icon: 'arrow-down-outline' },
  { id: 'name', label: 'Name A-Z', icon: 'text-outline' },
  { id: 'rating', label: 'Highest Rated', icon: 'star-outline' }
];

export default function WishlistScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { dispatch } = useContext(AppContext);
  const { showCartNotification } = useContext(CartNotificationContext);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState('dateAdded');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [wishlistItems, setWishlistItems] = useState(MOCK_WISHLIST);
  const [filteredItems, setFilteredItems] = useState(MOCK_WISHLIST);
  const [showSortModal, setShowSortModal] = useState(false);
  
  useEffect(() => {
    // Initial animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut
      }),
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut
      })
    ]).start();
  }, []);
  
  useEffect(() => {
    // Filter and sort items
    let filtered = wishlistItems;
    
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1 ||
        item.category.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1
      );
    }
    
    // Sort items
    filtered = [...filtered].sort((a, b) => {
      switch (selectedSort) {
        case 'priceAsc':
          return a.price - b.price;
        case 'priceDesc':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.rating - a.rating;
        case 'dateAdded':
        default:
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      }
    });
    
    setFilteredItems(filtered);
  }, [searchQuery, selectedSort, wishlistItems]);
  
  const handleRemoveFromWishlist = (itemId: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  const handleAddToCart = (item: WishlistItem) => {
    
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        id: item.id,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        category: item.category
      }
    });
    
          showCartNotification(item.name, 1);
  };
  
  const handleProductPress = (item: WishlistItem) => {
    navigation.navigate('ProductDetail', { productId: item.id });
  };
  
  const renderWishlistItem = ({ item, index }: { item: WishlistItem; index: number }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut
      }).start();
    }, []);
    
    const hasDiscount = item.originalPrice && item.originalPrice > item.price;
    const discountPercent = hasDiscount 
      ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
      : 0;
    
    return (
      <Animated.View
        style={[
          styles.wishlistCard,
          {
            opacity: cardAnim,
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0]
                })
              },
              {
                scale: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1]
                })
              }
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.cardTouchable}
          onPress={() => handleProductPress(item)}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, $${item.price}`}
        >
          {/* Product Image */}
          <View style={styles.imageContainer}>
            <Image source={item.imageUrl} style={styles.productImage} resizeMode="contain" />
            
            {/* Discount Badge */}
            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discountPercent}% OFF</Text>
              </View>
            )}
            
            {/* Stock Status */}
            {!item.inStock && (
              <View style={styles.outOfStockOverlay}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            )}
            
            {/* Wishlist Remove Button */}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveFromWishlist(item.id)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Remove from wishlist"
            >
              <Ionicons name="heart" size={20} color="#E91E63" />
            </TouchableOpacity>
          </View>
          
          {/* Product Info */}
          <View style={styles.productInfo}>
            <Text style={styles.categoryText}>{item.category}</Text>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            
            {/* Rating */}
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
            
            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.currentPrice}>${item.price.toFixed(2)}</Text>
              {hasDiscount && (
                <Text style={styles.originalPrice}>${item.originalPrice?.toFixed(2)}</Text>
              )}
            </View>
            
            {/* Add to Cart Button */}
            <TouchableOpacity
              style={[
                styles.addToCartButton,
                !item.inStock && styles.addToCartButtonDisabled
              ]}
              onPress={() => handleAddToCart(item)}
              disabled={!item.inStock}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={item.inStock ? "Add to cart" : "Out of stock"}
            >
              <Ionicons 
                name={item.inStock ? "cart-outline" : "close-circle-outline"} 
                size={16} 
                color={item.inStock ? COLORS.accent : COLORS.inactive} 
              />
              <Text style={[
                styles.addToCartText,
                !item.inStock && styles.addToCartTextDisabled
              ]}>
                {item.inStock ? 'Add to Cart' : 'Out of Stock'}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={64} color={COLORS.inactive} />
      <Text style={styles.emptyStateTitle}>Your Wishlist is Empty</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery 
          ? 'No items match your search. Try a different keyword.'
          : 'Save items you love to your wishlist and shop them later!'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.shopNowButton}
          onPress={() => navigation.navigate('Products')}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Start shopping"
        >
          <Text style={styles.shopNowText}>Start Shopping</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.accent} />
        </TouchableOpacity>
      )}
    </View>
  );
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View 
        style={[
          styles.header,
          { 
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0]
                })
              }
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Wishlist</Text>
          <Text style={styles.headerSubtitle}>
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} saved
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Sort options"
        >
          <Ionicons name="funnel-outline" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Search Bar */}
      <Animated.View 
        style={[
          styles.searchSection,
          { opacity: fadeAnim }
        ]}
      >
        <View style={[
          styles.searchContainer,
          isSearchFocused && styles.searchContainerFocused
        ]}>
          <Ionicons name="search-outline" size={20} color={COLORS.inactive} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your wishlist..."
            placeholderTextColor={COLORS.inactive}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            accessible={true}
            accessibilityLabel="Search wishlist"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={20} color={COLORS.inactive} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      
      {/* Wishlist Grid */}
      <FlatList
        data={filteredItems}
        renderItem={renderWishlistItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.wishlistGrid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginRight: SPACING.md,
    ...SHADOWS.light,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  sortButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    ...SHADOWS.light,
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchContainerFocused: {
    borderColor: COLORS.primary,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  wishlistGrid: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  row: {
    justifyContent: 'space-between',
  },
  wishlistCard: {
    width: CARD_WIDTH,
    marginBottom: SPACING.lg,
  },
  cardTouchable: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  imageContainer: {
    height: 180,
    backgroundColor: COLORS.background,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '80%',
    height: '80%',
  },
  discountBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: '#FF4444',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  discountText: {
    ...TYPOGRAPHY.label,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    ...TYPOGRAPHY.h5,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
  removeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  productInfo: {
    padding: SPACING.md,
  },
  categoryText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.inactive,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    minHeight: 40,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  ratingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  currentPrice: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  originalPrice: {
    ...TYPOGRAPHY.body,
    color: COLORS.inactive,
    textDecorationLine: 'line-through',
    marginLeft: SPACING.sm,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  addToCartButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  addToCartText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  addToCartTextDisabled: {
    color: COLORS.inactive,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  shopNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  shopNowText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    fontWeight: '600',
    marginRight: SPACING.sm,
  },
});