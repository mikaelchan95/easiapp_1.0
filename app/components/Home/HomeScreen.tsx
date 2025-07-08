import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Image, 
  StatusBar,
  RefreshControl
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../types/navigation';
import MobileHeader from '../Layout/MobileHeader';
import BannerCarousel from './BannerCarousel';
import BalanceCards from './BalanceCards';
import ProductSectionCard from '../Products/ProductSectionCard';
import { products, Product } from '../../data/mockProducts';
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
  const { state, testSupabaseIntegration } = useAppContext();
  const { deliveryLocation, setDeliveryLocation } = useDeliveryLocation();
  
  // Get user data from Supabase
  const user = state.user;
  const company = state.company;
  
  // Test Supabase integration behind the scenes on component mount
  useEffect(() => {
    const testIntegration = async () => {
      try {
        console.log('🏠 Home: Testing Supabase integration in background...');
        const success = await testSupabaseIntegration();
        if (success) {
          console.log('🏠 Home: Background Supabase test completed successfully');
        } else {
          console.log('🏠 Home: Background Supabase test failed, using mock data');
        }
      } catch (error) {
        console.log('🏠 Home: Background Supabase test error:', error);
      }
    };

    testIntegration();
  }, []);
  

  
  // Auto-rotate banner every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % 3);
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
      console.log('🏠 Home: Error during refresh:', error);
    }
    
    // Simulate additional data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    HapticFeedback.success();
    setRefreshing(false);
  }, [testSupabaseIntegration]);
  
  // Memoized product sections for better performance
  const productSections = React.useMemo(() => {
    const featuredProducts = products.filter(p => p.rating >= 4.9).slice(0, 6);
    const newArrivals = products.slice(0, 3);
    
    // Personalize recommendations based on user type
    let recommended = products.slice(2, 5);
    if (user && isCompanyUser(user)) {
      // For company users, prioritize premium/business-oriented products
      recommended = products.filter(p => p.price >= 100).slice(0, 3);
    } else if (user) {
      // For individual users, show popular mid-range products
      recommended = products.filter(p => p.rating >= 4.5 && p.price < 200).slice(0, 3);
    }
    
    return {
      featured: featuredProducts,
      hotDeals: featuredProducts.slice(0, 3),
      newArrivals,
      recommended
    };
  }, [user]);
  
  const handleProductPress = useCallback((product: Product) => {
    navigation.navigate('ProductDetail', { id: product.id });
  }, [navigation]);
  
  const handleViewAllPress = useCallback((category?: string) => {
    if (category) {
      navigation.navigate('SmartSearch', { category });
    } else {
      navigation.dispatch(
        CommonActions.navigate({
          name: 'Products'
        })
      );
    }
  }, [navigation]);
  
  const handleAddressPress = useCallback(() => {
    HapticFeedback.selection();
    // Navigate to the new delivery location picker
    navigation.navigate('DeliveryLocationScreen');
  }, [navigation]);
  
  const handleRewardsPress = useCallback(() => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: { screen: 'Rewards' }
      })
    );
  }, [navigation]);
  
  const handleCreditPress = useCallback(() => {
    // Navigate to credit management
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: { screen: 'Profile' }
      })
    );
  }, [navigation]);
  
  // Handle product selection from search
  const handleProductSelect = useCallback((product: Product) => {
    navigation.navigate('ProductDetail', { id: product.id });
  }, [navigation]);
  
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
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
        
        {/* Bottom padding for better scrolling experience */}
        <View style={styles.bottomPadding} />
      </ScrollView>
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
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.section,
  },
  bottomPadding: {
    height: SPACING.xxl,
  },
}); 