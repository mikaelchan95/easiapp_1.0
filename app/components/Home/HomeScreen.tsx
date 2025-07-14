import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import MobileHeader from '../Layout/MobileHeader';
import BannerCarousel from './BannerCarousel';
import BalanceCards from './BalanceCards';
import ProductSectionCard from '../Products/ProductSectionCard';
import ShopByBrandsSection from './ShopByBrandsSection';
import PastOrdersSection from './PastOrdersSection';
import BackToTopButton from '../UI/BackToTopButton';
import { Product } from '../../utils/pricing';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import ExpandableSearch from '../Products/ExpandableSearch';
import { HapticFeedback } from '../../utils/haptics';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';
import { useAppContext } from '../../context/AppContext';
import DeliveryLocationHeader from '../Location/DeliveryLocationHeader';
import { isCompanyUser } from '../../types/user';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const insets = useSafeAreaInsets();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { state, dispatch, testSupabaseIntegration } = useAppContext();
  const { deliveryLocation, setDeliveryLocation } = useDeliveryLocation();
  const scrollViewRef = useRef<ScrollView>(null);

  // Get user data from Supabase
  const user = state.user;
  const company = state.company;

  // Test Supabase integration behind the scenes on component mount
  useEffect(() => {
    const testIntegration = async () => {
      try {
        console.log('Home: Testing Supabase integration in background...');
        const success = await testSupabaseIntegration();
        if (success) {
          console.log('Home: Background Supabase test completed successfully');
        } else {
          console.log('Home: Background Supabase test failed, using mock data');
        }
      } catch (error) {
        console.log('Home: Background Supabase test error:', error);
      }
    };

    testIntegration();
  }, []);

  // Auto-rotate banner every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Handle pull to refresh
  const handleRefresh = useCallback(async () => {
    HapticFeedback.medium();
    setRefreshing(true);

    // Test Supabase integration on refresh
    try {
      await testSupabaseIntegration();
    } catch (error) {
      console.log('Home: Error during refresh:', error);
    }

    // Simulate additional data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));

    HapticFeedback.success();
    setRefreshing(false);
  }, [testSupabaseIntegration]);

  // Memoized product sections for better performance
  const productSections = React.useMemo(() => {
    const products = state.products || [];
    const featuredProducts = products
      .filter(p => (p.rating || 0) >= 4.9)
      .slice(0, 6);
    const newArrivals = products.slice(0, 3);

    // Personalize recommendations based on user type
    let recommended = products.slice(2, 5);
    if (user && isCompanyUser(user)) {
      // For company users, prioritize premium/business-oriented products
      recommended = products.filter(p => p.retailPrice >= 100).slice(0, 3);
    } else if (user) {
      // For individual users, show popular mid-range products
      recommended = products
        .filter(p => (p.rating || 0) >= 4.5 && p.retailPrice < 200)
        .slice(0, 3);
    }

    return {
      featured: featuredProducts,
      hotDeals: featuredProducts.slice(0, 3),
      newArrivals,
      recommended,
    };
  }, [user, state.products]);

  const handleProductPress = useCallback(
    (product: Product) => {
      navigation.navigate('ProductDetail', { id: product.id });
    },
    [navigation]
  );

  const handleViewAllPress = useCallback(
    (category?: string) => {
      if (category) {
        navigation.navigate('SmartSearch', { category });
      } else {
        navigation.dispatch(
          CommonActions.navigate({
            name: 'Products',
          })
        );
      }
    },
    [navigation]
  );

  const handleAddressPress = useCallback(() => {
    HapticFeedback.selection();
    // Navigate to the new delivery location picker
    navigation.navigate('DeliveryLocationScreen');
  }, [navigation]);

  const handleRewardsPress = useCallback(() => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: { screen: 'Rewards' },
      })
    );
  }, [navigation]);

  const handleCreditPress = useCallback(() => {
    // Navigate to credit management
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: { screen: 'Profile' },
      })
    );
  }, [navigation]);

  // Handle product selection from search
  const handleProductSelect = useCallback(
    (product: Product) => {
      navigation.navigate('ProductDetail', { id: product.id });
    },
    [navigation]
  );

  // Handle scroll events for back to top button
  const handleScroll = useCallback((event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setShowBackToTop(scrollY > 300); // Show after scrolling 300px
  }, []);

  // Handle back to top button press
  const handleBackToTop = useCallback(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    HapticFeedback.light();
  }, []);

  // Handle brand press
  const handleBrandPress = useCallback(
    (brand: any) => {
      // Navigate to products filtered by brand
      navigation.navigate('SmartSearch', { category: brand.category });
    },
    [navigation]
  );

  // Handle brands view all
  const handleBrandsViewAll = useCallback(() => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Products',
      })
    );
  }, [navigation]);

  // Handle past order press
  const handlePastOrderPress = useCallback(
    (order: any) => {
      // Navigate to order history for now - in a real app this would show order details
      navigation.navigate('OrderHistory');
    },
    [navigation]
  );

  // Handle past orders view all
  const handlePastOrdersViewAll = useCallback(() => {
    navigation.navigate('OrderHistory');
  }, [navigation]);

  // Handle reorder
  const handleReorder = useCallback(
    (order: any) => {
      // Clear current cart and add order items back to cart
      console.log('Reordering:', order.orderNumber);

      // Clear current cart first
      dispatch({ type: 'CLEAR_CART' });

      // Add each item from the order to the cart
      order.items.forEach(item => {
        dispatch({
          type: 'ADD_TO_CART',
          payload: {
            product: {
              id: item.id,
              name: item.name,
              price: item.price,
              image: item.image,
              retailPrice: item.price,
              tradePrice: item.price * 0.9, // Assume 10% trade discount
              stockQuantity: 999, // Assume in stock
              description: `Reordered: ${item.name}`,
              category: 'Reorder',
              isAvailable: true,
            },
            quantity: item.quantity,
          },
        });
      });

      // Navigate to cart to show the recreated cart
      navigation.navigate('Cart');

      // Show success feedback
      HapticFeedback.success();
    },
    [dispatch, navigation]
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        {/* Delivery Location Header - Moved to Top */}
        <View style={styles.topLocationContainer}>
          <DeliveryLocationHeader
            location={deliveryLocation}
            onPress={handleAddressPress}
            showDeliveryInfo={true}
            showSavedLocations={false}
            style={styles.topLocationHeader}
          />
        </View>

        {/* Mobile Header */}
        <MobileHeader
          showBackButton={false}
          showLocationHeader={false}
          showSearch={true}
        />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Balance Cards */}
        <View style={styles.section}>
          <BalanceCards
            onCreditClick={handleCreditPress}
            onRewardsClick={handleRewardsPress}
            isLoggedIn={!!user}
          />
        </View>

        {/* Banner Carousel */}
        <View style={styles.section}>
          <BannerCarousel currentBanner={currentBanner} />
        </View>

        {/* Hot Deals */}
        <View style={styles.section}>
          <ProductSectionCard
            title="Hot Deals"
            icon="flame"
            iconColor="#F44336"
            products={productSections.hotDeals}
            onViewAll={() => handleViewAllPress()}
            onProductPress={handleProductPress}
          />
        </View>

        {/* New Arrivals */}
        <View style={styles.section}>
          <ProductSectionCard
            title="New"
            icon="sparkles"
            iconColor="#2196F3"
            products={productSections.newArrivals}
            onViewAll={() => handleViewAllPress()}
            onProductPress={handleProductPress}
          />
        </View>

        {/* Recommended For You */}
        <View style={styles.section}>
          <ProductSectionCard
            title="For You"
            icon="heart"
            iconColor="#9C27B0"
            products={productSections.recommended}
            onViewAll={() => handleViewAllPress()}
            onProductPress={handleProductPress}
          />
        </View>

        {/* Shop by Brands */}
        <View style={styles.section}>
          <ShopByBrandsSection
            onBrandPress={handleBrandPress}
            onViewAll={handleBrandsViewAll}
          />
        </View>

        {/* Past Orders */}
        <View style={styles.section}>
          <PastOrdersSection
            onOrderPress={handlePastOrderPress}
            onViewAll={handlePastOrdersViewAll}
            onReorderPress={handleReorder}
          />
        </View>

        {/* Bottom padding for better scrolling experience */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Back to Top Button */}
      <BackToTopButton visible={showBackToTop} onPress={handleBackToTop} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    backgroundColor: COLORS.card,
    zIndex: 10,
    ...SHADOWS.light,
    paddingBottom: SPACING.sm,
  },
  topLocationContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  topLocationHeader: {
    backgroundColor: '#000', // Black background
    borderColor: '#333', // Dark border
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140, // Extra padding to ensure content isn't covered by back to top button
  },
  section: {
    marginBottom: SPACING.section,
  },
  bottomPadding: {
    height: SPACING.xxl,
  },
});
