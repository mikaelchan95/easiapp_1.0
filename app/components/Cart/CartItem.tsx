import React, { useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import * as Animations from '../../utils/animations';
import QuantitySelector from '../UI/QuantitySelector';

type CartItemProps = {
  item: {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: any; // Changed to accept require() format
    inStock?: boolean;
  };
  onQuantityChange: (quantity: number) => void;
};

type ProductNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ProductDetail'>;

const CartItem: React.FC<CartItemProps> = ({ item, onQuantityChange }) => {
  const navigation = useNavigation<ProductNavigationProp>();
  
  // Animation values for item removal
  const scaleValue = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;
  
  // State to track removing animation
  const [isRemoving, setIsRemoving] = useState(false);
  
  const handleItemPress = () => {
    navigation.navigate('ProductDetail', { id: item.productId });
  };
  
  // Format price with proper currency
  const formattedPrice = `$${(item.price * item.quantity).toFixed(2)}`;
  const formattedUnitPrice = `$${item.price.toFixed(2)}`;
  
  // Handle quantity change with the new standardized component
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity === 0) {
      // Item will be removed, animate the removal
      setIsRemoving(true);
      
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
          easing: Animations.TIMING.easeIn
        }),
        Animated.timing(opacityValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Animations.TIMING.easeIn
        })
      ]).start(() => {
        onQuantityChange(0); // Remove the item
      });
         } else {
       // Update quantity
       onQuantityChange(newQuantity);
     }
  };
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          transform: [
            { scale: scaleValue },
            { translateX: slideAnim }
          ],
          opacity: opacityValue
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.imageContainer} 
        onPress={handleItemPress}
      >
        <Image 
          source={item.imageUrl} 
          style={styles.image}
          resizeMode="contain"
        />
      </TouchableOpacity>
      
      <View style={styles.content}>
        <TouchableOpacity onPress={handleItemPress}>
          <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        </TouchableOpacity>
        
        <Text style={styles.unitPrice}>{formattedUnitPrice} each</Text>
        
        <View style={styles.actionRow}>
          <QuantitySelector
            value={item.quantity}
            onChange={handleQuantityChange}
            size="medium"
            productName={item.name}
          />
          <Text style={styles.price}>{formattedPrice}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    ...SHADOWS.light
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
  },
  name: {
    ...TYPOGRAPHY.h5,
    fontWeight: '600',
    marginBottom: 4,
  },
  unitPrice: {
    ...TYPOGRAPHY.caption,
    color: COLORS.inactive,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    ...TYPOGRAPHY.h4,
    fontWeight: '700',
  }
});

export default CartItem; 