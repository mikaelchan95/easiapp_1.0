import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { LocationSuggestion, SavedAddress } from '../../types/location';
import { GoogleMapsService } from '../../services/googleMapsService';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';

interface EnhancedLocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationSuggestion) => void;
  initialLocation?: LocationSuggestion;
  title?: string;
  showSavedLocations?: boolean;
  showCurrentLocation?: boolean;
}

/**
 * Modern minimalistic location picker with improved UX
 * Following design principles: clarity, consistency, visual hierarchy
 */
const EnhancedLocationPicker: React.FC<EnhancedLocationPickerProps> = ({
  visible,
  onClose,
  onLocationSelect,
  initialLocation,
  title = 'Select Location',
  showSavedLocations = true,
  showCurrentLocation = true,
}) => {
  const { savedAddresses, loadSavedAddresses } = useDeliveryLocation();
  
  // State management
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [recentLocations, setRecentLocations] = useState<LocationSuggestion[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationSuggestion | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(initialLocation || null);
  const [searchFocused, setSearchFocused] = useState(false);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));

  // Load data on mount
  useEffect(() => {
    if (visible) {
      loadInitialData();
      // Animate in content
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      await Promise.all([
        loadSavedAddresses(),
        loadRecentLocations(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }, [loadSavedAddresses]);

  // Load recent locations
  const loadRecentLocations = useCallback(async () => {
    try {
      const recent = await GoogleMapsService.getRecentLocations();
      setRecentLocations(recent);
    } catch (error) {
      console.error('Error loading recent locations:', error);
    }
  }, []);

  // Search for locations
  const searchLocations = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const results = await GoogleMapsService.getAutocompleteSuggestions(query);
      setSuggestions(results);
    } catch (error) {
      console.error('Error searching locations:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, []);

  // Handle search text change with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchLocations(searchText);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText, searchLocations]);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    if (!showCurrentLocation) return;

    setIsLoadingCurrent(true);
    try {
      const location = await GoogleMapsService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        // Auto-select current location if found
        handleLocationSelect(location);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Location Access', 'Enable location access in settings to use this feature.');
    } finally {
      setIsLoadingCurrent(false);
    }
  }, [showCurrentLocation]);

  // Handle location selection
  const handleLocationSelect = useCallback(async (location: LocationSuggestion) => {
    try {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Add to recent locations
      await GoogleMapsService.addToRecentLocations(location);
      
      // Update selected location
      setSelectedLocation(location);
      
      // Call parent callback
      onLocationSelect(location);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error selecting location:', error);
    }
  }, [onLocationSelect, onClose]);

  // Handle saved address selection
  const handleSavedAddressSelect = useCallback((address: SavedAddress) => {
    handleLocationSelect(address.location);
  }, [handleLocationSelect]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchText('');
    setSuggestions([]);
  }, []);

  // Modern header with clean design
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={onClose} 
        style={styles.closeButton}
        accessibilityLabel="Close location picker"
      >
        <Ionicons name="close" size={24} color={COLORS.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  // Enhanced search bar with better UX
  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={[
        styles.searchBar,
        searchFocused && styles.searchBarFocused
      ]}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search locations..."
          placeholderTextColor={COLORS.placeholder}
          value={searchText}
          onChangeText={setSearchText}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          autoFocus={false}
          returnKeyType="search"
          accessibilityLabel="Search for locations"
        />
        {searchText.length > 0 && (
          <TouchableOpacity 
            onPress={clearSearch} 
            style={styles.clearButton}
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Current location widget
  const renderCurrentLocation = () => {
    if (!showCurrentLocation) return null;

    return (
      <View style={styles.widgetContainer}>
        <TouchableOpacity
          style={styles.currentLocationWidget}
          onPress={getCurrentLocation}
          disabled={isLoadingCurrent}
          accessibilityLabel="Get current location"
        >
          <View style={styles.currentLocationIconContainer}>
            {isLoadingCurrent ? (
              <ActivityIndicator size="small" color={COLORS.buttonText} />
            ) : (
              <Ionicons name="locate" size={24} color={COLORS.buttonText} />
            )}
          </View>
          <View style={styles.currentLocationContent}>
            <Text style={styles.currentLocationTitle}>Get current location</Text>
            <Text style={styles.currentLocationSubtitle}>Use your current position</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  // Location item component with improved design
  const renderLocationItem = (location: LocationSuggestion, iconName: string, iconColor: string = COLORS.text) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => handleLocationSelect(location)}
      accessibilityLabel={`Select ${location.title}`}
    >
      <View style={[styles.locationIcon, { backgroundColor: iconColor }]}>
        <Ionicons name={iconName as any} size={18} color={COLORS.buttonText} />
      </View>
      <View style={styles.locationInfo}>
        <Text style={styles.locationTitle} numberOfLines={1}>{location.title}</Text>
        <Text style={styles.locationSubtitle} numberOfLines={2}>{location.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );

  // Recent locations section
  const renderRecentLocations = () => {
    if (recentLocations.length === 0 || searchText.length > 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent</Text>
        <View style={styles.sectionContent}>
          {recentLocations.slice(0, 3).map((location) => (
            <View key={location.id}>
              {renderLocationItem(location, 'time-outline', COLORS.textSecondary)}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Search suggestions with improved layout
  const renderSuggestions = () => {
    if (searchText.length === 0) return null;

    if (isLoadingSuggestions) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.text} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      );
    }

    if (suggestions.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="search-outline" size={32} color={COLORS.textSecondary} />
          </View>
          <Text style={styles.emptyTitle}>No Results</Text>
          <Text style={styles.emptySubtitle}>Try a different search term</Text>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Search Results</Text>
        <View style={styles.sectionContent}>
          {suggestions.map((suggestion) => (
            <View key={suggestion.id}>
              {renderLocationItem(suggestion, 'location-outline')}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          {renderHeader()}

          {/* Search Bar */}
          {renderSearchBar()}

          {/* Content */}
          <Animated.View style={[styles.scrollContainer, { opacity: fadeAnim }]}>
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {searchText.length > 0 ? (
                renderSuggestions()
              ) : (
                <>
                  {renderCurrentLocation()}
                  {renderRecentLocations()}
                </>
              )}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  
  // Header with modern design
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },

  // Enhanced search bar
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchBarFocused: {
    borderColor: COLORS.text,
    ...SHADOWS.light,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    paddingVertical: SPACING.xs,
  },
  clearButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },

  // Content area
  scrollContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },

  // Widget containers
  widgetContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  currentLocationWidget: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currentLocationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.buttonBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  currentLocationContent: {
    flex: 1,
  },
  currentLocationTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  currentLocationSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Sections with improved spacing
  section: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  sectionContent: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.light,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Location items with modern card design
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  locationInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  locationTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  locationSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Loading and empty states
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    ...SHADOWS.light,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default EnhancedLocationPicker; 