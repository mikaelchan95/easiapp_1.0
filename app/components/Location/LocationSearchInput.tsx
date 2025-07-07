import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { LocationSuggestion } from '../../types/location';
import { GoogleMapsService } from '../../services/googleMapsService';

interface LocationSearchInputProps {
  placeholder?: string;
  onSuggestionsChange: (suggestions: LocationSuggestion[]) => void;
  onSearchStateChange: (searching: boolean) => void;
  onFocus: () => void;
  onBlur: () => void;
  initialValue?: string;
}

const LocationSearchInput: React.FC<LocationSearchInputProps> = ({
  placeholder = "Search for address...",
  onSuggestionsChange,
  onSearchStateChange,
  onFocus,
  onBlur,
  initialValue = '',
}) => {
  const [searchText, setSearchText] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Refs for cleanup
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<TextInput>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, []);

  // Handle search with debouncing and proper cleanup
  const handleSearchChange = useCallback(async (text: string) => {
    setSearchText(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    if (text.length > 2) {
      setIsLoading(true);
      onSearchStateChange(true);
      
      // Debounce search with cleanup
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          // Check if component is still mounted
          if (!mountedRef.current) return;
          
          const results = await GoogleMapsService.getAutocompleteSuggestions(text);
          
          // Double-check if still mounted after async operation
          if (!mountedRef.current) return;
          
          onSuggestionsChange(results);
        } catch (error) {
          console.error('Search error:', error);
          if (mountedRef.current) {
            onSuggestionsChange([]);
          }
        } finally {
          if (mountedRef.current) {
            setIsLoading(false);
            onSearchStateChange(false);
          }
        }
      }, 300);
    } else {
      setIsLoading(false);
      onSearchStateChange(false);
      onSuggestionsChange([]);
    }
  }, [onSuggestionsChange, onSearchStateChange]);

  // Handle input focus
  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
    onFocus();
  }, [onFocus]);

  // Handle input blur
  const handleInputBlur = useCallback(() => {
    setIsFocused(false);
    onBlur();
  }, [onBlur]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchText('');
    onSuggestionsChange([]);
    setIsLoading(false);
    onSearchStateChange(false);
    
    // Clear any pending timeouts
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
  }, [onSuggestionsChange, onSearchStateChange]);

  // Focus input
  const focusInput = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  return (
    <View style={styles.container}>
      <View style={[
        styles.searchBar,
        isFocused && styles.searchBarFocused
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
          accessible={true}
          accessibilityLabel="Search for delivery address"
          accessibilityHint="Type to search for your delivery location"
        />

        {/* Loading indicator or clear button */}
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : searchText.length > 0 ? (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearSearch}
            accessible={true}
            accessibilityLabel="Clear search"
            accessibilityRole="button"
          >
            <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    minHeight: 20,
  },
  clearButton: {
    padding: SPACING.xs,
    borderRadius: 12,
  },
});

export default LocationSearchInput;