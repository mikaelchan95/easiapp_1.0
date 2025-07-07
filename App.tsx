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

// Import types and theme
import { RootStackParamList, MainTabParamList } from './app/types/navigation';
import { COLORS, SHADOWS } from './app/utils/theme';
import * as Animations from './app/utils/animations';

// Import reusable components
import AnimatedFeedback from './app/components/UI/AnimatedFeedback';
import CartNotification from './app/components/UI/CartNotification';

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

// Custom animated tab bar button
function TabBarButton({ onPress, children, isActive }: any) {
  // Animation value for scale
  const scaleValue = useRef(new Animated.Value(1)).current;
  
  // Handle press animations
  const handlePressIn = () => {
    Animated.timing(scaleValue, {
      toValue: 0.92,
      duration: 150,
      useNativeDriver: true,
      easing: Animations.TIMING.easeOut
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true
    }).start();
  };
  
  // Handle active state animation
  useEffect(() => {
    if (isActive) {
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [isActive]);
  
  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

// Custom tab bar component for better control
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[
      styles.tabBarContainer,
      { paddingBottom: Math.max(insets.bottom, 10) }
    ]}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        let iconName: string = 'help-circle-outline';
        if (route.name === 'Home') iconName = 'home';
        else if (route.name === 'Products') iconName = isFocused ? 'compass' : 'compass-outline';
        else if (route.name === 'Cart') iconName = isFocused ? 'cart' : 'cart-outline';
        else if (route.name === 'Rewards') iconName = isFocused ? 'trophy' : 'trophy-outline';
        else if (route.name === 'Chat') iconName = isFocused ? 'chatbubble' : 'chatbubble-outline';
        else if (route.name === 'Profile') iconName = isFocused ? 'person' : 'person-outline';

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Special styles for Home button
        const isHome = route.name === 'Home';

        return (
          <View key={route.key} style={styles.tabItemContainer}>
            <TabBarButton
              onPress={onPress}
              isActive={isFocused}
            >
              <View style={[
                styles.tabButton,
                isHome && styles.homeTabButton
              ]}>
                <View style={[
                  styles.tabIconContainer,
                  isHome && styles.homeIconContainer,
                  isFocused && (isHome ? styles.activeHomeIconContainer : styles.activeTabIconContainer)
                ]}>
                  <Ionicons 
                    name={iconName as any} 
                    size={isHome ? 24 : 24} 
                    color={isFocused ? (isHome ? '#FFFFFF' : COLORS.primary) : (isHome ? '#FFFFFF' : COLORS.inactive)} 
                  />
                </View>
                
                {/* Badge for cart if needed */}
                {route.name === 'Cart' && route.params?.count > 0 && (
                  <Animated.View style={styles.tabBadge}>
                    <Text style={styles.tabBadgeText}>
                      {route.params.count > 9 ? '9+' : route.params.count}
                    </Text>
                  </Animated.View>
                )}
              </View>
            </TabBarButton>
          </View>
        );
      })}
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
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Products') iconName = focused ? 'compass' : 'compass-outline';
          else if (route.name === 'Cart') iconName = focused ? 'cart' : 'cart-outline';
          else if (route.name === 'Rewards') iconName = focused ? 'trophy' : 'trophy-outline';
          else if (route.name === 'Chat') iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return (
            <View style={styles.tabIconContainer}>
              <Ionicons name={iconName as any} size={size} color={color} />
            </View>
          );
        },
        tabBarLabel: ({ focused }) => {
          let label = route.name;
          if (route.name === 'Home') label = 'Home';
          else if (route.name === 'Products') label = 'Explore';
          else if (route.name === 'Cart') label = 'Cart';
          else if (route.name === 'Rewards') label = 'Rewards';
          else if (route.name === 'Chat') label = 'Chat';
          else if (route.name === 'Profile') label = 'Profile';
          return <Text style={{ fontSize: 12, color: focused ? COLORS.primary : COLORS.inactive }}>{label}</Text>;
        },
        headerShown: false,
        tabBarShowLabel: true,
      })}
    >
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
        name="Home" 
        component={HomeScreen}
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

export default function App() {
  const navigationRef = useNavigationContainerRef();
  
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
              <NavigationContainer ref={navigationRef} theme={MyTheme}>
                {/* @ts-ignore - Ignore ID requirement */}
                <Stack.Navigator 
                  screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
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
                </Stack.Navigator>
              </NavigationContainer>
              
              {/* Global feedback component */}
              <AnimatedFeedback
                type={feedbackState.type}
                message={feedbackState.message}
                visible={feedbackState.visible}
                onHide={hideFeedback}
              />
              
              {/* Global cart notification with navigation ref */}
              <CartNotificationConsumer navigateToCart={navigateToCart} />
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
  const { visible, itemName, hideCartNotification } = React.useContext(CartNotificationContext);
  
  // Memoize the onViewCart callback to prevent re-renders
  const handleViewCart = React.useCallback(() => {
    navigateToCart();
  }, [navigateToCart]);
  
  return (
    <CartNotification
      visible={visible}
      itemName={itemName}
      onHide={hideCartNotification}
      onViewCart={handleViewCart}
    />
  );
});

// Give the component a display name for debugging
CartNotificationConsumer.displayName = 'CartNotificationConsumer';

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 8,
    paddingBottom: 0,
    shadowColor: 'rgba(0,0,0,0.08)',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    height: 80,
    justifyContent: 'space-around',
    width: '100%',
  },
  tabItemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    width: 64,
  },
  homeTabButton: {
    position: 'relative',
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    width: 64,
  },
  tabIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  activeTabIconContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    transform: [{ scale: 1.05 }],
  },
  activeHomeIconContainer: {
    transform: [{ scale: 1.1 }],
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  tabBadge: {
    position: 'absolute',
    top: 6,
    right: '30%',
    backgroundColor: COLORS.error,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.card,
  },
  tabBadgeText: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: 'bold',
  },
}); 