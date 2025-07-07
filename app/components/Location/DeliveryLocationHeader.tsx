import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import { LocationSuggestion } from '../../types/location';

interface DeliveryLocationHeaderProps {
  location: LocationSuggestion | null;
  onPress: () => void;
  isLoading?: boolean;
  showChangeButton?: boolean;
  showDeliveryInfo?: boolean;
  style?: any;
}

const DeliveryLocationHeader: React.FC<DeliveryLocationHeaderProps> = ({
  location,
  onPress,
  isLoading = false,
  showChangeButton = true,
  showDeliveryInfo = false,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.7}
      accessible={true}
      accessibilityLabel={
        location 
          ? `Current delivery location: ${location.title}. Tap to change.`
          : "No delivery location set. Tap to choose location."
      }
      accessibilityRole="button"
      accessibilityHint="Opens location picker to select delivery address"
    >
      <View style={styles.content}>
        {/* Location Icon */}
        <View style={styles.iconContainer}>
          <Ionicons 
            name="location" 
            size={20} 
            color={COLORS.primary} 
          />
        </View>

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <Text style={styles.label}>Deliver to</Text>
          
          {isLoading ? (
            <Text style={styles.loadingText}>Getting location...</Text>
          ) : location ? (
            <>
              <Text style={styles.locationTitle} numberOfLines={1}>
                {location.title}
              </Text>
              {location.subtitle && (
                <Text style={styles.locationSubtitle} numberOfLines={1}>
                  {location.subtitle}
                </Text>
              )}
              {/* Show delivery info if available and requested */}
              {showDeliveryInfo && (location as any).deliveryInfo && (
                <View style={styles.deliveryInfo}>
                  <Text style={styles.deliveryInfoText}>
                    {(location as any).deliveryInfo.estimatedTime} • ${(location as any).deliveryInfo.deliveryFee}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.placeholder}>
              Tap to set delivery address
            </Text>
          )}
        </View>

        {/* Change Button */}
        {showChangeButton && (
          <View style={styles.changeButton}>
            <Text style={styles.changeButtonText}>Change</Text>
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color={COLORS.primary} 
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  locationInfo: {
    flex: 1,
  },
  label: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  locationSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  placeholder: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: SPACING.xs,
  },
  changeButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: 4,
  },
  deliveryInfo: {
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  deliveryInfoText: {
    ...TYPOGRAPHY.small,
    color: COLORS.success,
    fontWeight: '500',
  },
});

export default DeliveryLocationHeader;