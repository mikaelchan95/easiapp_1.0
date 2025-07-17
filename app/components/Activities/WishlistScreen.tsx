import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../context/AppContext';
import { CartNotificationContext } from '../../context/CartNotificationContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../utils/theme';
import { wishlistService, WishlistItem } from '../../services/wishlistService';
import { getProductImageSource } from '../../utils/imageUtils';
import { formatFinancialAmount } from '../../utils/formatting';
import { HapticFeedback } from '../../utils/haptics';

export default function WishlistScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useContext(AppContext);
  const { showCartNotification } = useContext(CartNotificationContext);

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load wishlist items
  const loadWishlistItems = async () => {
    if (!state.user) {
      console.log('No user found, setting loading to false');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading wishlist for user:', state.user.id);
      const items = await wishlistService.getUserWishlist(state.user.id);
      console.log('Loaded wishlist items:', items.length);
      setWishlistItems(items);
    } catch (error) {
      console.error('Error loading wishlist items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh wishlist
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWishlistItems();
    setRefreshing(false);
  };

  // Remove item from wishlist
  const handleRemoveFromWishlist = async (item: WishlistItem) => {
    if (!state.user) return;

    try {
      HapticFeedback.light();
      const success = await wishlistService.removeFromWishlist(
        state.user.id,
        item.productId
      );

      if (success) {
        setWishlistItems(prev => prev.filter(i => i.id !== item.id));
        HapticFeedback.success();
      } else {
        HapticFeedback.error();
        Alert.alert('Error', 'Failed to remove item from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      HapticFeedback.error();
      Alert.alert('Error', 'Failed to remove item from wishlist');
    }
  };

  // Add item to cart
  const handleAddToCart = (item: WishlistItem) => {
    try {
      // Create product object from wishlist item
      const product = {
        id: item.productId,
        name: item.productName,
        price: item.productPrice,
        retailPrice: item.productPrice,
        tradePrice: item.productPrice * 0.9,
        image: item.productImageUrl || '',
        imageUrl: item.productImageUrl,
        description: item.productDescription || '',
        category: item.productCategory || 'Wishlist',
        sku: '',
        stockQuantity: 999,
        isAvailable: true,
        inStock: true,
        rating: 4.5,
        stock: 999,
      };

      dispatch({
        type: 'ADD_TO_CART',
        payload: {
          product,
          quantity: 1,
        },
      });

      showCartNotification(item.productName, 1);
      HapticFeedback.success();
    } catch (error) {
      console.error('Error adding to cart:', error);
      HapticFeedback.error();
      Alert.alert('Error', 'Failed to add item to cart');
    }
  };

  // Navigate to product detail
  const handleProductPress = (item: WishlistItem) => {
    navigation.navigate('ProductDetail', { id: item.productId });
  };

  useEffect(() => {
    console.log(
      'WishlistScreen useEffect triggered, user:',
      state.user?.id || 'no user'
    );
    loadWishlistItems();
  }, [state.user?.id]);

  const renderWishlistItem = ({ item }: { item: WishlistItem }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={getProductImageSource(item.productImageUrl, item.productName)}
        style={styles.itemImage}
        resizeMode="cover"
      />

      <View style={styles.itemContent}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.productName}
        </Text>

        {item.productCategory && (
          <Text style={styles.itemCategory}>{item.productCategory}</Text>
        )}

        <Text style={styles.itemPrice}>
          {formatFinancialAmount(item.productPrice)}
        </Text>

        <Text style={styles.dateAdded}>
          Added {new Date(item.dateAdded).toLocaleDateString()}
        </Text>
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={() => handleAddToCart(item)}
        >
          <Ionicons name="bag-add-outline" size={20} color={COLORS.accent} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFromWishlist(item)}
        >
          <Ionicons name="heart" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.centerContent}>
      <Ionicons name="heart-outline" size={64} color={COLORS.inactive} />
      <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
      <Text style={styles.emptyText}>
        Start browsing and save items you love to see them here.
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => navigation.navigate('Products')}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

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
              Wishlist
            </Text>
            <Text style={styles.headerSubtitle}>
              {wishlistItems.length}{' '}
              {wishlistItems.length === 1 ? 'item' : 'items'}
            </Text>
          </View>

          <View style={styles.headerRight}>
            {/* Empty space to balance the header */}
          </View>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading wishlist...</Text>
        </View>
      ) : (
        <FlatList
          data={wishlistItems}
          renderItem={renderWishlistItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      )}
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
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  listContainer: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  itemContent: {
    flex: 1,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  itemName: {
    ...TYPOGRAPHY.h6,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  itemCategory: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  itemPrice: {
    ...TYPOGRAPHY.h6,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  dateAdded: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.inactive,
  },
  itemActions: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addToCartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.error}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl * 2,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  shopButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  shopButtonText: {
    ...TYPOGRAPHY.h6,
    color: COLORS.accent,
    fontWeight: '600',
  },
});
