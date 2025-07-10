import React, { useRef, useEffect, useMemo } from 'react';
import { NavigationContainer, DefaultTheme, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable,
  Animated,
  TouchableWithoutFeedback,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import app context
import { AppProvider, AppContext } from './app/context/AppContext';
import { TransitionProvider } from './app/context/TransitionContext';
import CartNotificationProvider, { CartNotificationContext } from './app/context/CartNotificationContext';
import { RewardsProvider } from './app/context/RewardsContext';

// Import achievement notification
import PurchaseAchievementNotification from './app/components/UI/PurchaseAchievementNotification';
import notificationService from './app/services/notificationService';
import * as Notifications from 'expo-notifications';

// Import screens
import HomeScreen from './app/components/Home/HomeScreen';
import ProductsScreen from './app/components/Products/ProductsScreen';
import ProductDetailScreen from './app/components/Products/ProductDetailScreen';
import SmartSearchScreen from './app/components/Products/SmartSearchScreen';
import CartScreen from './app/components/Cart/CartScreen';
import ProfileScreen from './app/components/Profile/ProfileScreen';
import RewardsScreen from './app/components/Rewards/RewardsScreen';
import CheckoutScreen from './app/components/Checkout/CheckoutScreen';
import OrderSuccessScreen from './app/components/Checkout/OrderSuccessScreen';
import OrderTrackingScreen from './app/components/Checkout/OrderTrackingScreen';
import MomentumShowcase from './app/components/UI/MomentumShowcase';

// Import Chat screen
import ChatScreen from './app/components/Chat/ChatScreen';
import OrderHistoryScreen from './app/components/Activities/OrderHistoryScreen';
import WishlistScreen from './app/components/Activities/WishlistScreen';
import ReviewsScreen from './app/components/Activities/ReviewsScreen';
import SupportScreen from './app/components/Activities/SupportScreen';
import ActivitiesScreen from './app/components/Activities/ActivitiesScreen';
import LocationPickerDemo from './app/components/Location/LocationPickerDemo';
import LocationPickerScreen from './app/components/Location/LocationPickerScreen';
import UberStyleLocationScreen from './app/components/Location/UberStyleLocationScreen';
import SavedLocationsScreen from './app/components/Location/SavedLocationsScreen';

// Import Company screens
import CompanyProfileScreen from './app/components/Profile/CompanyProfileScreen';
import TeamManagementScreen from './app/components/Profile/TeamManagementScreen';

// Import Rewards screens
import VoucherTrackingScreen from './app/components/Rewards/VoucherTrackingScreen';
import RewardsFAQScreen from './app/components/Rewards/RewardsFAQScreen';
import ReferralScreen from './app/components/Rewards/ReferralScreen';
import ReferralHistoryScreen from './app/components/Rewards/ReferralHistoryScreen';
import InviteFriendsScreen from './app/components/Rewards/InviteFriendsScreen';
import AchievementsScreen from './app/components/Rewards/AchievementsScreen';
import MilestonesScreen from './app/components/Rewards/MilestonesScreen';
import RewardsAnalyticsScreen from './app/components/Rewards/RewardsAnalyticsScreen';

// Import types and theme
import { RootStackParamList, MainTabParamList } from './app/types/navigation';
import { COLORS, SHADOWS, TYPOGRAPHY, SPACING, FONT_WEIGHTS } from './app/utils/theme';
import * as Animations from './app/utils/animations';

// Import reusable components
import AnimatedFeedback from './app/components/UI/AnimatedFeedback';
import CartNotification from './app/components/UI/CartNotification';
import { HapticFeedback } from './app/utils/haptics';

// Stack and Tab navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Define the theme
const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.card,
    text: COLORS.text,
    border: COLORS.border,
  },
};

// Animated cart badge component
function AnimatedCartBadge({ count }: { count: number }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(count);
  
  useEffect(() => {
    if (count > prevCount.current) {
      // Item added - bounce animation
      HapticFeedback.light();
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 300,
          useNativeDriver: true,
        })
      ]).start();
      
      // Bounce effect
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1.2,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
    prevCount.current = count;
  }, [count]);
  
  return (
    <Animated.View 
      style={[
        styles.cartBadge,
        {
          transform: [
            { scale: scaleAnim },
            { scale: bounceAnim }
          ]
        }
      ]}
    >
      <Text style={styles.cartBadgeText}>
        {count > 99 ? '99+' : count}
      </Text>
    </Animated.View>
  );
}

// Custom animated tab bar button
function TabBarButton({ onPress, children, isActive, route }: any) {
  // Animation values
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(isActive ? 1 : 0.7)).current;
  
  // Handle press animations with modern spring physics
  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };
  
  // Handle active state animation
  useEffect(() => {
    Animated.spring(opacityValue, {
      toValue: isActive ? 1 : 0.7,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  }, [isActive]);
  
  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${route.name} tab`}
    >
      <Animated.View style={{ 
        transform: [{ scale: scaleValue }],
        opacity: opacityValue
      }}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

// Animated profile icon with jiggle effect
function AnimatedProfileIcon({ hasNotification, isFocused }: { hasNotification: boolean; isFocused: boolean }) {
  const jiggleAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (hasNotification && !isFocused) {
      // Start jiggle animation
      const jiggle = () => {
        Animated.sequence([
          Animated.timing(jiggleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(jiggleAnim, {
            toValue: -1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(jiggleAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(jiggleAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Repeat jiggle every 3 seconds
          setTimeout(jiggle, 3000);
        });
      };
      
      jiggle();
    } else {
      jiggleAnim.setValue(0);
    }
  }, [hasNotification, isFocused, jiggleAnim]);
  
  return (
    <Animated.View
      style={{
        transform: [
          {
            rotate: jiggleAnim.interpolate({
              inputRange: [-1, 1],
              outputRange: ['-5deg', '5deg'],
            }),
          },
        ],
      }}
    >
      <Ionicons 
        name="person-outline" 
        size={22} 
        color={isFocused ? COLORS.accent : COLORS.inactive} 
      />
      {hasNotification && (
        <View style={styles.notificationDot} />
      )}
    </Animated.View>
  );
}

// Custom tab bar component for better control
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { state: appState } = React.useContext(AppContext);
  const cartItemCount = appState.cart.reduce((count, item) => count + item.quantity, 0);
  
  // Mock notification states - in a real app, these would come from context/state
  const hasProfileNotifications = true; // New features, updates, etc.
  
  return (
    <View style={[
      styles.tabBarWrapper,
      { 
        paddingBottom: Math.max(insets.bottom, 12),
        paddingTop: 8
      }
    ]}>
      {/* Main navbar container */}
      <View style={styles.navbarContainer}>
        {/* Menu wrapper */}
        <View style={styles.menuWrapper}>
          {state.routes.map((route: any, index: number) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            // Icon mapping
            let iconName: string = 'help-circle-outline';
            let label: string = route.name;
            
            if (route.name === 'Home') {
              iconName = 'home-outline';
              label = 'Home';
            } else if (route.name === 'Products') {
              iconName = 'grid-outline';
              label = 'Explore';
            } else if (route.name === 'Cart') {
              iconName = 'bag-outline';
              label = 'Cart';
            } else if (route.name === 'Rewards') {
              iconName = 'star-outline';
              label = 'Rewards';
            } else if (route.name === 'Profile') {
              iconName = 'person-outline';
              label = 'Profile';
            }

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                HapticFeedback.selection();
                navigation.navigate(route.name);
              }
            };

            return (
              <TabBarButton
                key={route.key}
                onPress={onPress}
                isActive={isFocused}
                route={route}
              >
                <View style={styles.tabItemWrapper}>
                  <View style={[
                    styles.menuButtonContainer,
                    isFocused && styles.activeMenuButton
                  ]}>
                    <View style={styles.menuButton}>
                      <View style={styles.iconContainer}>
                        {/* Special handling for Profile tab with jiggle animation */}
                        {route.name === 'Profile' ? (
                          <AnimatedProfileIcon 
                            hasNotification={hasProfileNotifications} 
                            isFocused={isFocused} 
                          />
                        ) : (
                          <Ionicons 
                            name={iconName as any} 
                            size={22} 
                            color={isFocused ? COLORS.accent : COLORS.inactive} 
                          />
                        )}
                        
                        {/* Cart badge with animation */}
                        {route.name === 'Cart' && cartItemCount > 0 && (
                          <AnimatedCartBadge count={cartItemCount} />
                        )}
                      </View>
                    </View>
                  </View>
                  
                  {/* Tab label */}
                  <Text style={[
                    styles.tabLabel,
                    isFocused && styles.activeTabLabel
                  ]}>
                    {label}
                  </Text>
                </View>
              </TabBarButton>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// Main tab navigator
function MainTabs() {
  const { state } = React.useContext(AppContext);
  const cartItemCount = state.cart.reduce((count, item) => count + item.quantity, 0);
  
  return (
    // @ts-ignore - Ignore ID requirement
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
      />
      <Tab.Screen 
        name="Products" 
        component={ProductsScreen}
      />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen}
        initialParams={{ count: cartItemCount }}
      />
      <Tab.Screen 
        name="Rewards" 
        component={RewardsScreen}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}

// Global Achievement Notification Wrapper
const GlobalAchievementWrapper: React.FC<{ 
  children: React.ReactNode;
  navigationRef?: any;
}> = ({ children, navigationRef }) => {
  const { state, dispatch } = React.useContext(AppContext);
  
  const handleViewOrder = () => {
    // Navigate to profile page with order highlight
    if (navigationRef?.isReady()) {
      navigationRef.navigate('Main', { 
        screen: 'Profile',
        params: { highlightRecentOrder: true }
      });
    }
    dispatch({ type: 'HIDE_PURCHASE_ACHIEVEMENT' });
  };
  
  const handleDismiss = () => {
    dispatch({ type: 'HIDE_PURCHASE_ACHIEVEMENT' });
  };
  
  return (
    <>
      {children}
      {state.purchaseAchievement.data && (
        <PurchaseAchievementNotification
          visible={state.purchaseAchievement.visible}
          orderTotal={state.purchaseAchievement.data.orderTotal}
          pointsEarned={state.purchaseAchievement.data.pointsEarned}
          savingsAmount={state.purchaseAchievement.data.savingsAmount}
          onDismiss={handleDismiss}
          onViewOrder={handleViewOrder}
        />
      )}
    </>
  );
};

export default function App() {
  const navigationRef = useNavigationContainerRef();
  
  // Initialize notifications
  React.useEffect(() => {
    let notificationSubscription: (() => void) | null = null;

    const initializeNotifications = async () => {
      try {
        await notificationService.initialize();
        
        // Add notification listeners
        notificationSubscription = notificationService.addNotificationListener(
          (notification) => {
            console.log('📱 Notification received:', notification);
          },
          (response) => {
            console.log('📱 Notification response:', response);
            const data = response.notification.request.content.data;
            
            // Handle order update notifications
            if (data?.type === 'order_update' && data?.orderId && typeof data.orderId === 'string') {
              if (navigationRef.isReady()) {
                navigationRef.navigate('OrderTracking', { orderId: data.orderId });
              }
            }
          }
        );
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initializeNotifications();

    return () => {
      if (notificationSubscription) {
        notificationSubscription();
      }
    };
  }, [navigationRef]);
  
  // Global feedback state
  const [feedbackState, setFeedbackState] = React.useState<{
    visible: boolean;
    type: 'success' | 'error' | 'info' | 'loading';
    message: string;
  }>({
    visible: false,
    type: 'success',
    message: ''
  });
  
  // Show feedback function
  const showFeedback = (type: 'success' | 'error' | 'info' | 'loading', message: string): void => {
    setFeedbackState({
      visible: true,
      type,
      message
    });
    
    // Auto-hide after 2 seconds for non-loading feedback
    if (type !== 'loading') {
      setTimeout(() => {
        setFeedbackState(prev => ({ ...prev, visible: false }));
      }, 2000);
    }
  };
  
  // Hide feedback function
  const hideFeedback = () => {
    setFeedbackState(prev => ({ ...prev, visible: false }));
  };
  
  // Function to navigate to cart
  const navigateToCart = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Main', { screen: 'Cart' });
    }
  };
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <RewardsProvider>
            <CartNotificationProvider>
              <TransitionProvider>
              <StatusBar style="dark" />
              <GlobalAchievementWrapper navigationRef={navigationRef}>
                <NavigationContainer ref={navigationRef} theme={MyTheme}>
                {/* @ts-ignore - Ignore ID requirement */}
                <Stack.Navigator 
                  screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    animationDuration: 300,
                    gestureEnabled: true,
                    gestureDirection: 'horizontal',
                  }}
                >
                  <Stack.Screen name="Main" component={MainTabs} />
                  <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
                  <Stack.Screen name="SmartSearch" component={SmartSearchScreen} />
                  <Stack.Screen 
                    name="Checkout" 
                    component={CheckoutScreen}
                  />
                  <Stack.Screen 
                    name="OrderSuccess" 
                    component={OrderSuccessScreen}
                    options={{ 
                      animation: 'fade',
                      gestureEnabled: false
                    }}
                  />
                  <Stack.Screen 
                    name="OrderTracking" 
                    component={OrderTrackingScreen}
                  />
                  <Stack.Screen 
                    name="MomentumShowcase" 
                    component={MomentumShowcase}
                  />
                  <Stack.Screen 
                    name="OrderHistory" 
                    component={OrderHistoryScreen}
                  />
                  <Stack.Screen 
                    name="OrderDetails" 
                    component={OrderTrackingScreen}
                  />
                  <Stack.Screen 
                    name="Wishlist" 
                    component={WishlistScreen}
                  />
                  <Stack.Screen 
                    name="Reviews" 
                    component={ReviewsScreen}
                  />
                  <Stack.Screen 
                    name="Support" 
                    component={SupportScreen}
                  />
                  <Stack.Screen 
                    name="Rewards" 
                    component={RewardsScreen}
                  />
                  <Stack.Screen 
                    name="VoucherTracking" 
                    component={VoucherTrackingScreen}
                  />
                  <Stack.Screen 
                    name="RewardsFAQ" 
                    component={RewardsFAQScreen}
                  />
                  <Stack.Screen 
                    name="ReferralScreen" 
                    component={ReferralScreen}
                  />
                  <Stack.Screen 
                    name="ReferralHistory" 
                    component={ReferralHistoryScreen}
                  />
                  <Stack.Screen 
                    name="InviteFriends" 
                    component={InviteFriendsScreen}
                  />
                  <Stack.Screen 
                    name="AchievementsScreen" 
                    component={AchievementsScreen}
                  />
                  <Stack.Screen 
                    name="MilestonesScreen" 
                    component={MilestonesScreen}
                  />
                  <Stack.Screen 
                    name="RewardsAnalytics" 
                    component={RewardsAnalyticsScreen}
                  />
                  <Stack.Screen 
                    name="Referrals" 
                    component={ActivitiesScreen}
                  />
                  <Stack.Screen 
                    name="LocationPickerDemo" 
                    component={LocationPickerDemo}
                  />
                  <Stack.Screen 
                    name="LocationPickerScreen" 
                    component={LocationPickerScreen}
                  />
                  <Stack.Screen 
                    name="UberStyleLocationScreen" 
                    component={UberStyleLocationScreen}
                  />
                  <Stack.Screen 
                    name="DeliveryLocationScreen" 
                    component={UberStyleLocationScreen}
                  />
                  <Stack.Screen 
                    name="SavedLocations" 
                    component={SavedLocationsScreen}
                  />
                  <Stack.Screen 
                    name="CompanyProfile" 
                    component={CompanyProfileScreen}
                  />
                  <Stack.Screen 
                    name="TeamManagement" 
                    component={TeamManagementScreen}
                  />
                </Stack.Navigator>
                
                {/* Global cart notification with navigation ref */}
                <CartNotificationConsumer navigateToCart={navigateToCart} />
                </NavigationContainer>
              </GlobalAchievementWrapper>
              
              {/* Global feedback component */}
              <AnimatedFeedback
                type={feedbackState.type}
                message={feedbackState.message}
                visible={feedbackState.visible}
                onHide={hideFeedback}
              />
              </TransitionProvider>
            </CartNotificationProvider>
          </RewardsProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Separate component to consume the CartNotificationContext
const CartNotificationConsumer = React.memo(({ navigateToCart }: { navigateToCart: () => void }) => {
  const { visible, itemCount, lastItemName, hideCartNotification } = React.useContext(CartNotificationContext);
  
  // Memoize the onViewCart callback to prevent re-renders
  const handleViewCart = React.useCallback(() => {
    navigateToCart();
  }, [navigateToCart]);
  
  return (
    <CartNotification
      visible={visible}
      itemCount={itemCount}
      lastItemName={lastItemName}
      onHide={hideCartNotification}
      onViewCart={handleViewCart}
    />
  );
});

// Give the component a display name for debugging
CartNotificationConsumer.displayName = 'CartNotificationConsumer';

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
    minHeight: 80,
  },
  navbarContainer: {
    backgroundColor: COLORS.card,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  menuWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: '95%',
    alignSelf: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  menuButtonContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  activeMenuButton: {
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.primary,
    ...SHADOWS.medium,
  },
  iconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.error,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.card,
    zIndex: 1,
    ...SHADOWS.light,
  },
  cartBadgeText: {
    ...TYPOGRAPHY.tiny,
    color: COLORS.accent,
    fontWeight: FONT_WEIGHTS.bold,
    fontSize: 10,
    lineHeight: 12,
  },
  tabItemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  tabLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
    fontWeight: FONT_WEIGHTS.medium,
  },
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  notificationDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
    borderWidth: 1,
    borderColor: COLORS.card,
  },
}); 