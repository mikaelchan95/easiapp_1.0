import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductCard from './ProductCard';
import { Product } from '../../data/mockProducts';
import { COLORS, SPACING, TYPOGRAPHY } from '../../utils/theme';
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
  iconColor = '#000',
  products,
  onViewAll,
  onProductPress
}) => {
  // Animation values
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(10)).current;
  
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
        </View>
        
        <TouchableOpacity 
          onPress={onViewAll} 
          style={styles.viewAllButton}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.inactive} />
        </TouchableOpacity>
      </Animated.View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={160 + SPACING.sm} // Card width + margin
        snapToAlignment="start"
      >
        {products.map((product, index) => (
          <ProductCard
            key={product.id} 
            product={product} 
            onPress={onProductPress}
            style={styles.productCard}
            animationDelay={100 + (index * 50)} // Staggered animation
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.inactive,
    marginRight: 4,
  },
  scrollContent: {
    paddingLeft: SPACING.md,
    paddingRight: SPACING.sm,
  },
  productCard: {
    marginRight: SPACING.sm,
    width: 160,
  },
});

export default ProductSectionCard; 