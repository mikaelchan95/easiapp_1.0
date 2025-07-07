import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { products, Product } from '../../data/mockProducts';
import ProductCard from '../Products/ProductCard';
import { COLORS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import * as Animations from '../../utils/animations';
import AnimatedFeedback from '../UI/AnimatedFeedback';

interface SuggestedAddonsProps {
  cartProductIds: string[];
  onAddToCart: (product: Product) => void;
}

const SuggestedAddons: React.FC<SuggestedAddonsProps> = ({ 
  cartProductIds,
  onAddToCart
}) => {
  const [adding, setAdding] = useState<string | null>(null);
  const [addedProduct, setAddedProduct] = useState<string | null>(null);
  const [feedback, setFeedback] = useState({
    visible: false,
    message: '',
    type: 'success' as 'success' | 'info' | 'error' | 'loading'
  });
  
  // Animation references
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(1)).current;
  
  // Filter out products that are already in cart
  const suggestedProducts = products
    .filter(p => !cartProductIds.includes(p.id))
    .filter(p => p.inStock)
    .slice(0, 4); // Limit to 4 suggestions
  
  if (suggestedProducts.length === 0) {
    return null;
  }
  
  const handleAddProduct = (product: Product) => {
    // Show visual feedback with animation
    setAdding(product.id);
    setFeedback({
      visible: true,
      message: `Adding ${product.name}...`,
      type: 'loading'
    });
    
    // Animate header to draw attention
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1.03,
        duration: 150,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut
      }),
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
        easing: Animations.TIMING.easeInOut
      })
    ]).start();
    
    // Simulate adding to cart with delay for visual feedback
    setTimeout(() => {
      onAddToCart(product);
      setAdding(null);
      setAddedProduct(product.id);
      
      // Update feedback
      setFeedback({
        visible: true,
        message: `${product.name} added to cart!`,
        type: 'success'
      });
      
      // Hide feedback after delay
      setTimeout(() => {
        setFeedback(prev => ({ ...prev, visible: false }));
        setAddedProduct(null);
      }, 2000);
    }, 600);
  };
  
  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.header,
          { transform: [{ scale: headerAnim }] }
        ]}
      >
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Customers Also Bought</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.viewAllButton}
          activeOpacity={0.7}
          onPress={() => {
            // Add pulse animation when pressed
            Animations.pulseAnimation(headerAnim).start();
          }}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.inactive} />
        </TouchableOpacity>
      </Animated.View>
      
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollAnim } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {suggestedProducts.map((product, index) => {
          // Create animated style for each card
          const inputRange = [
            (index - 1) * 160, // Previous card position
            index * 160,       // Current card position
            (index + 1) * 160  // Next card position
          ];
          
          // Create subtle parallax and scaling effect while scrolling
          const scale = scrollAnim.interpolate({
            inputRange,
            outputRange: [0.95, 1, 0.95],
            extrapolate: 'clamp'
          });
          
          return (
            <Animated.View 
              key={product.id}
              style={[
                styles.productCardContainer,
                { 
                  transform: [{ scale }],
                  // Highlight card when being added
                  backgroundColor: adding === product.id ? '#f8f8f8' : 'transparent',
                  // Subtle glow when just added
                  shadowOpacity: addedProduct === product.id ? 0.3 : 0
                }
              ]}
            >
              <ProductCard
                product={product}
                onPress={handleAddProduct}
                isCompact={true}
                style={styles.productCard}
              />
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
      
      {/* Feedback notification */}
      <AnimatedFeedback
        visible={feedback.visible}
        message={feedback.message}
        type={feedback.type}
        position="bottom"
        onHide={() => setFeedback(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: SPACING.lg,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: COLORS.background,
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
    padding: 6,
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
  productCardContainer: {
    marginRight: SPACING.sm,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  productCard: {
    width: 160,
  }
});

export default SuggestedAddons; 