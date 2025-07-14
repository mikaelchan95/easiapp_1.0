import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  TextInput,
  Dimensions,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import * as Animations from '../../utils/animations';

const { width } = Dimensions.get('window');

interface Review {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
  helpful: number;
  userMarkedHelpful: boolean;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    productId: '1',
    productName: 'Macallan 18 Year Old',
    productImage: 'bottle1',
    rating: 5,
    title: 'Exceptional Quality',
    comment:
      'This whiskey exceeded my expectations. Smooth, rich, and perfectly aged. The sherry cask influence is beautifully balanced.',
    date: '2024-01-10',
    verified: true,
    helpful: 12,
    userMarkedHelpful: false,
  },
  {
    id: '2',
    productId: '2',
    productName: 'Dom Pérignon 2013',
    productImage: 'bottle2',
    rating: 4,
    title: 'Great for Special Occasions',
    comment:
      'Excellent champagne with fine bubbles and elegant taste. A bit pricey but worth it for celebrations.',
    date: '2024-01-08',
    verified: true,
    helpful: 8,
    userMarkedHelpful: true,
  },
  {
    id: '3',
    productId: '3',
    productName: 'Macallan 25 Year Old',
    productImage: 'bottle3',
    rating: 5,
    title: 'Premium Experience',
    comment:
      'Absolutely stunning whiskey. Complex flavors that evolve with each sip. Perfect for connoisseurs.',
    date: '2024-01-05',
    verified: false,
    helpful: 15,
    userMarkedHelpful: false,
  },
];

const RATING_FILTERS = [
  { id: 'all', label: 'All Reviews', icon: 'list-outline', count: 0 },
  { id: '5', label: '5 Stars', icon: 'star', count: 0 },
  { id: '4', label: '4 Stars', icon: 'star', count: 0 },
  { id: '3', label: '3 Stars', icon: 'star', count: 0 },
  { id: '2', label: '2 Stars', icon: 'star', count: 0 },
  { id: '1', label: '1 Star', icon: 'star', count: 0 },
];

export default function ReviewsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  // State
  const [reviews, setReviews] = useState(MOCK_REVIEWS);
  const [filteredReviews, setFilteredReviews] = useState(MOCK_REVIEWS);
  const [selectedRating, setSelectedRating] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);

  useEffect(() => {
    // Initial animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut,
      }),
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    // Filter reviews
    let filtered = reviews;

    if (selectedRating !== 'all') {
      filtered = filtered.filter(
        review => review.rating === parseInt(selectedRating)
      );
    }

    if (searchQuery) {
      filtered = filtered.filter(
        review =>
          review.productName
            .toLowerCase()
            .indexOf(searchQuery.toLowerCase()) !== -1 ||
          review.title.toLowerCase().indexOf(searchQuery.toLowerCase()) !==
            -1 ||
          review.comment.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1
      );
    }

    setFilteredReviews(filtered);
  }, [selectedRating, searchQuery, reviews]);

  const handleMarkHelpful = (reviewId: string) => {
    setReviews(prevReviews =>
      prevReviews.map(review =>
        review.id === reviewId
          ? {
              ...review,
              helpful: review.userMarkedHelpful
                ? review.helpful - 1
                : review.helpful + 1,
              userMarkedHelpful: !review.userMarkedHelpful,
            }
          : review
      )
    );
  };

  const renderStars = (
    rating: number,
    size: number = 16,
    color: string = '#FFD700'
  ) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? color : COLORS.inactive}
          />
        ))}
      </View>
    );
  };

  const renderRatingFilter = (filter: any) => {
    const isSelected = selectedRating === filter.id;
    const count =
      filter.id === 'all'
        ? reviews.length
        : reviews.filter(r => r.rating === parseInt(filter.id)).length;

    return (
      <TouchableOpacity
        key={filter.id}
        style={[styles.ratingFilter, isSelected && styles.ratingFilterSelected]}
        onPress={() => setSelectedRating(filter.id)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`Filter by ${filter.label}`}
      >
        <Ionicons
          name={filter.icon as any}
          size={16}
          color={isSelected ? COLORS.accent : COLORS.inactive}
        />
        <Text
          style={[
            styles.ratingFilterText,
            isSelected && styles.ratingFilterTextSelected,
          ]}
        >
          {filter.label}
        </Text>
        <Text
          style={[
            styles.ratingFilterCount,
            isSelected && styles.ratingFilterCountSelected,
          ]}
        >
          ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderReviewCard = ({
    item: review,
    index,
  }: {
    item: Review;
    index: number;
  }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
        easing: Animations.TIMING.easeOut,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.reviewCard,
          {
            opacity: cardAnim,
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.reviewHeader}>
          <View style={styles.productInfo}>
            <View style={styles.productImageContainer}>
              <View style={styles.productImagePlaceholder}>
                <Ionicons
                  name="wine-outline"
                  size={24}
                  color={COLORS.inactive}
                />
              </View>
            </View>
            <View style={styles.productDetails}>
              <Text style={styles.productName} numberOfLines={1}>
                {review.productName}
              </Text>
              <View style={styles.ratingRow}>
                {renderStars(review.rating, 14)}
                <Text style={styles.ratingText}>({review.rating}/5)</Text>
              </View>
            </View>
          </View>

          <View style={styles.reviewMeta}>
            <Text style={styles.reviewDate}>
              {new Date(review.date).toLocaleDateString()}
            </Text>
            {review.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.reviewContent}>
          <Text style={styles.reviewTitle}>{review.title}</Text>
          <Text style={styles.reviewComment}>{review.comment}</Text>
        </View>

        <View style={styles.reviewActions}>
          <TouchableOpacity
            style={[
              styles.helpfulButton,
              review.userMarkedHelpful && styles.helpfulButtonActive,
            ]}
            onPress={() => handleMarkHelpful(review.id)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Mark review as helpful. Currently ${review.helpful} people found this helpful`}
          >
            <Ionicons
              name={
                review.userMarkedHelpful ? 'thumbs-up' : 'thumbs-up-outline'
              }
              size={16}
              color={
                review.userMarkedHelpful ? COLORS.primary : COLORS.inactive
              }
            />
            <Text
              style={[
                styles.helpfulText,
                review.userMarkedHelpful && styles.helpfulTextActive,
              ]}
            >
              Helpful ({review.helpful})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.shareButton}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Share review"
          >
            <Ionicons name="share-outline" size={16} color={COLORS.inactive} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="star-outline" size={64} color={COLORS.inactive} />
      <Text style={styles.emptyStateTitle}>No Reviews Found</Text>
      <Text style={styles.emptyStateText}>
        {searchQuery || selectedRating !== 'all'
          ? 'Try adjusting your search or filters'
          : 'Be the first to share your experience!'}
      </Text>
      {!searchQuery && selectedRating === 'all' && (
        <TouchableOpacity
          style={styles.writeReviewButton}
          onPress={() => setShowAddReviewModal(true)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Write a review"
        >
          <Text style={styles.writeReviewText}>Write a Review</Text>
          <Ionicons name="add" size={16} color={COLORS.accent} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Reviews & Ratings</Text>
          <Text style={styles.headerSubtitle}>
            {filteredReviews.length} review
            {filteredReviews.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddReviewModal(true)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Write a review"
        >
          <Ionicons name="add" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View style={[styles.searchSection, { opacity: fadeAnim }]}>
        <View
          style={[
            styles.searchContainer,
            isSearchFocused && styles.searchContainerFocused,
          ]}
        >
          <Ionicons name="search-outline" size={20} color={COLORS.inactive} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reviews..."
            placeholderTextColor={COLORS.inactive}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            accessible={true}
            accessibilityLabel="Search reviews"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close-circle" size={20} color={COLORS.inactive} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Rating Filters */}
      <Animated.View style={[styles.filtersSection, { opacity: fadeAnim }]}>
        <FlatList
          data={RATING_FILTERS}
          renderItem={({ item }) => renderRatingFilter(item)}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        />
      </Animated.View>

      {/* Reviews List */}
      <FlatList
        data={filteredReviews}
        renderItem={renderReviewCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.reviewsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginRight: SPACING.md,
    ...SHADOWS.light,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    ...SHADOWS.light,
  },
  searchSection: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchContainerFocused: {
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
  filtersSection: {
    marginBottom: SPACING.lg,
  },
  filtersContainer: {
    paddingHorizontal: SPACING.lg,
  },
  ratingFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ratingFilterSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  ratingFilterText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.inactive,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  ratingFilterTextSelected: {
    color: COLORS.accent,
  },
  ratingFilterCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.inactive,
    marginLeft: SPACING.xs / 2,
  },
  ratingFilterCountSelected: {
    color: COLORS.accent,
  },
  reviewsList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  reviewCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  productInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  productImageContainer: {
    marginRight: SPACING.md,
  },
  productImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: SPACING.xs,
  },
  ratingText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  reviewMeta: {
    alignItems: 'flex-end',
  },
  reviewDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.inactive,
    marginBottom: SPACING.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF5015',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: 8,
  },
  verifiedText: {
    ...TYPOGRAPHY.caption,
    color: '#4CAF50',
    marginLeft: SPACING.xs / 2,
    fontWeight: '600',
  },
  reviewContent: {
    marginBottom: SPACING.md,
  },
  reviewTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  reviewComment: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  helpfulButtonActive: {
    backgroundColor: `${COLORS.primary}15`,
  },
  helpfulText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.inactive,
    marginLeft: SPACING.xs,
    fontWeight: '600',
  },
  helpfulTextActive: {
    color: COLORS.primary,
  },
  shareButton: {
    padding: SPACING.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 12,
  },
  writeReviewText: {
    ...TYPOGRAPHY.body,
    color: COLORS.accent,
    fontWeight: '600',
    marginRight: SPACING.sm,
  },
});
