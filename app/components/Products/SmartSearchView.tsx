import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { products, Product } from '../../data/mockProducts';
import ProductCard from './ProductCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import ExpandableSearch from './ExpandableSearch';

type SearchNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SmartSearchViewProps {
  initialQuery?: string;
  initialCategory?: string;
  onClose?: () => void;
}

const SmartSearchView: React.FC<SmartSearchViewProps> = ({
  initialQuery = '',
  initialCategory = '',
  onClose
}) => {
  const navigation = useNavigation<SearchNavigationProp>();
  const insets = useSafeAreaInsets();
  
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [activeFilters, setActiveFilters] = useState<string[]>(
    initialCategory ? [initialCategory] : []
  );

  // Available filter categories
  const filterCategories = [
    'Scotch', 
    'Japanese Whisky', 
    'Cognac', 
    'Limited Edition', 
    'Champagne'
  ];
  
  // Search products based on query and filters
  const searchProducts = useCallback((searchText: string) => {
    setQuery(searchText);
    
    if (!searchText.trim() && activeFilters.length === 0) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    // Immediate results with fade-in animation instead of spinner
    setTimeout(() => {
      let results = [...products];
      
      // Filter by search query
      if (searchText.trim() !== '') {
        const searchTerms = searchText.toLowerCase().trim().split(' ');
        results = results.filter(product => {
          const productText = `${product.name} ${product.description} ${product.category}`.toLowerCase();
          return searchTerms.some(term => productText.includes(term));
        });
      }
      
      // Apply category filters
      if (activeFilters.length > 0) {
        results = results.filter(product => 
          activeFilters.some(filter => 
            product.category.toLowerCase().includes(filter.toLowerCase())
          )
        );
      }
      
      setSearchResults(results);
      setIsSearching(false);
    }, 50); // Nearly instant for a seamless feel
  }, [activeFilters]);
  
  // Run search on mount if there's an initial query or filters
  useEffect(() => {
    if (initialQuery || initialCategory) {
      searchProducts(initialQuery);
    }
  }, [initialQuery, initialCategory]);
  
  // Toggle filter category
  const toggleFilter = (category: string) => {
    setActiveFilters(prev => {
      const newFilters = prev.includes(category)
        ? prev.filter(cat => cat !== category)
        : [...prev, category];
      
      // Re-run search with updated filters
      searchProducts(query);
      return newFilters;
    });
  };
  
  // Handle product selection
  const handleProductSelect = (product: Product) => {
    navigation.navigate('ProductDetail', { id: product.id });
  };
  
  // Clear all filters
  const clearFilters = () => {
    setActiveFilters([]);
    setQuery('');
    searchProducts('');
  };
  
  // Render product item
  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productItem}>
      <ProductCard 
        product={item}
        onPress={handleProductSelect}
      />
    </View>
  );
  
  return (
    <View style={styles.container}>
      {/* Status Bar */}
      <StatusBar barStyle="dark-content" />
      
      {/* Safe Area Spacer for iOS Notch */}
      <View style={{ height: insets.top, backgroundColor: COLORS.card }} />
      
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onClose || (() => navigation.goBack())}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Search</Text>
        
        <View style={styles.placeholder} />
      </View>
      
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <ExpandableSearch 
          onProductSelect={handleProductSelect}
          placeholder="Search for products..."
        />
      </View>
      
      {/* Filter Categories */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {filterCategories.map((category) => (
            <Pressable
              key={category}
              style={[
                styles.filterChip,
                activeFilters.includes(category) && styles.activeFilterChip
              ]}
              onPress={() => toggleFilter(category)}
            >
              <Text 
                style={[
                  styles.filterText,
                  activeFilters.includes(category) && styles.activeFilterText
                ]}
              >
                {category}
              </Text>
            </Pressable>
          ))}
          
          {(activeFilters.length > 0 || query.length > 0) && (
            <Pressable
              style={styles.clearFiltersButton}
              onPress={clearFilters}
            >
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
      
      {/* Results Count & Sorting Options */}
      {(searchResults.length > 0 || query.trim() !== '') && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {isSearching ? 'Searching...' : `${searchResults.length} results`}
          </Text>
          
          <TouchableOpacity style={styles.sortButton}>
            <Ionicons name="options-outline" size={18} color={COLORS.text} />
            <Text style={styles.sortText}>Sort</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Results List */}
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      ) : searchResults.length === 0 && query.trim() !== '' ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color={COLORS.border} />
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptyText}>
            Try using different keywords or filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.resultsContainer}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.productRow}
        />
      )}
    </View>
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
    height: 60,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.card,
    ...SHADOWS.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    backgroundColor: COLORS.card,
    paddingBottom: SPACING.sm,
    ...SHADOWS.light,
  },
  filtersContainer: {
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.sm,
    ...SHADOWS.light,
  },
  filtersScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  activeFilterText: {
    color: COLORS.accent,
  },
  clearFiltersButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.error,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    marginBottom: SPACING.sm,
    ...SHADOWS.light,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  resultsContainer: {
    padding: SPACING.sm,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
  },
  productItem: {
    flex: 1,
    maxWidth: '50%',
    padding: SPACING.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default SmartSearchView; 