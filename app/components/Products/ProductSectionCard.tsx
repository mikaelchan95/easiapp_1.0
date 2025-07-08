import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from '../UI/ProductCard';
import { Product } from '../../data/mockProducts';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../utils/theme';
import * as Animations from '../../utils/animations';

export interface ProductSectionCardProps {
  title: string;
  icon?: string;
  iconColor?: string;
  products: Product[];
  onViewAll: () => void;
  onProductPress: (product: Product) => void;
}

const ProductSectionCard: React.FC<ProductSectionCardProps> = ({
  title,
  icon,
  iconColor = COLORS.text,
  products,
  onViewAll,
  onProductPress
}) => {
  // Animation values
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(10)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Animate component on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(titleTranslateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Enhanced messaging based on section type
  const getActionText = () => {
    switch (title.toLowerCase()) {
      case 'limited-time deals':
      case 'hot deals':
        return 'Shop Deals';
      case 'just arrived':
      case 'new arrivals':
        return 'See New Items';
      case 'picked for you':
      case 'recommended for you':
        return 'View Picks';
      default:
        return 'Shop All';
    }
  };

  const getItemCount = () => {
    const totalCount = products.length;
    const displayCount = isExpanded ? totalCount : Math.min(3, totalCount);
    return { displayCount, totalCount };
  };

  const handleViewAll = async () => {
    if (loading) return;
    setLoading(true);
    
    // Provide immediate feedback
    setTimeout(() => {
      setLoading(false);
      onViewAll();
    }, 200);
  };

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const { displayCount, totalCount } = getItemCount();
  const displayProducts = products.slice(0, displayCount);
  const hasMore = totalCount > displayCount;
  
  if (products.length === 0) return null;
  
  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }]
          }
        ]}
      >
        <View style={styles.titleContainer}>
          {icon && (
            <Ionicons 
              name={icon as any} 
              size={20} 
              color={iconColor} 
              style={styles.icon} 
            />
          )}
          <Text style={styles.title}>{title}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{totalCount}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={handleViewAll} 
          style={[styles.viewAllButton, loading && styles.buttonLoading]}
          activeOpacity={0.7}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingDot} />
              <View style={[styles.loadingDot, styles.loadingDot2]} />
              <View style={[styles.loadingDot, styles.loadingDot3]} />
            </View>
          ) : (
            <>
              <Text style={styles.viewAllText}>{getActionText()}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={140 + SPACING.element} // Updated for minimal card width
        snapToAlignment="start"
      >
        {displayProducts.map((product, index) => (
          <ProductCard
            key={product.id} 
            product={product} 
            onPress={onProductPress}
            style={styles.productCard}
            animationDelay={100 + (index * 50)} // Staggered animation
            variant="minimal" // Always use the minimal (skinnier) variant
          />
        ))}
        
        {/* Progressive disclosure: Show more button */}
        {hasMore && !isExpanded && (
          <TouchableOpacity 
            style={styles.showMoreCard}
            onPress={handleToggleExpanded}
            activeOpacity={0.8}
          >
            <View style={styles.showMoreContent}>
              <Ionicons name="add" size={24} color={COLORS.primary} />
              <Text style={styles.showMoreText}>Show More</Text>
              <Text style={styles.showMoreCount}>+{totalCount - displayCount}</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Collapse button when expanded */}
      {isExpanded && hasMore && (
        <TouchableOpacity 
          style={styles.collapseButton}
          onPress={handleToggleExpanded}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-up" size={16} color={COLORS.secondary} />
          <Text style={styles.collapseText}>Show Less</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Removed marginBottom - spacing handled by parent
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
  buttonLoading: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginHorizontal: 1,
  },
  loadingDot2: {
    opacity: 0.7,
  },
  loadingDot3: {
    opacity: 0.5,
  },
  viewAllText: {
    ...TYPOGRAPHY.button,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 4,
  },
  scrollContent: {
    paddingLeft: SPACING.md,
    paddingRight: SPACING.element,
  },
  productCard: {
    marginRight: SPACING.element,
    width: 160,
  },
  showMoreCard: {
    width: 120,
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  showMoreContent: {
    alignItems: 'center',
  },
  showMoreText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
  showMoreCount: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.secondary,
    marginTop: 2,
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    marginHorizontal: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  collapseText: {
    ...TYPOGRAPHY.button,
    color: COLORS.secondary,
    marginLeft: 4,
  },
  discountText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.accent,
    fontWeight: 'bold',
  },
});

export default ProductSectionCard; 