import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

import {
  LocationSuggestionsListProps,
  LocationSuggestion,
} from '../../types/location';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import * as Animations from '../../utils/animations';

interface SwipeableRowProps {
  item: LocationSuggestion;
  onSelect: (location: LocationSuggestion) => void;
  onDelete?: (id: string) => void;
  showDeleteButton?: boolean;
}

// Swipeable row component for recent locations
const SwipeableRow: React.FC<SwipeableRowProps> = ({
  item,
  onSelect,
  onDelete,
  showDeleteButton = false,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteButtonOpacity = useRef(new Animated.Value(0)).current;
  const rowOpacity = useRef(new Animated.Value(1)).current;
  const [isRevealed, setIsRevealed] = useState(false);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = useCallback(
    (event: any) => {
      if (event.nativeEvent.oldState === State.ACTIVE) {
        const { translationX } = event.nativeEvent;

        // Only allow left swipe and only for recent items
        if (translationX < -50 && item.type === 'recent' && showDeleteButton) {
          // Reveal delete button
          setIsRevealed(true);
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: -80,
              friction: 8,
              tension: 100,
              useNativeDriver: false,
            }),
            Animated.timing(deleteButtonOpacity, {
              toValue: 1,
              duration: Animations.DURATION.short,
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          // Snap back
          setIsRevealed(false);
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              friction: 8,
              tension: 100,
              useNativeDriver: false,
            }),
            Animated.timing(deleteButtonOpacity, {
              toValue: 0,
              duration: Animations.DURATION.short,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }
    },
    [translateX, deleteButtonOpacity, item.type, showDeleteButton]
  );

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;

    // Provide haptic feedback
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      // Haptics might not be available on all devices
    }

    // Animate row removal
    Animated.parallel([
      Animated.timing(rowOpacity, {
        toValue: 0,
        duration: Animations.DURATION.medium,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: -300,
        duration: Animations.DURATION.medium,
        easing: Animations.TIMING.easeIn,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onDelete(item.id);
    });
  }, [onDelete, item.id, rowOpacity, translateX]);

  const handlePress = useCallback(() => {
    if (isRevealed) {
      // Close the revealed state first
      setIsRevealed(false);
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          friction: 8,
          tension: 100,
          useNativeDriver: false,
        }),
        Animated.timing(deleteButtonOpacity, {
          toValue: 0,
          duration: Animations.DURATION.short,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      onSelect(item);
    }
  }, [isRevealed, onSelect, item, translateX, deleteButtonOpacity]);

  return (
    <View style={styles.swipeContainer}>
      {/* Delete button (behind the row) */}
      <Animated.View
        style={[
          styles.deleteContainer,
          {
            opacity: deleteButtonOpacity,
          },
        ]}
      >
        <Pressable
          onPress={handleDelete}
          style={styles.deleteButton}
          accessibilityLabel={`Delete ${item.title} from recent locations`}
          accessibilityRole="button"
        >
          <Ionicons name="trash" size={20} color={COLORS.card} />
          <Text style={styles.deleteText}>Delete</Text>
        </Pressable>
      </Animated.View>

      {/* Swipeable row */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        enabled={item.type === 'recent' && showDeleteButton}
      >
        <Animated.View
          style={[
            styles.rowContainer,
            {
              transform: [{ translateX }],
              opacity: rowOpacity,
            },
          ]}
        >
          <LocationRow item={item} onPress={handlePress} />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

// Individual location row component
interface LocationRowProps {
  item: LocationSuggestion;
  onPress: () => void;
}

const LocationRow: React.FC<LocationRowProps> = ({ item, onPress }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;

  const handlePressIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0.98,
        duration: Animations.DURATION.short,
        easing: Animations.TIMING.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: Animations.DURATION.short,
        easing: Animations.TIMING.easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleValue, backgroundOpacity]);

  const handlePressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 5,
        tension: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 200, // Fade out over 200ms as specified
        easing: Animations.TIMING.easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleValue, backgroundOpacity]);

  const getIcon = () => {
    switch (item.type) {
      case 'current':
        return 'locate';
      case 'recent':
        return 'time';
      default:
        return 'location';
    }
  };

  return (
    <Animated.View
      style={[
        styles.row,
        {
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.rowPressable}
        accessibilityLabel={`Select ${item.title}`}
        accessibilityHint={item.subtitle || 'Location option'}
        accessibilityRole="button"
      >
        {/* Highlight background */}
        <Animated.View
          style={[
            styles.highlightBackground,
            {
              opacity: backgroundOpacity,
            },
          ]}
        />

        <View style={styles.rowContent}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name={getIcon()}
              size={20}
              color={
                item.type === 'current' ? COLORS.primary : COLORS.textSecondary
              }
            />
          </View>

          {/* Text content */}
          <View style={styles.textContent}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={styles.subtitle} numberOfLines={1}>
                {item.subtitle}
              </Text>
            )}
          </View>

          {/* Arrow icon */}
          <View style={styles.arrowContainer}>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={COLORS.inactive}
            />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// Main suggestions list component
const LocationSuggestionsList: React.FC<LocationSuggestionsListProps> = ({
  suggestions,
  recentLocations,
  currentLocation,
  onLocationSelect,
  onDeleteRecent,
  isLoadingCurrent,
  onRefreshLocation,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    onRefreshLocation();

    // Wait for loading to complete
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, [onRefreshLocation]);

  const handleLocationSelect = useCallback(
    async (location: LocationSuggestion) => {
      // Provide haptic feedback
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        // Haptics might not be available on all devices
      }

      onLocationSelect(location);
    },
    [onLocationSelect]
  );

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={COLORS.primary}
          title="Updating location..."
          titleColor={COLORS.textSecondary}
        />
      }
      // Enable momentum scrolling
      decelerationRate="normal"
      scrollEventThrottle={16}
    >
      {/* Current Location Section */}
      {(currentLocation || isLoadingCurrent) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Location</Text>
          {isLoadingCurrent ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Getting your location...</Text>
            </View>
          ) : currentLocation ? (
            <SwipeableRow
              item={currentLocation}
              onSelect={handleLocationSelect}
              showDeleteButton={false}
            />
          ) : null}
        </View>
      )}

      {/* Recent Locations Section */}
      {recentLocations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent</Text>
          {recentLocations.map(location => (
            <SwipeableRow
              key={location.id}
              item={location}
              onSelect={handleLocationSelect}
              onDelete={onDeleteRecent}
              showDeleteButton={true}
            />
          ))}
        </View>
      )}

      {/* Suggestions Section */}
      {suggestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Suggestions</Text>
          {suggestions.map(location => (
            <SwipeableRow
              key={location.id}
              item={location}
              onSelect={handleLocationSelect}
              showDeleteButton={false}
            />
          ))}
        </View>
      )}

      {/* Empty state */}
      {suggestions.length === 0 &&
        recentLocations.length === 0 &&
        !currentLocation &&
        !isLoadingCurrent && (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="location-outline"
              size={48}
              color={COLORS.inactive}
            />
            <Text style={styles.emptyTitle}>No locations found</Text>
            <Text style={styles.emptySubtitle}>
              Try searching for an address or place
            </Text>
          </View>
        )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  swipeContainer: {
    position: 'relative',
    marginBottom: SPACING.xs,
  },
  deleteContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    borderRadius: 12,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  deleteText: {
    color: COLORS.card,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  rowContainer: {
    backgroundColor: COLORS.card,
  },
  row: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
  },
  rowPressable: {
    position: 'relative',
    minHeight: 56, // Ensuring proper touch target
  },
  highlightBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 56,
  },
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  textContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  arrowContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: SPACING.xs,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.inactive,
    textAlign: 'center',
  },
});

export default LocationSuggestionsList;
