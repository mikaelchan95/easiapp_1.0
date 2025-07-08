import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Keyboard,
  ActivityIndicator,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { products, Product } from '../../data/mockProducts';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import { HapticFeedback } from '../../utils/haptics';

interface SmartSearchDropdownProps {
  placeholder?: string;
  onProductSelect?: (product: Product) => void;
  autoFocus?: boolean;
  style?: any;
  showDropdownOnFocus?: boolean;
  maxSuggestions?: number;
  enableCaching?: boolean;
}

interface SearchSuggestion {
  product: Product;
  score: number;
  matchType: 'name' | 'sku' | 'category';
}

const { width: screenWidth } = Dimensions.get('window');

const SmartSearchDropdown: React.FC<SmartSearchDropdownProps> = ({
  placeholder = 'Search products...',
  onProductSelect,
  autoFocus = false,
  style,
  showDropdownOnFocus = true,
  maxSuggestions = 5,
  enableCaching = true,
}) => {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Smart search algorithm with scoring
  const searchProducts = useCallback((searchText: string): SearchSuggestion[] => {
    if (!searchText.trim()) return [];

    const terms = searchText.toLowerCase().trim().split(/\s+/);
    const scoredResults: SearchSuggestion[] = [];

    products.forEach(product => {
      let score = 0;
      let matchType: 'name' | 'sku' | 'category' = 'name';

      // Exact name match (highest priority)
      if (product.name.toLowerCase() === searchText.toLowerCase()) {
        score += 1000;
        matchType = 'name';
      }
      // Name starts with search term
      else if (product.name.toLowerCase().startsWith(searchText.toLowerCase())) {
        score += 500;
        matchType = 'name';
      }
      // Name contains search term
      else if (product.name.toLowerCase().includes(searchText.toLowerCase())) {
        score += 300;
        matchType = 'name';
      }

      // SKU exact match
      if (product.id.toLowerCase() === searchText.toLowerCase()) {
        score += 800;
        matchType = 'sku';
      }
      // SKU contains search term
      else if (product.id.toLowerCase().includes(searchText.toLowerCase())) {
        score += 200;
        matchType = 'sku';
      }

      // Category exact match
      if (product.category.toLowerCase() === searchText.toLowerCase()) {
        score += 400;
        matchType = 'category';
      }
      // Category contains search term
      else if (product.category.toLowerCase().includes(searchText.toLowerCase())) {
        score += 150;
        matchType = 'category';
      }

      // Multi-term matching
      let termMatches = 0;
      terms.forEach(term => {
        if (product.name.toLowerCase().includes(term)) termMatches++;
        if (product.category.toLowerCase().includes(term)) termMatches++;
        if (product.id.toLowerCase().includes(term)) termMatches++;
      });
      
      if (termMatches > 0) {
        score += termMatches * 50;
      }

      // Boost for in-stock items
      if (product.inStock) {
        score += 10;
      }

      // Boost for highly rated items
      if (product.rating && product.rating >= 4.5) {
        score += 5;
      }

      if (score > 0) {
        scoredResults.push({ product, score, matchType });
      }
    });

    // Sort by score and return top results
    return scoredResults
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);
  }, [maxSuggestions]);

  // Debounced search with loading state
  const handleSearch = useCallback((searchText: string) => {
    if (!mountedRef.current) return;

    setQuery(searchText);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Show loading for non-empty queries
    if (searchText.trim()) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
      setSuggestions([]);
      return;
    }

    // Debounce search for 100ms for instant feel
    searchTimeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return;

      try {
        const results = searchProducts(searchText);
        setSuggestions(results);
        setIsLoading(false);
        setIsOffline(false);
      } catch (error) {
        // Simulate offline/cached results
        console.log('Search error, showing cached results:', error);
        const results = searchProducts(searchText);
        setSuggestions(results);
        setIsLoading(false);
        setIsOffline(true);
      }
    }, 100);
  }, [searchProducts]);

  // Handle input focus
  const handleFocus = () => {
    HapticFeedback.selection();
    setIsFocused(true);
    
    if (showDropdownOnFocus) {
      setShowDropdown(true);
      animateDropdown(true);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    setIsFocused(false);
    // Delay hiding dropdown to allow for suggestion taps
    setTimeout(() => {
      if (mountedRef.current) {
        setShowDropdown(false);
        animateDropdown(false);
      }
    }, 200);
  };

  // Animate dropdown
  const animateDropdown = (show: boolean) => {
    Animated.timing(dropdownAnim, {
      toValue: show ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // Handle suggestion selection
  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    HapticFeedback.selection();
    
    setQuery(suggestion.product.name);
    setShowDropdown(false);
    animateDropdown(false);
    Keyboard.dismiss();

    if (onProductSelect) {
      onProductSelect(suggestion.product);
    } else {
      navigation.navigate('ProductDetail', { id: suggestion.product.id });
    }
  };

  // Clear search
  const handleClear = () => {
    HapticFeedback.light();
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // Handle search submit
  const handleSubmit = () => {
    if (suggestions.length > 0) {
      handleSuggestionPress(suggestions[0]);
    } else {
      Keyboard.dismiss();
      setShowDropdown(false);
      animateDropdown(false);
    }
  };

  // Render suggestion item
  const renderSuggestion = ({ item }: { item: SearchSuggestion }) => {
    const { product, matchType } = item;
    
    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSuggestionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.suggestionIconContainer}>
          <Ionicons 
            name={matchType === 'sku' ? 'barcode-outline' : 
                  matchType === 'category' ? 'folder-outline' : 
                  'search-outline'} 
            size={18} 
            color={COLORS.textSecondary} 
          />
        </View>
        
        <View style={styles.suggestionContent}>
          <Text style={styles.suggestionTitle} numberOfLines={1}>
            {product.name}
          </Text>
          <View style={styles.suggestionMeta}>
            <Text style={styles.suggestionCategory}>{product.category}</Text>
            {matchType === 'sku' && (
              <Text style={styles.suggestionSku}>SKU: {product.id}</Text>
            )}
          </View>
        </View>
        
        <Text style={styles.suggestionPrice}>
          ${product.price.toFixed(0)}
        </Text>
        
        <View style={styles.suggestionArrow}>
          <Ionicons name="chevron-forward" size={16} color={COLORS.inactive} />
        </View>
      </TouchableOpacity>
    );
  };

  // Empty state component
  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={32} color={COLORS.inactive} />
      <Text style={styles.emptyStateText}>No products found</Text>
      <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
        <Ionicons name="close-circle" size={16} color={COLORS.inactive} />
        <Text style={styles.clearButtonText}>Clear</Text>
      </TouchableOpacity>
    </View>
  );

  // Loading state component
  const LoadingState = () => (
    <View style={styles.loadingState}>
      <ActivityIndicator size="small" color={COLORS.primary} />
      <Text style={styles.loadingText}>Searching...</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, style]}
    >
      {/* Search Input */}
      <View style={[styles.searchInput, isFocused && styles.searchInputFocused]}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          value={query}
          onChangeText={handleSearch}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="never"
        />
        
        {query.length > 0 && (
          <TouchableOpacity style={styles.clearIconButton} onPress={handleClear}>
            <Ionicons name="close-circle" size={18} color={COLORS.inactive} />
          </TouchableOpacity>
        )}
      </View>

      {/* Dropdown */}
      {showDropdown && (
        <Animated.View 
          style={[
            styles.dropdown,
            {
              opacity: dropdownAnim,
              transform: [{
                translateY: dropdownAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0],
                })
              }]
            }
          ]}
        >
          {/* Offline indicator */}
          {isOffline && (
            <View style={styles.offlineIndicator}>
              <Ionicons name="cloud-offline-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.offlineText}>Showing cached results</Text>
            </View>
          )}

          {/* Content */}
          {isLoading ? (
            <LoadingState />
          ) : suggestions.length > 0 ? (
            <FlatList
              data={suggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item) => item.product.id}
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="always"
              showsVerticalScrollIndicator={false}
              maxToRenderPerBatch={5}
              windowSize={10}
            />
          ) : query.trim() ? (
            <EmptyState />
          ) : (
            <View style={styles.initialState}>
              <Ionicons name="search" size={32} color={COLORS.inactive} />
              <Text style={styles.initialStateText}>Start typing to search</Text>
            </View>
          )}
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  searchInputFocused: {
    borderColor: COLORS.primary,
    ...SHADOWS.medium,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    ...TYPOGRAPHY.body,
  },
  clearIconButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    maxHeight: 300,
    zIndex: 1001,
    ...SHADOWS.medium,
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  offlineText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  suggestionsList: {
    maxHeight: 250,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  suggestionContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionCategory: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  suggestionSku: {
    fontSize: 11,
    color: COLORS.inactive,
    marginLeft: SPACING.xs,
  },
  suggestionPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
  suggestionArrow: {
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: COLORS.inactive,
    marginLeft: SPACING.xs,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  initialState: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  initialStateText: {
    fontSize: 14,
    color: COLORS.inactive,
    marginTop: SPACING.sm,
  },
});

export default SmartSearchDropdown; 