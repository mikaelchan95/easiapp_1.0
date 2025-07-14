import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import { SavedAddress } from '../../types/location';
import SwipeableListItem from '../UI/SwipeableListItem';

interface SavedLocationsProps {
  savedAddresses: SavedAddress[];
  onSelect: (address: SavedAddress) => void;
  onEdit: (address: SavedAddress) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const SavedLocations: React.FC<SavedLocationsProps> = ({
  savedAddresses,
  onSelect,
  onEdit,
  onDelete,
  onAdd,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Handle swipe actions
  const handleDelete = (id: string) => {
    if (Platform.OS === 'ios') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this saved location?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
            }
            onDelete(id);
          },
        },
      ]
    );
  };

  const handleEdit = (address: SavedAddress) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onEdit(address);
  };

  const handleSelect = (address: SavedAddress) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect(address);
  };

  const handleAddNew = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onAdd();
  };

  const renderItem = ({ item }: { item: SavedAddress }) => {
    const isExpanded = expandedId === item.id;

    return (
      <SwipeableListItem
        key={item.id}
        onSwipeLeft={() => handleDelete(item.id)}
        onSwipeRight={() => handleEdit(item)}
        leftAction={{
          icon: 'trash-outline',
          color: COLORS.error,
          text: 'Delete',
        }}
        rightAction={{
          icon: 'create-outline',
          color: COLORS.primary,
          text: 'Edit',
        }}
      >
        <TouchableOpacity
          style={styles.addressItem}
          onPress={() => handleSelect(item)}
          activeOpacity={0.7}
          accessibilityLabel={`Select ${item.label}: ${item.location.title}`}
          accessibilityRole="button"
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: item.color || COLORS.primary },
            ]}
          >
            <Ionicons
              name={item.icon || 'location'}
              size={20}
              color={COLORS.card}
            />
          </View>

          <View style={styles.addressDetails}>
            <View style={styles.addressHeader}>
              <Text style={styles.addressLabel}>{item.label}</Text>
              {item.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}
            </View>

            <Text style={styles.addressLine} numberOfLines={1}>
              {item.location.title}
            </Text>

            {item.location.subtitle && (
              <Text style={styles.addressSubtitle} numberOfLines={1}>
                {item.location.subtitle}
              </Text>
            )}

            {item.unitNumber && (
              <Text style={styles.unitNumber}>Unit: {item.unitNumber}</Text>
            )}
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      </SwipeableListItem>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Saved Addresses</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddNew}
          accessibilityLabel="Add new address"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={20} color={COLORS.primary} />
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {savedAddresses.length > 0 ? (
        <FlatList
          data={savedAddresses}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons
            name="location-outline"
            size={48}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyTitle}>No saved addresses</Text>
          <Text style={styles.emptySubtitle}>
            Save addresses for faster checkout
          </Text>
          <TouchableOpacity
            style={styles.emptyAddButton}
            onPress={handleAddNew}
            activeOpacity={0.7}
          >
            <Text style={styles.emptyAddButtonText}>
              Add Your First Address
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  addButtonText: {
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: SPACING.lg,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  addressDetails: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  addressLabel: {
    ...TYPOGRAPHY.subtitle,
    fontWeight: '600',
    color: COLORS.text,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: SPACING.xs,
  },
  defaultText: {
    color: COLORS.card,
    fontSize: 10,
    fontWeight: '500',
  },
  addressLine: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: 2,
  },
  addressSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  unitNumber: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h4,
    marginTop: SPACING.md,
    color: COLORS.text,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  emptyAddButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    marginTop: SPACING.md,
    ...SHADOWS.light,
  },
  emptyAddButtonText: {
    color: COLORS.card,
    fontWeight: '600',
  },
});

export default SavedLocations;
