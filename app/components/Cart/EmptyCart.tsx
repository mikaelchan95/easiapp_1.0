import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Animated, 
  Easing,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Animations from '../../utils/animations';
import AnimatedButton from '../UI/AnimatedButton';

export default function EmptyCart() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const cartBounceAnim = useRef(new Animated.Value(0)).current;
  
  // Animate on mount
  useEffect(() => {
    // Sequence of animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true
      })
    ]).start(() => {
      // After the initial animation, start the cart bounce
      startCartBounce();
    });
  }, []);
  
  // Bouncing cart animation
  const startCartBounce = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cartBounceAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(cartBounceAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
  };
  
  // Handle navigation to explore products
  const handleExplorePress = () => {
    navigation.navigate('Main', { screen: 'Products' });
  };
  
  // Calculate cart Y position for bounce animation
  const cartYPosition = cartBounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15]
  });
  
  return (
    <View style={styles.container}>
      {/* Status Bar Spacer */}
      <View style={{ height: insets.top, backgroundColor: COLORS.card }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cart</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {/* Empty State Content */}
      <Animated.View 
        style={[
          styles.content,
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        {/* Cart Icon with Bounce Animation */}
        <Animated.View 
          style={[
            styles.iconContainer,
            { transform: [{ translateY: cartYPosition }] }
          ]}
        >
          <Ionicons name="cart-outline" size={80} color={COLORS.inactive} />
        </Animated.View>
        
        <Text style={styles.title}>Your cart is empty</Text>
        <Text style={styles.description}>
          Looks like you haven't added any products to your cart yet
        </Text>
        
        <AnimatedButton
          label="Browse Products"
          icon="compass-outline"
          onPress={handleExplorePress}
          style={styles.exploreButton}
          variant="primary"
          size="large"
        />
      </Animated.View>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    ...SHADOWS.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  title: {
    ...TYPOGRAPHY.h1,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.inactive,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    maxWidth: width * 0.8,
  },
  exploreButton: {
    marginTop: SPACING.lg,
    width: width * 0.7,
  },
}); 