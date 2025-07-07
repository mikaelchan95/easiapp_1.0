import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../utils/theme';
import { LocationSuggestion, SavedAddress } from '../../types/location';

interface LocationSelectionUIProps {
  onSearchPress: () => void;
  onPostalCodePress: () => void;
  onCurrentLocationPress: () => void;
  onSavedLocationPress: () => void;
  onRecentLocationSelect: (location: LocationSuggestion) => void;
  recentLocations: LocationSuggestion[];
  savedLocations: SavedAddress[];
  isLoadingCurrent: boolean;
}

const LocationSelectionUI: React.FC<LocationSelectionUIProps> = ({
  onSearchPress,
  onPostalCodePress,
  onCurrentLocationPress,
  onSavedLocationPress,
  onRecentLocationSelect,
  recentLocations,
  savedLocations,
  isLoadingCurrent,
}) => {
  const quickActions = [
    {
      icon: 'search',
      title: 'Search Address',
      subtitle: 'Search by street, building, or landmark',
      onPress: onSearchPress,
      color: COLORS.primary,
    },
    {
      icon: 'keypad',
      title: 'Enter Postal Code',
      subtitle: 'Quick search with 6-digit postal code',
      onPress: onPostalCodePress,
      color: '#FF6B6B',
    },
    {
      icon: 'locate',
      title: 'Current Location',
      subtitle: 'Use your device location',
      onPress: onCurrentLocationPress,
      color: '#4ECDC4',
      loading: isLoadingCurrent,
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Location Method</Text>
        <View style={styles.quickActions}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionCard}
              onPress={action.onPress}
              disabled={action.loading}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                <Ionicons
                  name={action.icon as any}
                  size={24}
                  color={action.color}
                />
              </View>
              <View style={styles.quickActionContent}>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.inactive}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Saved Locations */}
      {savedLocations.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Locations</Text>
            <TouchableOpacity onPress={onSavedLocationPress}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.savedLocationsScroll}
          >
            {savedLocations.slice(0, 3).map((location) => (
              <TouchableOpacity
                key={location.id}
                style={styles.savedLocationCard}
                onPress={() => onRecentLocationSelect(location.location)}
              >
                <View style={styles.savedLocationIcon}>
                  <Ionicons
                    name={
                      location.label.toLowerCase() === 'home'
                        ? 'home'
                        : location.label.toLowerCase() === 'office'
                        ? 'business'
                        : 'location'
                    }
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.savedLocationLabel}>{location.label}</Text>
                <Text style={styles.savedLocationAddress} numberOfLines={1}>
                  {location.location.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent Locations */}
      {recentLocations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Locations</Text>
          <View style={styles.recentLocations}>
            {recentLocations.slice(0, 5).map((location) => (
              <TouchableOpacity
                key={location.id}
                style={styles.recentLocationItem}
                onPress={() => onRecentLocationSelect(location)}
              >
                <View style={styles.recentLocationIcon}>
                  <Ionicons
                    name="time-outline"
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </View>
                <View style={styles.recentLocationContent}>
                  <Text style={styles.recentLocationTitle}>{location.title}</Text>
                  {location.subtitle && (
                    <Text style={styles.recentLocationSubtitle}>
                      {location.subtitle}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  quickActions: {
    gap: 12,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.light,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  savedLocationsScroll: {
    paddingRight: 20,
  },
  savedLocationCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 140,
    ...SHADOWS.light,
  },
  savedLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  savedLocationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  savedLocationAddress: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  recentLocations: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    ...SHADOWS.light,
  },
  recentLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  recentLocationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentLocationContent: {
    flex: 1,
  },
  recentLocationTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  recentLocationSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});

export default LocationSelectionUI;