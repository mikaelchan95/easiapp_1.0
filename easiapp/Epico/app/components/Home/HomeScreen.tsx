import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Image, 
  StatusBar
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

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavigationProp>();
  const insets = useSafeAreaInsets();
  const [currentBanner, setCurrentBanner] = useState(0);
  
  // Auto-rotate banner every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);
  
  // Memoized product sections for better performance
  const productSections = React.useMemo(() => {
    const featuredProducts = products.filter(p => p.rating >= 4.9).slice(0, 6);
    const newArrivals = products.slice(0, 3);
    const recommended = products.slice(2, 5);
    
    return {
      featured: featuredProducts,
      hotDeals: featuredProducts.slice(0, 3),
      newArrivals,
      recommended
    };
  }, []);
  
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
    // Navigate to address selection in profile
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Main',
        params: { screen: 'Profile' }
      })
    );
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
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.headerContainer}>
        {/* Sticky Header - Without Search */}
        <MobileHeader onAddressPress={handleAddressPress} showSearch={false} />
        
        {/* Search Bar */}
        <ExpandableSearch onProductSelect={handleProductSelect} />
      </View>
      
      {/* Scrollable Content */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Cards */}
        <BalanceCards 
          onCreditClick={handleCreditPress}
          onRewardsClick={handleRewardsPress}
        />
        
        {/* Banner Carousel */}
        <BannerCarousel currentBanner={currentBanner} />
        
        {/* Hot Deals */}
        <ProductSectionCard
          title="Hot Deals"
          icon="flame"
          iconColor="#F44336"
          products={productSections.hotDeals}
          onViewAll={() => handleViewAllPress()}
          onProductPress={handleProductPress}
        />
        
        {/* New Arrivals */}
        <ProductSectionCard
          title="New"
          icon="sparkles"
          iconColor="#2196F3"
          products={productSections.newArrivals}
          onViewAll={() => handleViewAllPress()}
          onProductPress={handleProductPress}
        />
        
        {/* Recommended For You */}
        <ProductSectionCard
          title="For You"
          icon="heart"
          iconColor="#9C27B0"
          products={productSections.recommended}
          onViewAll={() => handleViewAllPress()}
          onProductPress={handleProductPress}
        />
        
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
  statusBarBackground: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  bottomPadding: {
    height: 100,
  },
}); 