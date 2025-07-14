import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  Keyboard,
  Modal,
  Dimensions,
  FlatList,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Product } from '../../utils/pricing';
import { COLORS, SPACING, SHADOWS } from '../../utils/theme';
import * as Animations from '../../utils/animations';

interface ExpandableSearchProps {
  placeholder?: string;
  onProductSelect?: (product: Product) => void;
}

const { width, height } = Dimensions.get('window');

const ExpandableSearch: React.FC<ExpandableSearchProps> = ({
  placeholder = 'Search wines, spirits & more...',
  onProductSelect,
}) => {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Animation values
  const expandAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  // Toggle search expansion
  const toggleExpand = () => {
    if (!expanded) {
      setExpanded(true);
      // Focus the input after animation starts
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      Keyboard.dismiss();
      setExpanded(false);
      setQuery('');
    }
  };

  // Animate search expansion
  useEffect(() => {
    Animated.parallel([
      Animated.timing(expandAnim, {
        toValue: expanded ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
        easing: Animations.TIMING.easeOut,
      }),
      Animated.timing(opacityAnim, {
        toValue: expanded ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
        easing: Animations.TIMING.easeOut,
      }),
    ]).start();
  }, [expanded]);

  // Search for products
  useEffect(() => {
    if (!query.trim() || !expanded) {
      setSuggestions([]);
      return;
    }

    // Simulate loading
    setLoading(true);

    // Debounce search
    const timer = setTimeout(() => {
      const searchResults = products
        .filter(
          p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase()) ||
            p.id.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 6);

      setSuggestions(searchResults);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, expanded]);

  // Handle product selection
  const handleSelectProduct = (product: Product) => {
    // Close search
    setExpanded(false);
    setQuery('');
    Keyboard.dismiss();

    // Navigate to product detail
    if (onProductSelect) {
      onProductSelect(product);
    } else {
      navigation.navigate('ProductDetail', { id: product.id });
    }
  };

  // Handle backdrop press
  const handleBackdropPress = () => {
    setExpanded(false);
    Keyboard.dismiss();
  };

  // Render product suggestion item
  const renderSuggestion = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelectProduct(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionIconContainer}>
        <Ionicons
          name={
            item.category.toLowerCase().includes('whisky')
              ? 'wine-outline'
              : 'search'
          }
          size={18}
          color={COLORS.inactive}
        />
      </View>
      <View style={styles.suggestionTextContainer}>
        <Text style={styles.suggestionTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.suggestionSubtitle} numberOfLines={1}>
          {item.category}
        </Text>
      </View>
      <Text style={styles.suggestionPrice}>${item.price.toFixed(0)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Collapsed Search Button */}
      {!expanded && (
        <Pressable
          style={styles.searchButton}
          onPress={toggleExpand}
          android_ripple={{ color: COLORS.border }}
        >
          <Ionicons
            name="search"
            size={20}
            color={COLORS.placeholder}
            style={styles.searchIcon}
          />
          <Text style={styles.searchText}>{placeholder}</Text>
        </Pressable>
      )}

      {/* Expanded Search Bar and Results */}
      {expanded && (
        <View style={styles.expandedContainer}>
          <View style={styles.searchBarRow}>
            <TouchableOpacity style={styles.backButton} onPress={toggleExpand}>
              <Ionicons name="arrow-back" size={22} color={COLORS.text} />
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Ionicons
                name="search"
                size={20}
                color={COLORS.inactive}
                style={styles.searchIconExpanded}
              />
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={COLORS.placeholder}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => setQuery('')}
                  style={styles.clearButton}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={COLORS.placeholder}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Search Results */}
          <View style={styles.resultsContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : suggestions.length > 0 ? (
              <FlatList
                data={suggestions}
                renderItem={renderSuggestion}
                keyExtractor={item => item.id}
                style={styles.suggestionsList}
                contentContainerStyle={styles.suggestionsContent}
                keyboardShouldPersistTaps="always"
              />
            ) : query.length > 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="search-outline"
                  size={40}
                  color={COLORS.inactive}
                />
                <Text style={styles.emptyText}>No products found</Text>
                <Text style={styles.emptySubtext}>
                  Try a different search term
                </Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={40} color={COLORS.inactive} />
                <Text style={styles.emptyText}>Search for products</Text>
                <Text style={styles.emptySubtext}>
                  Try searching for whisky, wine, or spirits
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Backdrop for closing expanded search */}
      {expanded && (
        <Pressable style={styles.backdrop} onPress={handleBackdropPress} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 1000,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    ...SHADOWS.light,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchText: {
    color: COLORS.placeholder,
    fontSize: 15,
  },
  expandedContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    zIndex: 1002,
    elevation: 5,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    ...SHADOWS.medium,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginLeft: SPACING.xs,
  },
  searchIconExpanded: {
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
  resultsContainer: {
    maxHeight: 350,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.inactive,
    fontSize: 14,
  },
  suggestionsList: {
    maxHeight: 350,
  },
  suggestionsContent: {
    paddingBottom: SPACING.md,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
    color: COLORS.inactive,
  },
  suggestionPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: SPACING.md,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  emptySubtext: {
    marginTop: SPACING.xs,
    fontSize: 14,
    color: COLORS.inactive,
    textAlign: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 400, // Start below the search results
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1001,
  },
});

export default ExpandableSearch;
