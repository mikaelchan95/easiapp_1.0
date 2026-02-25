import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../utils/pricing';
import ProductCard from '../UI/ProductCard';
import EnhancedProductCard from './EnhancedProductCard';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import SmartSearchDropdown from '../UI/SmartSearchDropdown';
import { HapticFeedback } from '../../utils/haptics';
import * as Animations from '../../utils/animations';
import MobileHeader from '../Layout/MobileHeader';
import DeliveryLocationHeader from '../Location/DeliveryLocationHeader';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';
import { useAppContext } from '../../context/AppContext';

// const categories = [
//   { id: 'all', name: 'All', icon: 'grid-outline' },
//   { id: 'whisky', name: 'Whisky', icon: 'wine-outline' },
//   { id: 'wine', name: 'Wine', icon: 'wine-outline' },
//   { id: 'spirits', name: 'Spirits', icon: 'flask-outline' },
//   { id: 'liqueurs', name: 'Liqueurs', icon: 'beer-outline' },
// ];

export default function ProductsScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { deliveryLocation, setDeliveryLocation } = useDeliveryLocation();
  const { state } = useAppContext();

  // Derive categories from loaded products
  const dynamicCategories = useMemo(() => {
    const products = state.products || [];
    const uniqueCategories = Array.from(
      new Set(products.map(p => p.category).filter(Boolean))
    );

    // Sort categories alphabetically
    uniqueCategories.sort();

    const categoryList = uniqueCategories.map(cat => {
      // Simple icon mapping based on category name keywords
      let icon = 'wine-outline'; // Default
      const lowerCat = cat.toLowerCase();
      if (
        lowerCat.includes('spirit') ||
        lowerCat.includes('vodka') ||
        lowerCat.includes('gin') ||
        lowerCat.includes('rum') ||
        lowerCat.includes('tequila')
      ) {
        icon = 'flask-outline';
      } else if (
        lowerCat.includes('beer') ||
        lowerCat.includes('ale') ||
        lowerCat.includes('lager')
      ) {
        icon = 'beer-outline';
      } else if (lowerCat.includes('whisky') || lowerCat.includes('whiskey')) {
        icon = 'wine-outline'; // Or custom glass icon if available
      } else if (
        lowerCat.includes('champagne') ||
        lowerCat.includes('sparkling')
      ) {
        icon = 'wine-outline';
      } else if (lowerCat.includes('sake')) {
        icon = 'wine-outline';
      }

      return {
        id: cat.toLowerCase(), // Use lowercase for ID matching
        name: cat, // Keep original casing for display
        icon: icon,
      };
    });

    return [{ id: 'all', name: 'All', icon: 'grid-outline' }, ...categoryList];
  }, [state.products]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Initial entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut,
      }),
    ]).start();
  }, []);

  const filteredProducts = useMemo(() => {
    const products = state.products || [];
    if (selectedCategory === 'all') return products;
    return products.filter(
      p =>
        p.category.toLowerCase() === selectedCategory.toLowerCase() ||
        p.category.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  }, [selectedCategory, state.products]);

  const handleProductSelect = (product: Product) => {
    navigation.navigate('ProductDetail', { id: product.id });
  };

  const handleRefresh = useCallback(async () => {
    HapticFeedback.medium();
    setRefreshing(true);

    // Simulate data refresh - in a real app, you'd fetch new data here
    await new Promise(resolve => setTimeout(resolve, 1500));

    // You could reset filters, fetch new products, etc.
    // setSelectedCategory('all');

    HapticFeedback.success();
    setRefreshing(false);
  }, []);

  const handleAddressPress = useCallback(() => {
    HapticFeedback.selection();
    // Navigate to the delivery location picker
    navigation.navigate('DeliveryLocationScreen');
  }, [navigation]);

  const renderCategory = (cat: { id: string; name: string; icon: string }) => (
    <TouchableOpacity
      key={cat.id}
      style={[
        styles.categoryButton,
        selectedCategory === cat.id && styles.categoryButtonActive,
      ]}
      onPress={() => {
        HapticFeedback.selection();
        setSelectedCategory(cat.id);
      }}
      activeOpacity={0.8}
    >
      <View style={styles.categoryIconContainer}>
        <Ionicons
          name={cat.icon as any}
          size={20}
          color={
            selectedCategory === cat.id ? COLORS.accent : COLORS.textSecondary
          }
        />
      </View>
      <Text
        style={[
          styles.categoryText,
          selectedCategory === cat.id && styles.categoryTextActive,
        ]}
      >
        {cat.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        {/* Delivery Location Header */}
        <View style={styles.topLocationContainer}>
          <DeliveryLocationHeader
            location={deliveryLocation}
            onPress={handleAddressPress}
            showDeliveryInfo={true}
            showSavedLocations={false}
            style={styles.topLocationHeader}
          />
        </View>

        {/* Mobile Header with Search */}
        <MobileHeader
          showBackButton={false}
          showLocationHeader={false}
          showSearch={true}
          title="Explore"
        />
      </View>

      {/* Category Filter Bar */}
      <View style={styles.categoryBarContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryBar}
          data={dynamicCategories}
          renderItem={({ item }) => renderCategory(item)}
          keyExtractor={item => item.id}
        />
      </View>

      {/* Grid/List Toggle */}
      <View style={styles.toggleBar}>
        <Text style={styles.sectionTitle}>Products</Text>
        <View style={styles.toggleButtons}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'grid' && styles.toggleButtonActive,
            ]}
            onPress={() => {
              HapticFeedback.selection();
              setViewMode('grid');
            }}
          >
            <Ionicons
              name="grid"
              size={18}
              color={viewMode === 'grid' ? COLORS.accent : COLORS.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'list' && styles.toggleButtonActive,
            ]}
            onPress={() => {
              HapticFeedback.selection();
              setViewMode('list');
            }}
          >
            <Ionicons
              name="list"
              size={18}
              color={viewMode === 'list' ? COLORS.accent : COLORS.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Product List */}
      {viewMode === 'grid' ? (
        <FlatList
          data={filteredProducts}
          key={'grid'}
          numColumns={2}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.gridList}
          style={styles.listContainer}
          renderItem={({ item, index }) => (
            <View style={styles.gridItem}>
              <EnhancedProductCard
                product={item}
                onPress={handleProductSelect}
                isCompact={false}
                animationDelay={index * 50}
              />
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      ) : (
        <FlatList
          data={filteredProducts}
          key={'list'}
          numColumns={1}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listList}
          style={styles.listContainer}
          renderItem={({ item, index }) => (
            <View style={styles.listItem}>
              <EnhancedProductCard
                product={item}
                onPress={handleProductSelect}
                isCompact={true}
                animationDelay={index * 50}
              />
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
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
  headerContainer: {
    backgroundColor: COLORS.card,
    zIndex: 10,
    ...SHADOWS.light,
    paddingBottom: SPACING.sm,
  },
  topLocationContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  topLocationHeader: {
    backgroundColor: '#000', // Black background
    borderColor: '#333', // Dark border
  },
  categoryBarContainer: {
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.sm,
    ...SHADOWS.light,
  },
  categoryBar: {
    paddingHorizontal: SPACING.md,
  },
  listContainer: {
    backgroundColor: COLORS.background,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: SPACING.sm,
    height: 44,
    minWidth: 100,
    justifyContent: 'center',
  },
  categoryButtonActive: {
    backgroundColor: COLORS.primary,
  },
  categoryIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    marginLeft: 8,
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  categoryTextActive: {
    color: COLORS.accent,
  },
  toggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    marginBottom: SPACING.sm,
    ...SHADOWS.light,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  toggleButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  toggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  gridList: {
    padding: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  gridItem: {
    flex: 1,
    margin: 4,
  },
  listList: {
    padding: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  listItem: {
    marginBottom: SPACING.sm,
  },
});
