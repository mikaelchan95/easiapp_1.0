import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  ImageSourcePropType
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../../data/mockProducts';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';

export interface FeaturedProductProps {
  product: Product;
  onPress: (product: Product) => void;
}

const FeaturedProduct: React.FC<FeaturedProductProps> = ({ product, onPress }) => {
  const { name, price, imageUrl, rating, inStock } = product;
  
  // Format price to display 2 decimal places if needed
  const formattedPrice = `$${price.toFixed(2)}`;
  
  // Discount calculation
  const hasDiscount = product.originalPrice !== undefined && product.originalPrice > price;
      
  // For local images, we don't need to convert to {uri} format
  const imageSource: ImageSourcePropType = imageUrl;
  
  return (
      <TouchableOpacity 
      style={styles.container}
      onPress={() => onPress(product)}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.detailsContainer}>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
          
          {rating > 0 && (
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.floor(rating) ? "star" : star <= rating + 0.5 ? "star-half" : "star-outline"}
                  size={16}
                  color="#FFC107"
                  style={styles.starIcon}
                />
              ))}
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
          )}
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formattedPrice}</Text>
            {hasDiscount && product.originalPrice && (
              <Text style={styles.originalPrice}>${product.originalPrice.toFixed(2)}</Text>
            )}
          </View>
        </View>
        
        <View style={styles.imageContainer}>
          <Image 
            source={imageSource}
            style={styles.productImage}
            resizeMode="contain"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  detailsContainer: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.inactive,
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: SPACING.sm,
  },
  originalPrice: {
    fontSize: 14,
    color: COLORS.inactive,
    textDecorationLine: 'line-through',
  },
  imageContainer: {
    width: width * 0.35,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
});

export default FeaturedProduct; 