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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { LocationSuggestion } from '../../types/location';
import { GoogleMapsService } from '../../services/googleMapsService';

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
  
  // State
  const [searchText, setSearchText] = useState(initialLocation?.title || '');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentLocations, setRecentLocations] = useState<LocationSuggestion[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationSuggestion | null>(null);
  
  // Animation values
  const searchBarFocused = useRef(new Animated.Value(0)).current;
  const suggestionListHeight = useRef(new Animated.Value(0)).current;
  
  // Refs
  const searchInputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      const [recent, current] = await Promise.all([
        GoogleMapsService.getRecentLocations(),
        GoogleMapsService.getCurrentLocation(),
      ]);
      
      setRecentLocations(recent.slice(0, 3)); // Show max 3 recent
      setCurrentLocation(current);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Handle search input changes
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    if (text.length > 2) {
      setIsLoading(true);
      
      // Debounce search
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await GoogleMapsService.getAutocompleteSuggestions(text);
          setSuggestions(results);
        } catch (error) {
          console.error('Search error:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  }, []);

  // Handle location selection
  const handleLocationSelect = useCallback(async (location: LocationSuggestion) => {
    setSearchText(location.title);
    setShowSuggestions(false);
    
    // Save to recent locations
    try {
      await GoogleMapsService.addToRecentLocations(location);
    } catch (error) {
      console.error('Error saving to recent:', error);
    }
    
    // Call parent callback
    onLocationSelect(location);
    
    // Navigate back if we can
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [onLocationSelect, navigation]);

  // Handle input focus
  const handleInputFocus = () => {
    setShowSuggestions(true);
    
    Animated.parallel([
      Animated.timing(searchBarFocused, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(suggestionListHeight, {
        toValue: height * 0.6,
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
      handleLocationSelect(currentLocation);
    }
  };

  // Render suggestion item
  const renderSuggestionItem = (item: LocationSuggestion, index: number) => (
    <TouchableOpacity
      key={`${item.id}-${index}`}
      style={styles.suggestionItem}
      onPress={() => handleLocationSelect(item)}
      activeOpacity={0.7}
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
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Address</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[
            styles.searchBar,
            showSuggestions && styles.searchBarFocused
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
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSearchText('');
                  setSuggestions([]);
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
          <ScrollView
            style={styles.suggestionsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Loading indicator */}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            )}

            {/* Search results */}
            {!isLoading && suggestions.length > 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.sectionTitle}>Search Results</Text>
                {suggestions.map((item, index) => renderSuggestionItem(item, index))}
              </View>
            )}

            {/* Recent locations */}
            {!isLoading && searchText.length <= 2 && recentLocations.length > 0 && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.sectionTitle}>Recent</Text>
                {recentLocations.map((item, index) => renderSuggestionItem(item, index))}
              </View>
            )}

            {/* Current location in suggestions */}
            {!isLoading && searchText.length <= 2 && currentLocation && (
              <View style={styles.suggestionsSection}>
                <Text style={styles.sectionTitle}>Current Location</Text>
                {renderSuggestionItem(currentLocation, 0)}
              </View>
            )}

            {/* No results */}
            {!isLoading && searchText.length > 2 && suggestions.length === 0 && (
              <View style={styles.noResultsContainer}>
                <Ionicons name="location-outline" size={48} color={COLORS.textSecondary} />
                <Text style={styles.noResultsTitle}>No locations found</Text>
                <Text style={styles.noResultsText}>
                  Try searching with a different address or postal code
                </Text>
              </View>
            )}
          </ScrollView>
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
    </SafeAreaView>
  );
};

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
});

export default DeliveryLocationPicker;