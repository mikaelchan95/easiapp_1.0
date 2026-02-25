import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../utils/theme';
import { useAppContext } from '../../context/AppContext';
import { Product } from '../../utils/pricing';
import { productsService } from '../../services/productsService';
import EnhancedProductCard from './EnhancedProductCard';
import { HapticFeedback } from '../../utils/haptics';

type BrandProductsScreenRouteProp = RouteProp<
  RootStackParamList,
  'BrandProducts'
>;
type BrandProductsNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

export default function BrandProductsScreen() {
  const navigation = useNavigation<BrandProductsNavigationProp>();
  const route = useRoute<BrandProductsScreenRouteProp>();
  const { brandName } = route.params;

  const { state } = useAppContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch products for this brand
  const fetchBrandProducts = useCallback(async () => {
    try {
      const brandProducts = await productsService.getProducts({
        brand: brandName,
      });
      setProducts(brandProducts);
    } catch (error) {
      console.error('Error fetching brand products:', error);
    } finally {
      setLoading(false);
    }
  }, [brandName]);

  useEffect(() => {
    fetchBrandProducts();
  }, [fetchBrandProducts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBrandProducts();
    setRefreshing(false);
    HapticFeedback.light();
  }, [fetchBrandProducts]);

  const handleProductPress = useCallback(
    (product: Product) => {
      HapticFeedback.selection();
      navigation.navigate('ProductDetail', { id: product.id });
    },
    [navigation]
  );

  const handleBackPress = useCallback(() => {
    HapticFeedback.light();
    navigation.goBack();
  }, [navigation]);

  const renderProduct = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.productWrapper}>
        <EnhancedProductCard product={item} onPress={handleProductPress} />
      </View>
    ),
    [handleProductPress]
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={64} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>No Products Found</Text>
      <Text style={styles.emptyText}>
        There are no products available for {brandName} at this time.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerInfo}>
      <Text style={styles.resultCount}>
        {products.length} {products.length === 1 ? 'Product' : 'Products'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {brandName}
            </Text>
            <Text style={styles.headerSubtitle}>Brand Products</Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Loading State */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBackPress}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {brandName}
          </Text>
          <Text style={styles.headerSubtitle}>Brand Products</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Products List */}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
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
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingTop: SPACING.xl,
    backgroundColor: COLORS.card,
    ...SHADOWS.light,
  },
  backButton: {
    padding: SPACING.sm,
    marginLeft: -SPACING.sm,
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: SPACING.md,
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    width: 40, // Same as back button to center title
  },
  headerInfo: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    marginBottom: SPACING.sm,
  },
  resultCount: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  productWrapper: {
    width: '48%',
    marginBottom: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});








