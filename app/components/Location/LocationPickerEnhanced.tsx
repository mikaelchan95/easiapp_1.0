import React, { useState, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppContext } from '../../context/AppContext';
import { LocationSuggestion } from '../../types/location';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../utils/theme';
import LocationScreen from './LocationScreen';
import { HapticFeedback } from '../../utils/haptics';

interface LocationPickerEnhancedProps {
  onClose?: () => void;
}

const LocationPickerEnhanced: React.FC<LocationPickerEnhancedProps> = ({
  onClose,
}) => {
  const { state, dispatch } = useContext(AppContext);
  const navigation = useNavigation();

  const handleLocationSelect = useCallback(
    (location: LocationSuggestion) => {
      // Provide haptic feedback
      HapticFeedback.success();

      // Update global state
      dispatch({ type: 'SET_SELECTED_LOCATION', payload: location });

      // Close the screen
      if (onClose) {
        onClose();
      } else {
        navigation.goBack();
      }
    },
    [dispatch, onClose, navigation]
  );

  const handleClose = useCallback(() => {
    HapticFeedback.light();
    if (onClose) {
      onClose();
    } else {
      navigation.goBack();
    }
  }, [onClose, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Select Delivery Location</Text>

          {/* Placeholder for balance */}
          <View style={styles.closeButton} />
        </View>

        {/* Current Location Display */}
        {state.selectedLocation && (
          <View style={styles.currentLocationCard}>
            <View style={styles.currentLocationIcon}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.currentLocationInfo}>
              <Text style={styles.currentLocationLabel}>
                Current delivery location
              </Text>
              <Text style={styles.currentLocationText}>
                {state.selectedLocation.title}
              </Text>
              {state.selectedLocation.subtitle && (
                <Text style={styles.currentLocationSubtext}>
                  {state.selectedLocation.subtitle}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>What's available:</Text>
          <View style={styles.featuresList}>
            <FeatureItem
              icon="search"
              text="Search by address, landmark, or postal code"
            />
            <FeatureItem icon="location" text="Use current GPS location" />
            <FeatureItem
              icon="bookmark"
              text="Save favorite addresses with nicknames"
            />
            <FeatureItem icon="time" text="Quick access to recent locations" />
            <FeatureItem icon="map" text="Interactive map with pin drop" />
            <FeatureItem
              icon="home"
              text="Add delivery instructions and unit details"
            />
          </View>
        </View>

        {/* Location Screen Component */}
        <View style={styles.locationScreenContainer}>
          <LocationScreen onLocationSelect={handleLocationSelect} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const FeatureItem: React.FC<{ icon: string; text: string }> = ({
  icon,
  text,
}) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIcon}>
      <Ionicons name={icon as any} size={16} color={COLORS.primary} />
    </View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    fontWeight: '600',
    color: COLORS.text,
  },
  currentLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: 12,
    ...SHADOWS.light,
  },
  currentLocationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  currentLocationInfo: {
    flex: 1,
  },
  currentLocationLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  currentLocationText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  currentLocationSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  featuresSection: {
    paddingHorizontal: SPACING.md,
    marginTop: SPACING.lg,
  },
  featuresTitle: {
    ...TYPOGRAPHY.h4,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  featuresList: {
    gap: SPACING.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs / 2,
  },
  featureIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  featureText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
  },
  locationScreenContainer: {
    flex: 1,
    marginTop: SPACING.md,
  },
});

export default LocationPickerEnhanced;
