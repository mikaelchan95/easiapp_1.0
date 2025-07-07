import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../utils/theme';
import { SavedAddress } from '../../types/location';
import * as Haptics from 'expo-haptics';

interface SavedLocationsProps {
  locations: SavedAddress[];
  onSelect: (location: SavedAddress) => void;
  onEdit: (location: SavedAddress) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const SavedLocations: React.FC<SavedLocationsProps> = ({
  locations,
  onSelect,
  onEdit,
  onDelete,
  onAdd,
}) => {
  const handleDelete = (location: SavedAddress) => {
    Alert.alert(
      'Delete Location',
      `Are you sure you want to delete "${location.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onDelete(location.id);
          },
        },
      ]
    );
  };

  const getIconName = (label: string) => {
    switch (label.toLowerCase()) {
      case 'home':
        return 'home';
      case 'office':
      case 'work':
        return 'business';
      default:
        return 'location';
    }
  };

  const renderLocation = ({ item }: { item: SavedAddress }) => (
    <TouchableOpacity
      style={styles.locationCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect(item);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.locationIcon}>
        <Ionicons
          name={getIconName(item.label)}
          size={24}
          color={COLORS.primary}
        />
      </View>
      
      <View style={styles.locationDetails}>
        <Text style={styles.locationLabel}>{item.label}</Text>
        <Text style={styles.locationAddress} numberOfLines={1}>
          {item.location.title}
        </Text>
        {item.location.subtitle && (
          <Text style={styles.locationSubtitle} numberOfLines={1}>
            {item.location.subtitle}
          </Text>
        )}
        {item.unitNumber && (
          <Text style={styles.locationUnit}>
            Unit: {item.unitNumber}
            {item.buildingName && ` • ${item.buildingName}`}
          </Text>
        )}
      </View>

      <View style={styles.locationActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onEdit(item);
          }}
        >
          <Ionicons name="pencil" size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Locations</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onAdd();
          }}
        >
          <Ionicons name="add" size={20} color={COLORS.primary} />
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>

      {locations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="location-outline"
            size={48}
            color={COLORS.inactive}
            style={styles.emptyIcon}
          />
          <Text style={styles.emptyText}>No saved locations yet</Text>
          <Text style={styles.emptySubtext}>
            Add your home, office, or frequently visited places
          </Text>
        </View>
      ) : (
        <FlatList
          data={locations}
          renderItem={renderLocation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  list: {
    paddingHorizontal: 20,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.light,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  locationSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  locationUnit: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
  },
  locationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default SavedLocations;