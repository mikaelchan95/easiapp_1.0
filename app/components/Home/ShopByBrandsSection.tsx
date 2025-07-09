import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Image 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY, FONT_SIZES, FONT_WEIGHTS } from '../../utils/theme';
import { HapticFeedback } from '../../utils/haptics';

interface Brand {
  id: string;
  name: string;
  logo?: any;
  productCount: number;
  category: string;
}

const FEATURED_BRANDS: Brand[] = [
  {
    id: 'macallan',
    name: 'Macallan',
    productCount: 8,
    category: 'Scotch Whisky'
  },
  {
    id: 'dom-perignon',
    name: 'Dom Pérignon',
    productCount: 3,
    category: 'Champagne'
  },
  {
    id: 'hennessy',
    name: 'Hennessy',
    productCount: 5,
    category: 'Cognac'
  },
  {
    id: 'hibiki',
    name: 'Hibiki',
    productCount: 4,
    category: 'Japanese Whisky'
  },
  {
    id: 'louis-xiii',
    name: 'Louis XIII',
    productCount: 2,
    category: 'Cognac'
  },
  {
    id: 'johnnie-walker',
    name: 'Johnnie Walker',
    productCount: 6,
    category: 'Scotch Whisky'
  }
];

interface ShopByBrandsSectionProps {
  onBrandPress: (brand: Brand) => void;
  onViewAll: () => void;
}

export default function ShopByBrandsSection({ onBrandPress, onViewAll }: ShopByBrandsSectionProps) {
  const handleBrandPress = (brand: Brand) => {
    HapticFeedback.selection();
    onBrandPress(brand);
  };

  const handleViewAllPress = () => {
    HapticFeedback.selection();
    onViewAll();
  };

  const renderBrandCard = (brand: Brand) => (
    <TouchableOpacity
      key={brand.id}
      style={styles.brandCard}
      onPress={() => handleBrandPress(brand)}
      activeOpacity={0.8}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Shop ${brand.name} products`}
    >
      <View style={styles.brandLogoContainer}>
        <View style={styles.brandLogo}>
          <Text style={styles.brandLogoText}>
            {brand.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.brandInfo}>
        <Text style={styles.brandName} numberOfLines={1}>
          {brand.name}
        </Text>
        <Text style={styles.brandCategory} numberOfLines={1}>
          {brand.category}
        </Text>
        <Text style={styles.brandProductCount}>
          {brand.productCount} product{brand.productCount !== 1 ? 's' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="storefront" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Shop by Brands</Text>
        </View>
        
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={handleViewAllPress}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="View all brands"
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Brands Grid */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.brandsContainer}
        style={styles.brandsScrollView}
      >
        {FEATURED_BRANDS.map(renderBrandCard)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.h4,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  viewAllText: {
    fontSize: FONT_SIZES.bodySmall,
    color: COLORS.textSecondary,
    marginRight: SPACING.xs,
  },
  brandsScrollView: {
    marginHorizontal: -SPACING.md,
  },
  brandsContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  brandCard: {
    width: 120,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    marginRight: SPACING.sm,
    ...SHADOWS.light,
  },
  brandLogoContainer: {
    marginBottom: SPACING.sm,
  },
  brandLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  brandLogoText: {
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  brandInfo: {
    alignItems: 'center',
    width: '100%',
  },
  brandName: {
    fontSize: FONT_SIZES.bodySmall,
    fontWeight: FONT_WEIGHTS.semibold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  brandCategory: {
    fontSize: FONT_SIZES.label,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  brandProductCount: {
    fontSize: FONT_SIZES.label,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
}); 