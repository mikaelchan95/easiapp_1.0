import React, { useRef, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { products, Product } from '../../data/mockProducts';
import { COLORS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { CartNotificationContext } from '../../context/CartNotificationContext';
import { HapticFeedback } from '../../utils/haptics';
import * as Animations from '../../utils/animations';
import EnhancedProductCard from '../Products/EnhancedProductCard';
import { useNavigation } from '@react-navigation/native';

interface SuggestedAddonsProps {
  cartProductIds: string[];
  onAddToCart: (product: Product) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = 180; // Match EnhancedProductCard width
const CARD_SPACING = 16;

const SuggestedAddons: React.FC<SuggestedAddonsProps> = ({ 
  cartProductIds,
  onAddToCart
}) => {
  const navigation = useNavigation();
  const { showCartNotification } = useContext(CartNotificationContext);
  
  // Animation references
  const headerAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Filter and enhance product suggestions
  const suggestedProducts = products
    .filter(p => !cartProductIds.includes(p.id))

    .slice(0, 6) // Show more suggestions
    .map(product => ({
      ...product,
      // Add some mock "customers also bought" logic
      popularity: Math.floor(Math.random() * 100) + 50,
      discount: product.retailPrice > product.tradePrice ? 
        Math.round(((product.retailPrice - product.tradePrice) / product.retailPrice) * 100) : 0
    }))
    .sort((a, b) => b.popularity - a.popularity);
  
  // Animate on mount
  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: 200,
      useNativeDriver: true
    }).start();
  }, []);
  
  if (suggestedProducts.length === 0) {
    return null;
  }
  


  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { id: product.id });
  };
  
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Enhanced Header */}
      <Animated.View 
        style={[
          styles.header,
          { transform: [{ scale: headerAnim }] }
        ]}
      >
        <View style={styles.titleContainer}>
          <Ionicons name="people" size={20} color={COLORS.primary} style={styles.icon} />
          <Text style={styles.title}>Customers Also Bought</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.viewAllButton}
          activeOpacity={0.7}
          onPress={() => {
            HapticFeedback.light();
            Animations.pulseAnimation(headerAnim).start();
          }}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Product Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_SPACING}
        snapToAlignment="start"
      >
        {suggestedProducts.map((product, index) => (
          <EnhancedProductCard
            key={product.id}
            product={product}
            onPress={handleProductPress}
            style={styles.productCard}
            animationDelay={index * 100}
            isCompact={false}
          />
        ))}
      </ScrollView>
      
      {/* Subtle divider */}
      <View style={styles.divider} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.background,
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
    marginRight: 8,
  },
  title: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: COLORS.card,
  },
  viewAllText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
  },
  productCard: {
    width: CARD_WIDTH,
    marginRight: CARD_SPACING,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    opacity: 0.5,
  },
});

export default SuggestedAddons; 