import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LocationSuggestion } from '../../types/location';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../utils/theme';
import LocationPicker from './LocationPicker';

const LocationPickerDemo: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState<string>('Marina Bay Sands');
  const [deliveryAddress, setDeliveryAddress] = useState<LocationSuggestion | null>(null);

  const handleLocationSelect = useCallback((location: LocationSuggestion) => {
    setSelectedLocation(location.title);
    setDeliveryAddress(location);
    console.log('Location selected:', location);
  }, []);

  const handleLocationUpdate = useCallback((location: LocationSuggestion) => {
    console.log('Location updated:', location);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Location Picker Demo</Text>
        <Text style={styles.headerSubtitle}>
          Experience the complete location selection flow
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Demo Section */}
        <View style={styles.demoSection}>
          <Text style={styles.sectionTitle}>Interactive Location Picker</Text>
          <Text style={styles.sectionDescription}>
            Tap the location header below to experience the full location picker flow with:
          </Text>
          
          {/* Features list */}
          <View style={styles.featuresList}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons 
                  name={feature.icon} 
                  size={16} 
                  color={COLORS.primary} 
                  style={styles.featureIcon}
                />
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Location Picker Component */}
        <View style={styles.pickerSection}>
          <LocationPicker
            currentLocation={selectedLocation}
            onLocationSelect={handleLocationSelect}
            onLocationUpdate={handleLocationUpdate}
            placeholder="Search for delivery location..."
            mapRegion={{
              latitude: 1.2834,
              longitude: 103.8607,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05
            }}
          />
        </View>

        {/* Selected Location Display */}
        {deliveryAddress && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Selected Location</Text>
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Ionicons 
                  name="location" 
                  size={20} 
                  color={COLORS.primary} 
                />
                <Text style={styles.resultLocationTitle}>
                  {deliveryAddress.title}
                </Text>
              </View>
              {deliveryAddress.subtitle && (
                <Text style={styles.resultAddress}>
                  {deliveryAddress.subtitle}
                </Text>
              )}
              {deliveryAddress.coordinate && (
                <Text style={styles.resultCoordinates}>
                  {deliveryAddress.coordinate.latitude.toFixed(6)}, {deliveryAddress.coordinate.longitude.toFixed(6)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Interaction Guide */}
        <View style={styles.guideSection}>
          <Text style={styles.guideTitle}>Interaction Guide</Text>
          
          {interactionGuide.map((guide, index) => (
            <View key={index} style={styles.guideItem}>
              <View style={styles.guideHeader}>
                <Ionicons 
                  name={guide.icon} 
                  size={18} 
                  color={COLORS.primary} 
                />
                <Text style={styles.guideItemTitle}>{guide.title}</Text>
              </View>
              <Text style={styles.guideItemDescription}>{guide.description}</Text>
            </View>
          ))}
        </View>

        {/* Technical Features */}
        <View style={styles.technicalSection}>
          <Text style={styles.technicalTitle}>Technical Features</Text>
          
          {technicalFeatures.map((feature, index) => (
            <View key={index} style={styles.technicalItem}>
              <View style={styles.technicalDot} />
              <Text style={styles.technicalText}>{feature}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Feature data
const features = [
  { icon: 'hand-right-outline', text: 'Full-width tap area with haptic feedback' },
  { icon: 'swap-vertical-outline', text: 'Smooth bottom sheet with drag gestures' },
  { icon: 'search-outline', text: 'Auto-focus search with clear animation' },
  { icon: 'list-outline', text: 'Swipe-to-delete on recent locations' },
  { icon: 'refresh-outline', text: 'Pull-to-refresh current location' },
  { icon: 'map-outline', text: 'Interactive map with pinch & rotate' },
  { icon: 'checkmark-circle-outline', text: 'Swipe-to-confirm button' },
  { icon: 'accessibility-outline', text: 'Full accessibility support' }
];

const interactionGuide = [
  {
    icon: 'finger-print-outline',
    title: 'Header Interaction',
    description: 'Tap the location header to open the picker. The header provides immediate haptic feedback and smooth arrow animation.'
  },
  {
    icon: 'swap-vertical-outline',
    title: 'Bottom Sheet Gestures',
    description: 'Drag the sheet up/down to open/close. The sheet uses spring physics for natural motion and can be dismissed by dragging down 25% of its height.'
  },
  {
    icon: 'search-outline',
    title: 'Search Experience',
    description: 'The search field auto-focuses when opened. The clear button has a ripple effect and fades out smoothly when clearing text.'
  },
  {
    icon: 'list-outline',
    title: 'List Interactions',
    description: 'Each row highlights on tap with fade-out over 200ms. Swipe left on recent items to reveal delete button.'
  },
  {
    icon: 'map-outline',
    title: 'Map Controls',
    description: 'In map mode, use one-finger drag to move, pinch to zoom, and two-finger rotate. Pin drops with bounce animation.'
  },
  {
    icon: 'checkmark-circle-outline',
    title: 'Confirmation',
    description: 'Tap to confirm or swipe right on the confirm button. Swipe gesture provides visual feedback and haptic success.'
  }
];

const technicalFeatures = [
  '48dp minimum touch targets for accessibility',
  'Spring animations with ~0.8 damping coefficient',
  'Inertia scrolling with momentum preservation',
  'VoiceOver/TalkBack support with descriptive labels',
  'Reduced motion support for accessibility preferences',
  'Haptic feedback integration (iOS & Android)',
  'Gesture velocity-based animations',
  'Cross-fade animations with spring physics'
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    marginBottom: SPACING.xs
  },
  headerSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary
  },
  content: {
    flex: 1
  },
  contentContainer: {
    paddingBottom: SPACING.xxl
  },
  demoSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    marginBottom: SPACING.sm
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.sm
  },
  sectionDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 22
  },
  featuresList: {
    marginTop: SPACING.sm
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  featureIcon: {
    marginRight: SPACING.sm,
    width: 20
  },
  featureText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    flex: 1
  },
  pickerSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    marginBottom: SPACING.sm
  },
  resultSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    marginBottom: SPACING.sm
  },
  resultTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    marginBottom: SPACING.sm
  },
  resultCard: {
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs
  },
  resultLocationTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: SPACING.sm
  },
  resultAddress: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs
  },
  resultCoordinates: {
    ...TYPOGRAPHY.small,
    color: COLORS.inactive,
    fontFamily: 'monospace'
  },
  guideSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    marginBottom: SPACING.sm
  },
  guideTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.md
  },
  guideItem: {
    marginBottom: SPACING.md
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs
  },
  guideItemTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.text,
    marginLeft: SPACING.sm
  },
  guideItemDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginLeft: 26 // Align with title text
  },
  technicalSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.card
  },
  technicalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
    marginBottom: SPACING.md
  },
  technicalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm
  },
  technicalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 8,
    marginRight: SPACING.sm
  },
  technicalText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 18
  }
});

export default LocationPickerDemo;