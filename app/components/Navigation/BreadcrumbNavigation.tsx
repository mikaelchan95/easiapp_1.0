import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../utils/theme';

export interface BreadcrumbItem {
  label: string;
  route?: string;
  params?: any;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  separator?: string;
  maxItems?: number;
  style?: any;
}

export const createBreadcrumbs = (items: string[]): BreadcrumbItem[] => {
  return items.map((label, index) => ({
    label,
    route: index < items.length - 1 ? undefined : undefined // Last item has no route
  }));
};

export default function BreadcrumbNavigation({ 
  items, 
  separator = '/',
  maxItems = 4,
  style 
}: BreadcrumbNavigationProps) {
  const navigation = useNavigation();

  const handlePress = (item: BreadcrumbItem) => {
    if (item.route && navigation) {
      navigation.navigate(item.route as never, item.params);
    }
  };

  const displayItems = items.length > maxItems 
    ? [...items.slice(0, 1), { label: '...' }, ...items.slice(-maxItems + 2)]
    : items;

  return (
    <View style={[styles.container, style]}>
      {displayItems.map((item, index) => (
        <View key={index} style={styles.breadcrumbItem}>
          {index > 0 && (
            <Text style={styles.separator}>{separator}</Text>
          )}
          
          {item.route ? (
            <TouchableOpacity 
              onPress={() => handlePress(item)}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>{item.label}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[
              styles.text,
              index === displayItems.length - 1 && styles.currentText
            ]}>
              {item.label}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    marginHorizontal: SPACING.xs,
    opacity: 0.6,
  },
  linkContainer: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  linkText: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  text: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  currentText: {
    color: COLORS.text,
    fontWeight: '600',
  },
});