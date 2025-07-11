import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  Animated, 
  FlatList,
  Keyboard,
  LayoutAnimation,
  Platform,
  UIManager 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import { Product } from '../../utils/pricing';
import { useAppContext } from '../../context/AppContext';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ProductSearchBarProps {
  onSearch: (query: string) => void;
  onSelectProduct?: (product: Product) => void;
  placeholder?: string;
  initialQuery?: string;
  loading?: boolean;
  expanded?: boolean;
}

const ProductSearchBar: React.FC<ProductSearchBarProps> = ({
  onSearch,
  onSelectProduct,
  placeholder = 'Search products, SKUs, brands...',
  initialQuery = '',
  loading = false,
  expanded = false,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(expanded);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const navigation = useNavigation();
  const { state } = useAppContext();
  const animatedWidth = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const underlineWidth = useRef(new Animated.Value(0)).current;

  // Animate search bar width when focused/blurred
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.timing(animatedWidth, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    Animated.timing(underlineWidth, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  // Find fuzzy match suggestions
  const findSuggestions = (searchText: string) => {
    if (!searchText.trim()) {
      setSuggestions([]);
      return;
    }

    const terms = searchText.toLowerCase().trim().split(/\s+/);
    
    // Create a scoring system for matches
    const products = state.products || [];
    const scoredResults = products.map(product => {
      let score = 0;
      
      // Check for exact matches in name (highest priority)
      if (product.name.toLowerCase().includes(searchText.toLowerCase())) {
        score += 100;
      }
      
      // Check for SKU match (high priority)
      if (product.id.toLowerCase().includes(searchText.toLowerCase())) {
        score += 80;
      }
      
      // Check for category match
      if (product.category.toLowerCase().includes(searchText.toLowerCase())) {
        score += 60;
      }
      
      // Check for individual terms
      terms.forEach(term => {
        // Allow fuzzy matching - even partial matches count
        if (product.name.toLowerCase().includes(term)) {
          score += 40;
        }
        
        if (product.category.toLowerCase().includes(term)) {
          score += 20;
        }
        
        // Check for number matches (years, etc.)
        if (/^\d+$/.test(term)) {
          // If search is numeric and product name contains that number
          if (product.name.includes(term)) {
            score += 50;
          }
        }
      });
      
      return { product, score };
    });
    
    // Filter out zero scores and sort by score
    const results = scoredResults
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.product)
      .slice(0, 5); // Limit to 5 suggestions
    
    setSuggestions(results);
  };

  // Debounced search (200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      findSuggestions(query);
      if (query.trim() !== '') {
        onSearch(query);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, state.products]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    // Only unfocus if there are no suggestions
    if (suggestions.length === 0) {
      setIsFocused(false);
    }
    // We keep suggestions visible if there are any
  };

  const handleSelectSuggestion = (product: Product) => {
    setQuery(product.name);
    setShowSuggestions(false);
    Keyboard.dismiss();
    
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      // Navigate to product detail
      navigation.navigate('ProductDetail', { id: product.id });
    }
  };

  const handleSearch = () => {
    setShowSuggestions(false);
    Keyboard.dismiss();
    onSearch(query);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.searchBar,
        {
          width: animatedWidth.interpolate({
            inputRange: [0, 1],
            outputRange: ['92%', '100%'],
          })
        }
      ]}>
        <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          value={query}
          onChangeText={setQuery}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={styles.iconRight} />
        ) : query.length > 0 ? (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={COLORS.placeholder} />
          </TouchableOpacity>
        ) : null}
      </Animated.View>
      
      {/* Animated underline */}
      <Animated.View 
        style={[
          styles.underline,
          {
            width: underlineWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
            backgroundColor: COLORS.primary
          }
        ]} 
      />
      
      {/* Suggestions List */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="always"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(item)}
                activeOpacity={0.7}
              >
                <View style={styles.suggestionIconContainer}>
                  <Ionicons 
                    name={item.category.toLowerCase().includes('whisky') ? 'wine-outline' : 'search'} 
                    size={18} 
                    color={COLORS.textSecondary} 
                  />
                </View>
                <View style={styles.suggestionTextContainer}>
                  <Text style={styles.suggestionTitle} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.suggestionSubtitle} numberOfLines={1}>{item.category}</Text>
                </View>
                <Text style={styles.suggestionPrice}>${item.price.toFixed(0)}</Text>
              </TouchableOpacity>
            )}
            style={styles.suggestionsList}
            contentContainerStyle={styles.suggestionsContent}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    zIndex: 1000,
    ...SHADOWS.light,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    height: '100%',
  },
  clearButton: {
    padding: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  underline: {
    height: 2,
    marginTop: 4,
    alignSelf: 'center',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 84,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    zIndex: 1001,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    ...SHADOWS.medium,
    maxHeight: 300,
  },
  suggestionsList: {
    maxHeight: 300,
  },
  suggestionsContent: {
    paddingVertical: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  suggestionTextContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  suggestionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  suggestionPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default ProductSearchBar; 