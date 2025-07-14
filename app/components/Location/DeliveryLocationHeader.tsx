import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS } from '../../utils/theme';
import { LocationSuggestion, SavedAddress } from '../../types/location';
import { useDeliveryLocation } from '../../hooks/useDeliveryLocation';

interface DeliveryLocationHeaderProps {
  location: LocationSuggestion | null;
  onPress?: () => void;
  isLoading?: boolean;
  showChangeButton?: boolean;
  showDeliveryInfo?: boolean;
  showSavedLocations?: boolean;
  style?: any;
}

const { width: screenWidth } = Dimensions.get('window');

const DeliveryLocationHeader: React.FC<DeliveryLocationHeaderProps> = ({
  location,
  onPress,
  isLoading = false,
  showChangeButton = true,
  showDeliveryInfo = false,
  showSavedLocations = true,
  style,
}) => {
  const navigation = useNavigation();
  const {
    getShortAddress,
    hasDeliveryLocation,
    savedAddresses,
    setDeliveryLocation,
    isCurrentLocationSaved,
  } = useDeliveryLocation();

  const [showDropdown, setShowDropdown] = useState(false);
  const [deliveryTimeInfo, setDeliveryTimeInfo] = useState<string | null>(null);
  const [deliveryFeeInfo, setDeliveryFeeInfo] = useState<string | null>(null);

  // Check if using black theme based on style prop
  const isBlackTheme = style?.backgroundColor === '#000';

  // Animation for the arrow
  const arrowRotation = useRef(new Animated.Value(0)).current;
  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const dropdownHeight = useRef(new Animated.Value(0)).current;

  const rotateInterpolation = arrowRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // Get delivery info if available
  useEffect(() => {
    if (
      showDeliveryInfo &&
      location?.deliveryInfo?.estimatedTime &&
      location?.deliveryInfo?.deliveryFee !== undefined
    ) {
      setDeliveryTimeInfo(location.deliveryInfo.estimatedTime);
      setDeliveryFeeInfo(
        location.deliveryInfo.deliveryFee > 0
          ? `$${location.deliveryInfo.deliveryFee.toFixed(2)}`
          : 'FREE'
      );
    } else {
      setDeliveryTimeInfo(null);
      setDeliveryFeeInfo(null);
    }
  }, [location, showDeliveryInfo]);

  const toggleDropdown = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newValue = showDropdown ? 0 : 1;
    const toHeight = showDropdown
      ? 0
      : Math.min(savedAddresses.length * 60 + 80, 300);

    setShowDropdown(!showDropdown);

    Animated.parallel([
      Animated.timing(arrowRotation, {
        toValue: newValue,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(dropdownOpacity, {
        toValue: newValue,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(dropdownHeight, {
        toValue: toHeight,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (showSavedLocations && savedAddresses.length > 0) {
      toggleDropdown();
    } else {
      // Original behavior - navigate to location picker
      const handleLocationPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onPress) {
          onPress();
        } else {
          navigation.navigate('DeliveryLocationScreen');
        }
      };

      handleLocationPress();
    }
  };

  const handleLocationSelect = async (savedAddress: SavedAddress) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Update the delivery location
    const locationWithSavedType = {
      ...savedAddress.location,
      type: 'saved' as const,
    };

    await setDeliveryLocation(locationWithSavedType);

    // Close dropdown
    toggleDropdown();
  };

  const handleAddNewLocation = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setShowDropdown(false);

    if (onPress) {
      onPress();
    } else {
      navigation.navigate('DeliveryLocationScreen');
    }
  };

  const handleEditPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    } else {
      // Navigate to location picker for editing
      navigation.navigate('DeliveryLocationScreen');
    }
  };

  const renderSavedLocationItem = ({ item }: { item: SavedAddress }) => (
    <TouchableOpacity
      style={styles.savedLocationItem}
      onPress={() => handleLocationSelect(item)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.savedLocationIcon,
          { backgroundColor: item.color || COLORS.primary },
        ]}
      >
        <Ionicons
          name={(item.icon as any) || 'location'}
          size={16}
          color={COLORS.card}
        />
      </View>
      <View style={styles.savedLocationInfo}>
        <Text style={styles.savedLocationLabel} numberOfLines={1}>
          {item.label}
        </Text>
        <Text style={styles.savedLocationAddress} numberOfLines={1}>
          {item.location.title}
        </Text>
      </View>
      {item.isDefault && (
        <View style={styles.defaultBadge}>
          <Text style={styles.defaultBadgeText}>Default</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.headerContainer}
        onPress={handlePress}
        disabled={isLoading}
        activeOpacity={0.7}
        accessible={true}
        accessibilityLabel={
          location
            ? `Current delivery location: ${location.title}. Tap to change.`
            : 'No delivery location set. Tap to choose location.'
        }
        accessibilityRole="button"
        accessibilityHint="Double tap to change your delivery address"
      >
        <View style={styles.content}>
          {/* Location Icon */}
          <View
            style={[
              styles.iconContainer,
              isBlackTheme && styles.blackThemeIconContainer,
            ]}
          >
            <Ionicons
              name="location"
              size={20}
              color={isBlackTheme ? '#fff' : COLORS.primary}
            />
          </View>

          {/* Location Info */}
          <View style={styles.locationInfo}>
            <Text style={[styles.label, isBlackTheme && styles.whiteText]}>
              Deliver to
            </Text>

            {isLoading ? (
              <Text
                style={[styles.loadingText, isBlackTheme && styles.whiteText]}
              >
                Loading...
              </Text>
            ) : location ? (
              <>
                <Text
                  style={[
                    styles.locationTitle,
                    isBlackTheme && styles.whiteText,
                  ]}
                  numberOfLines={1}
                >
                  {location.title}
                </Text>
                {location.subtitle && (
                  <Text
                    style={[
                      styles.locationSubtitle,
                      isBlackTheme && styles.whiteText,
                    ]}
                    numberOfLines={1}
                  >
                    {location.subtitle}
                  </Text>
                )}
                {/* Show delivery info if available and requested */}
                {showDeliveryInfo && (location as any).deliveryInfo && (
                  <View style={styles.deliveryInfo}>
                    <Text
                      style={[
                        styles.deliveryInfoText,
                        isBlackTheme && styles.whiteText,
                      ]}
                    >
                      <Ionicons name="time-outline" size={12} />{' '}
                      {deliveryTimeInfo}
                      {deliveryFeeInfo && (
                        <Text>
                          {' '}
                          •{' '}
                          <Text
                            style={[
                              styles.deliveryInfoText,
                              isBlackTheme && styles.whiteText,
                              deliveryFeeInfo === 'FREE' &&
                                styles.freeDeliveryText,
                            ]}
                          >
                            {deliveryFeeInfo}
                          </Text>
                        </Text>
                      )}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <Text
                style={[styles.placeholder, isBlackTheme && styles.whiteText]}
              >
                Set delivery address
              </Text>
            )}
          </View>

          {/* Change Button or Dropdown Arrow */}
          {showChangeButton && (
            <View style={styles.changeButton}>
              {showSavedLocations && savedAddresses.length > 0 ? (
                <View style={styles.dropdownIndicator}>
                  <Animated.View
                    style={[
                      styles.arrowContainer,
                      { transform: [{ rotate: rotateInterpolation }] },
                    ]}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={isBlackTheme ? '#fff' : COLORS.primary}
                    />
                  </Animated.View>
                </View>
              ) : (
                <>
                  <Text
                    style={[
                      styles.changeButtonText,
                      isBlackTheme && styles.whiteText,
                    ]}
                  >
                    Change
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={isBlackTheme ? '#fff' : COLORS.primary}
                  />
                </>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Saved Locations Dropdown */}
      {showSavedLocations && (
        <Animated.View
          style={[
            styles.dropdown,
            {
              opacity: dropdownOpacity,
              height: dropdownHeight,
            },
          ]}
        >
          <View style={styles.dropdownContent}>
            <Text style={styles.dropdownTitle}>Quick Select</Text>

            {savedAddresses.slice(0, 4).map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.savedLocationItem}
                onPress={() => handleLocationSelect(item)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.savedLocationIcon,
                    { backgroundColor: item.color || COLORS.primary },
                  ]}
                >
                  <Ionicons
                    name={(item.icon as any) || 'location'}
                    size={16}
                    color={COLORS.card}
                  />
                </View>
                <View style={styles.savedLocationInfo}>
                  <Text style={styles.savedLocationLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <Text style={styles.savedLocationAddress} numberOfLines={1}>
                    {item.location.title}
                  </Text>
                </View>
                {item.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Default</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.addNewLocationButton}
              onPress={handleAddNewLocation}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={COLORS.primary}
              />
              <Text style={styles.addNewLocationText}>Add new location</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.light,
  },
  headerContainer: {
    // No additional styles needed, keeping original structure
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 72,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationInfo: {
    flex: 1,
  },
  label: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  locationTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 20,
  },
  locationSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
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
  freeDeliveryText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  dropdownIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowContainer: {
    padding: 4,
  },
  whiteText: {
    color: '#fff',
  },
  blackThemeIconContainer: {
    backgroundColor: '#333',
  },

  // Dropdown styles
  dropdown: {
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  dropdownContent: {
    padding: SPACING.md,
  },
  dropdownTitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  savedLocationsList: {
    maxHeight: 200,
  },
  savedLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderRadius: 8,
    marginBottom: 4,
  },
  savedLocationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  savedLocationInfo: {
    flex: 1,
  },
  savedLocationLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  savedLocationAddress: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: {
    ...TYPOGRAPHY.small,
    color: COLORS.card,
    fontWeight: '500',
    fontSize: 10,
  },
  addNewLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addNewLocationText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default DeliveryLocationHeader;
