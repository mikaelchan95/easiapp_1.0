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

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      const recent = await GoogleMapsService.getRecentLocations();
      
      if (mountedRef.current) {
        setRecentLocations(recent.slice(0, 3)); // Show max 3 recent
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
  }, []);

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
        'Error',
        'Unable to select this location. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  // Handle quick save of current location
  const handleQuickSave = async (location: LocationSuggestion) => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      // Quick save with default label
      const success = await saveCurrentLocation(
        `Saved Location ${new Date().toLocaleDateString()}`,
        'location',
        COLORS.primary
      );
      
      if (success) {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        // Show success feedback
        setShowSavePrompt(true);
        setTimeout(() => setShowSavePrompt(false), 2000);
      }
    } catch (error) {
      console.error('Error quick saving location:', error);
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  // Handle input focus with improved keyboard handling
  const handleInputFocus = () => {
    setShowSuggestions(true);
    
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

  // Handle use current location
  const handleUseCurrentLocation = () => {
    if (currentLocation) {
      HapticFeedback.selection();
      handleLocationSelect(currentLocation);
    } else {
      HapticFeedback.error();
      Alert.alert(
        'Location Unavailable',
        'Unable to get your current location. Please search for an address instead.',
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

  // Render suggestion item with accessibility
  const renderSuggestionItem = (item: LocationSuggestion, index: number) => (
    <TouchableOpacity
      key={`${item.id}-${index}`}
      style={styles.suggestionItem}
      onPress={() => {
        HapticFeedback.selection();
        handleLocationSelect(item);
      }}
      activeOpacity={0.7}
      accessible={true}
      accessibilityLabel={`Select ${item.title}${item.subtitle ? `, ${item.subtitle}` : ''}`}
      accessibilityRole="button"
      accessibilityHint="Tap to select this location for delivery"
    >
      <View style={styles.suggestionIcon}>
        <Ionicons 
          name={item.type === 'current' ? 'location' : 'location-outline'} 
          size={20} 
          color={COLORS.text} 
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
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} translucent />
      
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
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBackPress}
          accessible={true}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Address</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <KeyboardAvoidingView 
        style={[styles.content, { marginBottom: getKeyboardOffset() }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={getKeyboardVerticalOffset()}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[
            styles.searchBar,
            showSuggestions && styles.searchBarFocused,
            isKeyboardVisible && styles.searchBarKeyboard
          ]}>
            <Ionicons name="search" size={20} color={COLORS.textSecondary} />
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
              >
                <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Current Location Button */}
        {!showSuggestions && currentLocation && (
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={handleUseCurrentLocation}
            activeOpacity={0.7}
          >
            <View style={styles.currentLocationIcon}>
              <Ionicons name="locate" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.currentLocationContent}>
              <Text style={styles.currentLocationTitle}>Use current location</Text>
              <Text style={styles.currentLocationSubtitle}>{currentLocation.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Saved Locations Section */}
        {savedAddresses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Saved Locations</Text>
                              <TouchableOpacity 
                  style={styles.manageButton}
                  onPress={() => {
                    // Navigate to saved locations management
                    navigation.navigate('SavedLocations');
                  }}
                >
                <Text style={styles.manageButtonText}>Manage</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={savedAddresses}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.savedLocationItem}
                  onPress={() => handleLocationSelect(item.location)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.savedLocationIcon, { backgroundColor: item.color || COLORS.primary }]}>
                    <Ionicons 
                      name={item.icon as any || 'location'} 
                      size={16} 
                      color={COLORS.card} 
                    />
                  </View>
                  <View style={styles.savedLocationInfo}>
                    <Text style={styles.savedLocationLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                    <Text style={styles.savedLocationAddress} numberOfLines={1}>
                      {item.location.title}
                    </Text>
                    {item.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.quickSaveButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleQuickSave(item.location);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="bookmark-outline" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
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
                return <Text style={styles.sectionTitle}>{(item as any).title}</Text>;
              }
              
              if (item.type === 'no-results') {
                return (
                  <View style={styles.noResultsContainer}>
                    <Ionicons name="location-outline" size={48} color={COLORS.textSecondary} />
                    <Text style={styles.noResultsTitle}>No locations found</Text>
                    <Text style={styles.noResultsText}>
                      Try searching with a different address or postal code
                    </Text>
                  </View>
                );
              }
              
              return renderSuggestionItem(item as LocationSuggestion, 0);
            }}
            style={styles.suggestionsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.suggestionsScrollContent,
              isKeyboardVisible && styles.suggestionsScrollContentKeyboard
            ]}
          />
        </Animated.View>

        {/* Instructions (when not showing suggestions) */}
        {!showSuggestions && (
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionItem}>
              <Ionicons name="search" size={20} color={COLORS.textSecondary} />
              <Text style={styles.instructionText}>Search by address, building name, or postal code</Text>
            </View>
            <View style={styles.instructionItem}>
              <Ionicons name="location" size={20} color={COLORS.textSecondary} />
              <Text style={styles.instructionText}>We deliver to most areas in Singapore</Text>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Save Prompt Overlay */}
      {showSavePrompt && (
        <View style={styles.savePromptOverlay}>
          <View style={styles.savePromptContent}>
            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
            <Text style={styles.savePromptText}>Location saved!</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchBarFocused: {
    borderColor: COLORS.primary,
  },
  searchBarKeyboard: {
    borderColor: COLORS.primary,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  currentLocationContent: {
    flex: 1,
  },
  currentLocationTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  currentLocationSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  suggestionsContainer: {
    backgroundColor: COLORS.card,
    overflow: 'hidden',
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionsSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  suggestionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  noResultsContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  noResultsTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  noResultsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  instructionsContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xl,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  instructionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  suggestionsScrollContent: {
    paddingBottom: SPACING.xl,
  },
  suggestionsScrollContentKeyboard: {
    paddingBottom: SPACING.xl + SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  manageButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  manageButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  quickSaveButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  savePromptOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  savePromptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  savePromptText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    padding: SPACING.md,
  },
  savedLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  savedLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  savedLocationInfo: {
    flex: 1,
  },
  savedLocationLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '500',
    color: COLORS.text,
  },
  savedLocationAddress: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    marginTop: SPACING.xs,
  },
  defaultBadgeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '500',
    color: COLORS.card,
  },
});

export default DeliveryLocationPicker;