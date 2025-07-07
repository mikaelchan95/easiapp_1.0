import React, { useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import * as Animations from '../../utils/animations';

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
  
  // Animation values
  const scaleValue = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(1)).current;
  const quantityAnim = useRef(new Animated.Value(item.quantity)).current;
  
  // State to track removing animation
  const [isRemoving, setIsRemoving] = useState(false);
  
  // Animation for increment and decrement
  const animateQuantityChange = (newQuantity: number) => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut
      })
    ]).start();
    
    Animated.timing(quantityAnim, {
      toValue: newQuantity,
      duration: 200,
      useNativeDriver: false,
      easing: Animations.TIMING.easeOut
    }).start();
  };
  
  // Handle quantity increment
  const incrementQuantity = () => {
    const newQuantity = item.quantity + 1;
    animateQuantityChange(newQuantity);
    onQuantityChange(newQuantity);
  };
  
  // Handle quantity decrement or removal
  const decrementQuantity = () => {
    if (item.quantity === 1) {
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
      // Just decrement the quantity
      const newQuantity = item.quantity - 1;
      animateQuantityChange(newQuantity);
      onQuantityChange(newQuantity);
    }
  };
  
  const handleItemPress = () => {
    navigation.navigate('ProductDetail', { id: item.productId });
  };
  
  // Format price with proper currency
  const formattedPrice = `$${(item.price * item.quantity).toFixed(2)}`;
  const formattedUnitPrice = `$${item.price.toFixed(2)}`;
  
  // Render quantity display
  const renderQuantity = () => {
    return (
      <View style={styles.quantityContainer}>
        <TouchableOpacity 
          style={styles.quantityButton} 
          onPress={decrementQuantity}
          activeOpacity={0.8}
        >
          <Ionicons name="remove" size={16} color={COLORS.text} />
        </TouchableOpacity>
        
        <Animated.Text style={styles.quantityText}>
          {quantityAnim.interpolate({
            inputRange: [0, 100],
            outputRange: Array.from({ length: 101 }, (_, i) => i.toString())
          })}
        </Animated.Text>
        
        <TouchableOpacity 
          style={styles.quantityButton} 
          onPress={incrementQuantity}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={16} color={COLORS.text} />
        </TouchableOpacity>
      </View>
    );
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
          {renderQuantity()}
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
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  unitPrice: {
    fontSize: 14,
    color: COLORS.inactive,
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    paddingHorizontal: SPACING.sm,
    minWidth: 24,
    textAlign: 'center',
  }
});

export default CartItem; 