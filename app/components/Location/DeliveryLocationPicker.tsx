import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
  Keyboard,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { LocationSuggestion } from '../../types/location';
import { GoogleMapsService } from '../../services/googleMapsService';
import { HapticFeedback } from '../../utils/haptics';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';

const { width, height } = Dimensions.get('window');

interface DeliveryLocationPickerProps {
  onLocationSelect: (location: LocationSuggestion) => void;
  initialLocation?: LocationSuggestion | null;
  placeholder?: string;
}

/**
 * Modern delivery location picker with improved UI/UX
 * Following design principles: clarity, consistency, visual hierarchy
 */
const DeliveryLocationPicker: React.FC<DeliveryLocationPickerProps> = ({
  onLocationSelect,
  initialLocation,
  placeholder = "Enter delivery address"
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Use delivery location hook
  const { 
    savedAddresses, 
    loadSavedAddresses,
    saveCurrentLocation,
    locationPreferences 
  } = useDeliveryLocation();
  
  // State
  const [searchText, setSearchText] = useState(initialLocation?.title || '');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentLocations, setRecentLocations] = useState<LocationSuggestion[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationSuggestion | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  
  // Animation values
  const searchBarFocused = useRef(new Animated.Value(0)).current;
  const suggestionListHeight = useRef(new Animated.Value(0)).current;
  const [fadeAnim] = useState(new Animated.Value(0));
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const searchBarScale = useRef(new Animated.Value(1)).current;
  const currentLocationScale = useRef(new Animated.Value(1)).current;
  const quickSelectAnimations = useRef<Animated.Value[]>([]).current;
  
  // Refs
  const searchInputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const successAnimation = useRef(new Animated.Value(0)).current;

  // Enhanced keyboard handling with proper iOS support
  useEffect(() => {
    const keyboardWillShow = (event: any) => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates.height);
    };

    const keyboardWillHide = () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    };

    const keyboardDidShow = (event: any) => {
      if (Platform.OS === 'android') {
        setIsKeyboardVisible(true);
        setKeyboardHeight(event.endCoordinates.height);
      }
    };

    const keyboardDidHide = () => {
      if (Platform.OS === 'android') {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    };

    let showSubscription, hideSubscription;

    if (Platform.OS === 'ios') {
      showSubscription = Keyboard.addListener('keyboardWillShow', keyboardWillShow);
      hideSubscription = Keyboard.addListener('keyboardWillHide', keyboardWillHide);
    } else {
      showSubscription = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
      hideSubscription = Keyboard.addListener('keyboardDidHide', keyboardDidHide);
    }

    return () => {
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, []);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, []);

  // Load initial data with animation
  const loadInitialData = useCallback(async () => {
    try {
      const recent = await GoogleMapsService.getRecentLocations();
      
      if (mountedRef.current) {
        setRecentLocations(recent.slice(0, 3)); // Show max 3 recent
        
        // Animate in content with staggered effects
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(headerAnimation, {
            toValue: 1,
            duration: 600,
            delay: 100,
            useNativeDriver: true,
          })
        ]).start();
      }
      
      // Only load current location if preferences allow it
      const storedPreferences = await AsyncStorage.getItem('@easiapp:location_preferences');
      let shouldLoadCurrent = false;
      
      if (storedPreferences) {
        const preferences = JSON.parse(storedPreferences);
        shouldLoadCurrent = preferences.autoSuggestCurrent !== false; // Default to true if not set
      } else {
        shouldLoadCurrent = false; // Default to false for new users
      }
      
      if (shouldLoadCurrent) {
        const current = await GoogleMapsService.getCurrentLocation();
        if (mountedRef.current) {
          setCurrentLocation(current);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      if (mountedRef.current) {
        // Show error feedback but don't break the flow
        HapticFeedback.error();
      }
    }
  }, [fadeAnim]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle search input changes with proper cleanup
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    if (text.length > 2) {
      setIsLoading(true);
      
      // Debounce search with memory leak protection
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          // Check if component is still mounted
          if (!mountedRef.current) return;
          
          const results = await GoogleMapsService.getAutocompleteSuggestions(text);
          
          // Double-check mounting status after async operation
          if (!mountedRef.current) return;
          
          setSuggestions(results);
        } catch (error) {
          console.error('Search error:', error);
          if (mountedRef.current) {
            setSuggestions([]);
            HapticFeedback.error();
          }
        } finally {
          if (mountedRef.current) {
            setIsLoading(false);
          }
        }
      }, 300);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  }, []);

  // Handle location selection
  const handleLocationSelect = async (location: LocationSuggestion) => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      setCurrentLocation(location);
      
      // Add to recent locations
      await GoogleMapsService.addToRecentLocations(location);
      
      // Show success animation
      Animated.sequence([
        Animated.timing(successAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(successAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setSearchText(location.title);
      setShowSuggestions(false);
      
      // Dismiss keyboard
      Keyboard.dismiss();
      
      // Call parent callback
      if (onLocationSelect) {
        onLocationSelect(location);
      }
    } catch (error) {
      console.error('Error selecting location:', error);
      HapticFeedback.error();
      Alert.alert(
        'Selection Failed',
        'Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  // Handle input focus with improved keyboard handling and micro animations
  const handleInputFocus = () => {
    setShowSuggestions(true);
    HapticFeedback.light();
    
    Animated.parallel([
      Animated.timing(searchBarFocused, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(suggestionListHeight, {
        toValue: isKeyboardVisible ? height * 0.4 : height * 0.6,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.spring(searchBarScale, {
        toValue: 1.02,
        useNativeDriver: true,
        tension: 150,
        friction: 8,
      }),
    ]).start();
  };

  // Handle input blur
  const handleInputBlur = () => {
    if (!showSuggestions) return;
    
    setTimeout(() => {
      setShowSuggestions(false);
      
      Animated.parallel([
        Animated.timing(searchBarFocused, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(suggestionListHeight, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.spring(searchBarScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 150,
          friction: 8,
        }),
      ]).start();
    }, 100);
  };

  // Handle back button
  const handleBackPress = () => {
    HapticFeedback.selection();
    if (showSuggestions) {
      handleInputBlur();
      searchInputRef.current?.blur();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // Handle use current location with micro animation
  const handleUseCurrentLocation = () => {
    HapticFeedback.selection();
    
    // Animate button press
    Animated.sequence([
      Animated.timing(currentLocationScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(currentLocationScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (currentLocation) {
      handleLocationSelect(currentLocation);
    } else {
      HapticFeedback.error();
      Alert.alert(
        'Location Access',
        'Enable location access in settings to use this feature.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  // Calculate keyboard offset for iOS modals
  const getKeyboardOffset = () => {
    if (!isKeyboardVisible || keyboardHeight === 0) return 0;
    
    if (Platform.OS === 'ios') {
      // For iOS modals, calculate proper offset by subtracting modal's top offset from bottom inset
      const modalTopOffset = insets.top;
      const baseOffset = keyboardHeight - insets.bottom;
      return Math.max(baseOffset - modalTopOffset, 0);
    } else {
      // For Android, use simpler calculation
      return keyboardHeight;
    }
  };

  // Calculate the keyboardVerticalOffset for KeyboardAvoidingView
  const getKeyboardVerticalOffset = () => {
    if (Platform.OS === 'ios') {
      // Account for the header height and safe area
      return insets.top + 60; // Header height approximation
    }
    return 0;
  };

  // Get icon for saved location with consistent styling
  const getSavedLocationIcon = (iconName: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      'home': 'home',
      'business': 'business',
      'school': 'school',
      'fitness-center': 'fitness',
      'local-hospital': 'medical',
      'shopping-cart': 'storefront',
      'restaurant': 'restaurant',
      'location-on': 'location',
    };
    return iconMap[iconName] || 'location';
  };

  // Render suggestion item with accessibility and micro animations
  const renderSuggestionItem = (item: LocationSuggestion, index: number) => {
    const itemScale = useRef(new Animated.Value(1)).current;
    
    const handlePressIn = () => {
      Animated.spring(itemScale, {
        toValue: 0.98,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    };
    
    const handlePressOut = () => {
      Animated.spring(itemScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }).start();
    };
    
    return (
      <Animated.View style={{ transform: [{ scale: itemScale }] }}>
        <TouchableOpacity
          key={`${item.id}-${index}`}
          style={styles.suggestionItem}
          onPress={() => {
            HapticFeedback.selection();
            handleLocationSelect(item);
          }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.95}
          accessible={true}
          accessibilityLabel={`Select ${item.title}${item.subtitle ? `, ${item.subtitle}` : ''}`}
          accessibilityRole="button"
          accessibilityHint="Tap to select this location for delivery"
        >
          <View style={styles.suggestionIcon}>
            <Ionicons 
              name={item.type === 'current' ? 'location' : 'location-outline'} 
              size={20} 
              color={COLORS.buttonText} 
            />
          </View>
          <View style={styles.suggestionContent}>
            <Text style={styles.suggestionTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={styles.suggestionSubtitle} numberOfLines={1}>
                {item.subtitle}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} translucent />
        
        {/* Success Animation Overlay */}
        <Animated.View
          style={[
            styles.successOverlay,
            {
              opacity: successAnimation,
              transform: [
                {
                  scale: successAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.1],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.successIndicator}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
            <Text style={styles.successText}>Location Selected!</Text>
          </View>
        </Animated.View>
        
        {/* Header */}
        <Animated.View 
          style={[
            styles.header,
            {
              opacity: headerAnimation,
              transform: [{
                translateY: headerAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                })
              }]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackPress}
            accessible={true}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Delivery Address</Text>
            <Text style={styles.headerSubtitle}>Where should we deliver your order?</Text>
          </View>
          <View style={styles.headerSpacer} />
        </Animated.View>
        
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <KeyboardAvoidingView 
            style={[styles.keyboardView, { marginBottom: getKeyboardOffset() }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={getKeyboardVerticalOffset()}
          >
            {/* Current Location Widget */}
            {!showSuggestions && (
              <View style={styles.currentLocationWidget}>
                <Animated.View style={{ transform: [{ scale: currentLocationScale }] }}>
                  <TouchableOpacity
                    style={styles.currentLocationButton}
                    onPress={handleUseCurrentLocation}
                    activeOpacity={0.8}
                    accessibilityLabel="Use current location"
                  >
                    <View style={styles.currentLocationIconContainer}>
                      <Ionicons name="locate" size={24} color={COLORS.buttonText} />
                    </View>
                    <View style={styles.currentLocationContent}>
                      <Text style={styles.currentLocationTitle}>Use my current location</Text>
                      <Text style={styles.currentLocationSubtitle}>Automatically detect your location</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.buttonText + 'CC'} />
                  </TouchableOpacity>
                </Animated.View>
              </View>
            )}

            {/* OR Divider */}
            {!showSuggestions && (
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>
            )}

            {/* Search Section */}
            <View style={styles.searchSection}>
              <Text style={styles.searchSectionTitle}>Search for an address</Text>
              <View style={styles.searchContainer}>
                <Animated.View style={[
                  styles.searchBar,
                  showSuggestions && styles.searchBarFocused,
                  isKeyboardVisible && styles.searchBarKeyboard,
                  { transform: [{ scale: searchBarScale }] }
                ]}>
                  <View style={styles.searchIconContainer}>
                    <Ionicons name="search" size={20} color={COLORS.textSecondary} />
                  </View>
                  <TextInput
                    ref={searchInputRef}
                    style={styles.searchInput}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textSecondary}
                    value={searchText}
                    onChangeText={handleSearchChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                  {searchText.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => {
                        setSearchText('');
                        setSuggestions([]);
                        HapticFeedback.selection();
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </View>
            </View>

            {/* Saved Locations Section */}
            {!showSuggestions && savedAddresses.length > 0 && (
              <View style={styles.savedLocationsSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Saved Locations</Text>
                  <TouchableOpacity 
                    style={styles.manageButton}
                    onPress={() => {
                      // Navigate to saved locations management
                      navigation.navigate('SavedLocations' as never);
                    }}
                  >
                    <Text style={styles.manageButtonText}>Manage</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Quick Select Cards */}
                <View style={styles.quickSelectContainer}>
                  {savedAddresses.slice(0, 2).map((item) => {
                    const iconName = getSavedLocationIcon(item.icon || 'home');
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.quickSelectCard}
                        onPress={() => handleLocationSelect(item.location)}
                        activeOpacity={0.7}
                        accessibilityLabel={`Select ${item.label}`}
                      >
                        <View style={styles.quickSelectIcon}>
                          <Ionicons 
                            name={iconName} 
                            size={24} 
                            color={COLORS.buttonText} 
                          />
                        </View>
                        <Text style={styles.quickSelectLabel} numberOfLines={1}>
                          {item.label}
                        </Text>
                        <Text style={styles.quickSelectAddress} numberOfLines={2}>
                          {item.location.title}
                        </Text>
                        {item.isDefault && (
                          <View style={styles.quickSelectBadge}>
                            <Text style={styles.quickSelectBadgeText}>Default</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Show More Button if there are more than 2 locations */}
                {savedAddresses.length > 2 && (
                  <TouchableOpacity 
                    style={styles.showMoreButton}
                    onPress={() => {
                      navigation.navigate('SavedLocations' as never);
                    }}
                    accessibilityLabel="View all saved locations"
                  >
                    <View style={styles.showMoreContent}>
                      <Ionicons name="location" size={20} color={COLORS.text} />
                      <Text style={styles.showMoreText}>
                        View all {savedAddresses.length} saved locations
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Suggestions List */}
            <Animated.View
              style={[
                styles.suggestionsContainer,
                {
                  height: suggestionListHeight,
                  opacity: showSuggestions ? 1 : 0,
                }
              ]}
              pointerEvents={showSuggestions ? 'auto' : 'none'}
            >
              <FlatList
                data={[
                  ...(isLoading ? [{ id: 'loading', type: 'loading' }] : []),
                  ...(suggestions.length > 0 ? [
                    { id: 'search-header', type: 'header', title: 'Search Results' },
                    ...suggestions.map(sug => ({ ...sug, type: 'suggestion' as const }))
                  ] : []),
                  ...(searchText.length <= 2 && recentLocations.length > 0 ? [
                    { id: 'recent-header', type: 'header', title: 'Recent' },
                    ...recentLocations.map(loc => ({ ...loc, type: 'recent' as const }))
                  ] : []),
                  ...(searchText.length <= 2 && currentLocation ? [
                    { id: 'current-header', type: 'header', title: 'Current Location' },
                    { ...currentLocation, type: 'current' as const }
                  ] : []),
                  ...(searchText.length > 2 && suggestions.length === 0 && !isLoading ? [
                    { id: 'no-results', type: 'no-results' }
                  ] : [])
                ]}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  if (item.type === 'loading') {
                    return (
                      <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Searching...</Text>
                      </View>
                    );
                  }
                  
                  if (item.type === 'header') {
                    return <Text style={styles.suggestionsHeader}>{(item as any).title}</Text>;
                  }
                  
                  if (item.type === 'no-results') {
                    return (
                      <View style={styles.noResultsContainer}>
                        <View style={styles.noResultsIcon}>
                          <Ionicons name="search-outline" size={32} color={COLORS.textSecondary} />
                        </View>
                        <Text style={styles.noResultsTitle}>No Results</Text>
                        <Text style={styles.noResultsText}>
                          Try a different search term
                        </Text>
                      </View>
                    );
                  }
                  
                  return renderSuggestionItem(item as LocationSuggestion, 0);
                }}
                style={styles.suggestionsList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.suggestionsScrollContent}
              />
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>

        {/* Save Prompt Overlay */}
        {showSavePrompt && (
          <View style={styles.savePromptOverlay}>
            <View style={styles.savePromptContent}>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.text} />
              <Text style={styles.savePromptText}>Location saved!</Text>
            </View>
          </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Main background
  },
  statusBarBackground: {
    backgroundColor: COLORS.card, // Extends header color into notch
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  successIndicator: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  successText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  
  // Header with improved design
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.light,
    elevation: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  headerSpacer: {
    width: 40,
  },
  
  // Content area
  content: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },

  // Current location widget
  currentLocationWidget: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  currentLocationButton: {
    backgroundColor: COLORS.text,
    borderRadius: 20,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.medium,
    elevation: 6,
  },
  currentLocationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  currentLocationContent: {
    flex: 1,
  },
  currentLocationTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.card,
    fontWeight: '700',
    marginBottom: 4,
  },
  currentLocationSubtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.card + 'CC',
    lineHeight: 18,
    fontWeight: '500',
  },

  // OR Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
    paddingHorizontal: SPACING.md,
  },

  // Search section
  searchSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  searchSectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  searchContainer: {
    marginBottom: SPACING.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.light,
    elevation: 4,
  },
  searchBarFocused: {
    borderColor: COLORS.text,
    ...SHADOWS.medium,
    elevation: 6,
  },
  searchBarKeyboard: {
    borderColor: COLORS.text,
  },
  searchIconContainer: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    paddingVertical: SPACING.xs,
    fontWeight: '500',
  },
  clearButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },

  // Saved locations section with improved UI
  savedLocationsSection: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
  },
  manageButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  manageButtonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 14,
  },

  // Quick select cards for better UX
  quickSelectContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  quickSelectCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    alignItems: 'center',
    minHeight: 120,
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickSelectIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.buttonBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  quickSelectLabel: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  quickSelectAddress: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    flex: 1,
  },
  quickSelectBadge: {
    backgroundColor: COLORS.buttonBg,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.xs,
  },
  quickSelectBadgeText: {
    ...TYPOGRAPHY.tiny,
    fontWeight: '600',
    color: COLORS.buttonText,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Show more button
  showMoreButton: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  showMoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  showMoreText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    flex: 1,
    marginLeft: SPACING.sm,
  },

  // Suggestions
  suggestionsContainer: {
    backgroundColor: COLORS.card,
    overflow: 'hidden',
    flex: 1,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionsScrollContent: {
    paddingBottom: SPACING.xl,
  },
  suggestionsHeader: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.buttonBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  suggestionContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  suggestionTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  suggestionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  
  // Loading and empty states
  loadingContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  noResultsContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  noResultsIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  noResultsTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  noResultsText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Save prompt
  savePromptOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    ...SHADOWS.medium,
    zIndex: 1000,
  },
  savePromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  savePromptText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
  },
});

export default DeliveryLocationPicker;