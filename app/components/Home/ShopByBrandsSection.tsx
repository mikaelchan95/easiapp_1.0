import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { HapticFeedback } from '../../utils/haptics';

interface Brand {
  id: string;
  name: string;
  logo: any | null;
  logoType?: 'image' | 'svg';
  svgContent?: string;
  productCount: number;
  category: string;
}

// Johnnie Walker SVG content (actual logo)
const JOHNNIE_WALKER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="380.7886552931954" height="262.6128657194451" version="1.1" viewBox="0 0 492.8 339.6" xml:space="preserve">
<style type="text/css">
	.st0{fill:#000;}
</style>
<g transform="translate(-2.5 -4.071)">
		<path class="st0" d="m179.4 301.2h10.2v0.3l-3.5 3.1c-0.2 5.1-0.2 9.9-0.2 14.2 0 4.4 0.2 8.5 0.4 12.3h-4.1c0-0.2-0.1-0.6-0.4-0.9s-0.6-0.7-0.8-1l-17.5-22.1c0 6.8 0.1 13.6 0.3 20.5l3.8 2.9v0.4h-10.2v-0.4l3.5-2.9c0.3-6 0.3-13.7 0-23.3l-4.2-3v-0.3h8.8c0.4 0.7 1.1 1.8 2.2 3 1 1.4 2.3 3 3.9 4.9 1.5 1.8 3.3 4.1 5.3 6.6s4.2 5.2 6.6 8.4c0-3.7 0-7.1-0.1-10.4s-0.1-6.3-0.1-9.1l-4-3.1v-0.1zm27.9 2.7 3.4-2.4v-0.3h-12v0.3l3.4 2.4v24.1l-3.6 2.5v0.4h12.2v-0.4l-3.6-2.5c0.1-7.7 0.1-15.7 0.2-24.1zm33.7 24.4c-4.2 0.2-8.3 0.2-12.1 0-0.1-3.9-0.1-7.8 0-11.7 2.2-0.1 5.3-0.1 9.3-0.1l2.3 3.4h0.3v-9.2h-0.3l-2.3 3.5c-5.3 0-8.4-0.1-9.4-0.1 0-1.7-0.1-3.4-0.1-5.1s0-3.4 0.1-5.2c1.8-0.1 3.9-0.2 5.8-0.2h6.2l2.5 3.4h0.3v-5.9h-23.3v0.3l3.4 2.4c0.1 6.9 0.1 14.9 0 24.1l-3.4 2.5v0.4h23.9v-6.6h-0.3zm-102.7-26.8 4 3.1c0 2.8 0.1 5.8 0.1 9.1 0.1 3.3 0.1 6.7 0.1 10.4-2.4-3.2-4.6-5.9-6.5-8.4-2-2.5-3.8-4.7-5.4-6.6-1.5-1.9-2.8-3.5-3.8-4.9-1-1.3-1.8-2.3-2.2-3h-8.8v0.3l4.1 3c0.3 9.5 0.3 17.3 0 23.3l-3.4 2.9v0.4h10.1v-0.4l-3.8-2.9c-0.2-7-0.4-13.8-0.4-20.5l17.6 22.1c0.3 0.3 0.5 0.6 0.8 1 0.3 0.3 0.4 0.7 0.4 0.9h4.1c-0.3-3.8-0.4-7.9-0.4-12.3 0-4.3 0-9.1 0.2-14.2l3.5-3.1v-0.3h-10.2v0.1z"/>
	
		<path class="st0" d="m262.6 50.8c-0.2-0.1-0.3-0.2-0.4-0.3-0.2-0.1-0.3-0.2-0.5-0.3-0.7-0.3-1.3 0.4-1.9-0.1-0.4-0.3-0.7-0.7-1.1-1.1-0.4-0.3-0.7-0.6-1.1-0.9-0.3-0.2-1.3-1-1.6-0.4-0.2 0.4-0.2 0.8-0.2 1.2 0 0.5 0 1.1 0.1 1.6 0.1 1.1 0.5 2.3 1 3.4 0.3 1 1.3 0.1 1.9 0 0.3-0.1 0.6-0.2 1-0.2 0.2 0 0.4 0.2 0.5 0.4 0.2 0.2 0.5 0.4 0.8 0.6 0.4 0.2 0.9 0.2 1.3 0 0.2-0.1 0.4-0.3 0.5-0.4 0.2-0.1 0.2-0.1 0.4 0 0.6 0.3 1.1 0.7 1.7 1 0.1 0.1 0.4 0.2 0.5 0 0.2-0.2 0-0.5 0-0.7-0.2-0.6-0.4-1.1-0.4-1.7-0.1-1 0.1-2 0.6-2.8 0.1-0.2 0.6-0.9 0.3-1.1-0.2-0.2-0.7 0-0.9 0.1-0.8 0.3-1.2 0.5-1.8 0.9-0.1 0.1-0.1 0.3-0.1 0.5-0.3 0-0.2 0.5-0.6 0.3"/>
		<path class="st0" d="m280.1 99.5s-1.8 0.2-2.5 0.4-1.3 0.7-1.1 1.1 0.9 0.4 2.3-0.3c1.3-0.6 1.9-1.2 1.3-1.2"/>
		<path class="st0" d="m268 68.9c0.1-1.2-1.9-0.8-1.5-0.1 0.3 0.8 0.2 1.5 0.2 1.5s1.3-0.2 1.3-1.4"/>
		<path class="st0" d="m265.2 64.3 0.4 1.2s1.1 0.3 1.3-0.9c0.2-1.3-2-1.2-1.7-0.3"/>
		<path class="st0" d="m249.8 23.2s-0.3 0.7-1.9 0.6c-1.5-0.1-2.4 0-2.9 1.7-0.4 1.7 0.1 3 0.4 3.9 0.3 1 0.4 1.9-0.2 2.3s-1.1 0.1-1.1 0.7c0 0.3 0.5 0.7 0.8 0.7 0.7 0.1 1.1-0.2 1.6-0.3 0.5-0.2 1.2-0.1 1.8 0.2 0.8 0.4 0.3-0.7-0.8-1.9-1.3-1.4-1.4-3.9-1.1-5.1 0.6-1.9 2.3-1.4 3-1.8 0.8-0.4 0.7-1.3 0.4-1"/>
		<path class="st0" d="m244.1 21.2c0.4 0.3 0.8 0.6 1.4 0.7 0.4 0.2 1.2 0.4 1.8 0.4 1.5 0.2 2 0 3.7 0.1 0.8 0.1 2.1 0.2 3.5 0.7 3.7 1.3 7.4 4.8 8.1 5.5 1 1.1 3.3 2.8 3.5 2.3 0-0.1-1-1.2-1.4-1.6-0.8-1.1-1.6-2.5-2.3-3.3-1.1-1.3-2-1.9-2.4-2.2-0.3-0.2-0.9-0.7-0.9-0.7-0.5-0.6 0.7-0.2 1.3 0 0.7 0.3 2.4 1.1 4.1 2.4 1 0.7 1.8 1.5 2.4 2.2 1.1 1.4 1.7 2.7 2.6 3.8 0.6 0.6 1.3 1.2 2.1 1.6 2.8 1.2 5.1 1.3 6.1 1 1.5-0.4 2-0.9 1.9-1.4l0.4 0.4c0.2 0.2 0.4 0.4 0.7 0.6 0.1 0 0.2 0.1 0.3 0.1 0.3 0.1 0.7 0 0.8 0.1s0 0.3-0.2 0.5c0 0.1 0.1 0.2 0.2 0.4 0.1 0.3 1.2 0.4 1.2 0.4s1.3 0.1 1.2-0.1c0 0 0.1-0.2-1-1.9-0.2-0.4-2.9-2.3-3.4-2.7s-1 0-0.9 0.6c0 0.3 0.2 0.6 0.4 0.9-0.5-0.4-1.4-0.7-2.4-0.9-2.3-0.5-2.5-0.7-3.7-1.7-0.2-0.2-0.2-0.3-0.2-0.3s2.4-4.1 4.2-5.9s3.5-3 3.9-4.1-1.7-7.5-8.7-11.4-12.2-3.9-14-3.4-2.1 1.4-2.2 2.5-0.2 3.4-0.6 5.3-0.7 2.5-0.6 3.1c0 0.4 0.3 0.7 0.6 1.1 0.4 0.5 1 1 1.5 1.5 1 0.8 2.3 1.9 3 2.9s-0.4 0.7-1.1 0.2-2.7-1.8-4.8-2.6c-0.7-0.3-1.7-0.6-2.3-0.8-3-0.9-6.1-0.9-7.9 0.5-1.3 1-0.7 2.4 0.1 3.2"/>
	</g>
</svg>
`;

// Brand logos - referencing actual brand images
const FEATURED_BRANDS: Brand[] = [
  {
    id: 'macallan',
    name: 'Macallan',
    logo: require('../../assets/brands/Macallan-logo.jpg'),
    logoType: 'image',
    productCount: 8,
    category: 'Scotch Whisky',
  },
  {
    id: 'hennessy',
    name: 'Hennessy',
    logo: require('../../assets/brands/Hennessy-Logo.png'),
    logoType: 'image',
    productCount: 5,
    category: 'Cognac',
  },
  {
    id: 'lumina',
    name: 'Lumina',
    logo: require('../../assets/brands/Lumina.png'),
    logoType: 'image',
    productCount: 4,
    category: 'Liqueur',
  },
  {
    id: 'dom-perignon',
    name: 'Dom Pérignon',
    logo: require('../../assets/brands/Dom-Perignon-Logo.jpg'),
    logoType: 'image',
    productCount: 3,
    category: 'Champagne',
  },
  {
    id: 'eldoria',
    name: 'Eldoria',
    logo: require('../../assets/brands/Eldoria.png'),
    logoType: 'image',
    productCount: 6,
    category: 'Premium Spirits',
  },
  {
    id: 'louis-xiii',
    name: 'Louis XIII',
    logo: require('../../assets/brands/Louis-13_-300x300-1.webp'),
    logoType: 'image',
    productCount: 2,
    category: 'Cognac',
  },
  {
    id: 'lush',
    name: 'Lush',
    logo: require('../../assets/brands/Lush.png'),
    logoType: 'image',
    productCount: 5,
    category: 'Fruit Liqueur',
  },
  {
    id: 'johnnie-walker',
    name: 'Johnnie Walker',
    logo: null,
    logoType: 'svg',
    svgContent: JOHNNIE_WALKER_SVG,
    productCount: 7,
    category: 'Scotch Whisky',
  },
  {
    id: 'hofman',
    name: 'Hofman',
    logo: require('../../assets/brands/Hofman.png'),
    logoType: 'image',
    productCount: 3,
    category: 'Peach Liqueur',
  },
  {
    id: 'regalia',
    name: 'Regalia',
    logo: require('../../assets/brands/Regalia.jpg'),
    logoType: 'image',
    productCount: 4,
    category: 'Premium Spirits',
  },
  {
    id: 'francois-dion',
    name: 'Francois Dion',
    logo: require('../../assets/brands/Francois Dion.png'),
    logoType: 'image',
    productCount: 2,
    category: 'Fine Cognac',
  },
];

interface ShopByBrandsSectionProps {
  onBrandPress: (brand: Brand) => void;
  onViewAll: () => void;
}

export default function ShopByBrandsSection({
  onBrandPress,
  onViewAll,
}: ShopByBrandsSectionProps) {
  const handleBrandPress = (brand: Brand) => {
    HapticFeedback.selection();
    onBrandPress(brand);
  };

  const handleViewAllPress = () => {
    HapticFeedback.selection();
    onViewAll();
  };

  const renderBrandLogo = (brand: Brand) => {
    if (brand.logoType === 'svg' && brand.svgContent) {
      return (
        <SvgXml
          xml={brand.svgContent}
          width="100%"
          height="100%"
          style={styles.brandLogoImage}
          preserveAspectRatio="xMidYMid meet"
        />
      );
    }

    if (brand.logo) {
      return (
        <Image
          source={brand.logo}
          style={styles.brandLogoImage}
          resizeMode="contain"
        />
      );
    }

    return (
      <View style={styles.brandPlaceholder}>
        <Text style={styles.brandPlaceholderText}>
          {brand.name.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
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
      <View style={styles.brandLogoContainer}>{renderBrandLogo(brand)}</View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Section Header - Match ProductSectionCard pattern */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons
            name="storefront"
            size={20}
            color={COLORS.primary}
            style={styles.icon}
          />
          <Text style={styles.title}>Shop by Brands</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{FEATURED_BRANDS.length}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={handleViewAllPress}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="View all brands"
        >
          <Text style={styles.viewAllText}>Shop All</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: SPACING.element,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: SPACING.sm,
  },
  countBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  countText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '10',
    minWidth: 80,
    justifyContent: 'center',
  },
  viewAllText: {
    ...TYPOGRAPHY.button,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 4,
  },
  brandsScrollView: {
    // Remove negative margin to align with other sections
  },
  brandsContainer: {
    paddingLeft: SPACING.md,
    paddingRight: SPACING.element,
  },
  brandCard: {
    width: 140,
    height: 140,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginRight: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.light,
  },
  brandLogoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  brandLogoImage: {
    width: '100%',
    height: '100%',
    maxWidth: 110,
    maxHeight: 80,
  },
  brandPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  brandPlaceholderText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
