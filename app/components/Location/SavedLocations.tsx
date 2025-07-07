import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SavedLocationsProps, SavedAddress } from '../../types/location';
import { HapticFeedback } from '../../utils/haptics';

/**
 * Component for displaying and managing saved delivery locations
 */
export default function SavedLocations({
  savedAddresses,
  onSelect,
  onEdit,
  onDelete,
  onAdd
}: SavedLocationsProps) {
  // Icons mapped to common location types
  const getIconForLabel = (label: string): string => {
    const iconMap: Record<string, string> = {
      'Home': 'home',
      'Work': 'work',
      'Office': 'business',
      'Gym': 'fitness-center',
      'School': 'school',
      'Partner': 'favorite',
      'Family': 'family-restroom',
      'Friend': 'people',
      'Other': 'place'
    };
    
    return iconMap[label] || 'place';
  };
  
  // Get color for label
  const getColorForLabel = (label: string, customColor?: string): string => {
    if (customColor) return customColor;
    
    const colorMap: Record<string, string> = {
      'Home': '#4CAF50', // Green
      'Work': '#2196F3', // Blue
      'Office': '#607D8B', // Blue Grey
      'Gym': '#FF5722', // Deep Orange
      'School': '#9C27B0', // Purple
      'Partner': '#E91E63', // Pink
      'Family': '#3F51B5', // Indigo
      'Friend': '#00BCD4', // Cyan
      'Other': '#757575'  // Grey
    };
    
    return colorMap[label] || '#757575';
  };

  // Confirm deletion
  const confirmDelete = (address: SavedAddress) => {
    Alert.alert(
      'Delete Saved Location',
      `Are you sure you want to delete "${address.label}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          onPress: () => {
            HapticFeedback.warning();
            onDelete(address.id);
          },
          style: 'destructive'
        }
      ]
    );
  };

  // Handle selection with haptic feedback
  const handleSelect = (address: SavedAddress) => {
    HapticFeedback.light();
    onSelect(address);
  };

  // Handle edit with haptic feedback
  const handleEdit = (address: SavedAddress) => {
    HapticFeedback.medium();
    onEdit(address);
  };
  
  // Render a saved address card
  const renderAddressCard = ({ item }: { item: SavedAddress }) => (
    <View style={styles.addressCard}>
      <TouchableOpacity
        style={styles.addressCardContent}
        onPress={() => handleSelect(item)}
      >
        <View 
          style={[
            styles.iconContainer, 
            { backgroundColor: getColorForLabel(item.label, item.color) }
          ]}
        >
          <MaterialIcons 
            name={(item.icon || getIconForLabel(item.label)) as any} 
            size={24} 
            color="white" 
          />
        </View>
        
        <View style={styles.addressInfo}>
          <Text style={styles.addressLabel}>{item.label}</Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {item.location.formattedAddress || item.location.subtitle || item.location.address}
          </Text>
          {item.unitNumber && (
            <Text style={styles.detailText}>
              Unit: {item.unitNumber}
              {item.buildingName ? `, ${item.buildingName}` : ''}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleEdit(item)}
        >
          <MaterialIcons name="edit" size={20} color="#555" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => confirmDelete(item)}
        >
          <MaterialIcons name="delete" size={20} color="#d32f2f" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Locations</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={onAdd}
        >
          <MaterialIcons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>
      
      {savedAddresses.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="bookmark-border" size={48} color="#bdbdbd" />
          <Text style={styles.emptyStateText}>
            No saved locations yet
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Add frequently used addresses for quick selection
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedAddresses}
          renderItem={renderAddressCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.addressList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'hsl(0, 0%, 98%)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'hsl(0, 0%, 90%)',
    backgroundColor: 'hsl(0, 0%, 100%)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'hsl(0, 0%, 0%)',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'hsl(0, 0%, 0%)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'hsl(0, 0%, 100%)',
    fontWeight: '600',
    marginLeft: 4,
  },
  addressList: {
    padding: 16,
  },
  addressCard: {
    backgroundColor: 'hsl(0, 0%, 100%)',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'hsl(0, 0%, 90%)',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2.22,
    elevation: 3,
  },
  addressCardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'hsl(0, 0%, 50%)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'hsl(0, 0%, 0%)',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: 'hsl(0, 0%, 30%)',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: 'hsl(0, 0%, 45%)',
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'hsl(0, 0%, 90%)',
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'hsl(0, 0%, 30%)',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'hsl(0, 0%, 45%)',
    textAlign: 'center',
  },
});